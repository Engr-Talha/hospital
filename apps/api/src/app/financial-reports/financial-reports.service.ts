import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AdminRevenueReportResponse,
  LabReportCreatorRow,
  RevenueReportBucket,
  RevenueReportGroupBy,
  RevenueReportStaffRow,
  Role,
} from '@hospital/shared';
import { Repository } from 'typeorm';
import { LabReportRecordEntity } from '../lab-reports/lab-report-record.entity';
import { LabReportTemplateEntity } from '../lab-reports/lab-report-template.entity';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
@Injectable()
export class FinancialReportsService {
  constructor(
    @InjectRepository(PatientFeeLineEntity)
    private readonly feeLinesRepo: Repository<PatientFeeLineEntity>,
    @InjectRepository(LabReportRecordEntity)
    private readonly labRecordsRepo: Repository<LabReportRecordEntity>,
    @InjectRepository(LabReportTemplateEntity)
    private readonly labTemplatesRepo: Repository<LabReportTemplateEntity>,
  ) {}

  private money(n: number): string {
    if (Number.isNaN(n) || !Number.isFinite(n)) return '0.00';
    return (Math.round(n * 100) / 100).toFixed(2);
  }

  private parseNum(v: string | number | null | undefined): number {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isNaN(n) ? 0 : n;
  }

  private dayBoundsUtc(fromStr: string, toStr: string): { from: Date; toEnd: Date } {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(fromStr) || !re.test(toStr)) {
      throw new BadRequestException(
        'from and to must be calendar dates in YYYY-MM-DD format.',
      );
    }
    const from = new Date(`${fromStr}T00:00:00.000Z`);
    const toEnd = new Date(`${toStr}T23:59:59.999Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(toEnd.getTime()) || from > toEnd) {
      throw new BadRequestException('Invalid or inverted date range.');
    }
    return { from, toEnd };
  }

  private pgPeriodFragments(
    groupBy: RevenueReportGroupBy,
    columnSql: string,
  ): { labelExpr: string; truncExpr: string } {
    switch (groupBy) {
      case 'day':
        return {
          labelExpr: `TO_CHAR(DATE_TRUNC('day', ${columnSql}), 'YYYY-MM-DD')`,
          truncExpr: `DATE_TRUNC('day', ${columnSql})`,
        };
      case 'week':
        return {
          labelExpr: `TO_CHAR(DATE_TRUNC('week', ${columnSql}), 'YYYY-MM-DD')`,
          truncExpr: `DATE_TRUNC('week', ${columnSql})`,
        };
      case 'month':
        return {
          labelExpr: `TO_CHAR(DATE_TRUNC('month', ${columnSql}), 'YYYY-MM')`,
          truncExpr: `DATE_TRUNC('month', ${columnSql})`,
        };
    }
  }

  private staffRowsFromFeeQuery(
    rows: Array<{
      userId: string;
      name: string;
      email: string;
      periodLabel: string;
      periodStart: Date;
      lineCount: string;
      total: string;
    }>,
  ): RevenueReportStaffRow[] {
    const map = new Map<string, RevenueReportStaffRow>();
    for (const r of rows) {
      let row = map.get(r.userId);
      if (!row) {
        row = {
          userId: r.userId,
          name: r.name,
          email: r.email,
          lineCount: 0,
          total: '0.00',
          buckets: [],
        };
        map.set(r.userId, row);
      }
      const lc = parseInt(r.lineCount, 10);
      const tot = this.parseNum(r.total);
      row.lineCount += lc;
      row.buckets.push({
        periodLabel: r.periodLabel,
        periodStart:
          r.periodStart instanceof Date
            ? r.periodStart.toISOString()
            : new Date(r.periodStart).toISOString(),
        lineCount: lc,
        total: this.money(tot),
      });
    }
    for (const row of map.values()) {
      const sum = row.buckets.reduce((a, b) => a + this.parseNum(b.total), 0);
      row.total = this.money(sum);
      row.buckets.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  private async labCatalogItemIds(): Promise<string[]> {
    const raw = await this.labTemplatesRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.fee_catalog_item_id', 'id')
      .where('t.fee_catalog_item_id IS NOT NULL')
      .getRawMany<{ id: string }>();
    return raw.map((r) => r.id);
  }

  async getRevenueReport(
    fromStr: string,
    toStr: string,
    groupBy: RevenueReportGroupBy,
  ): Promise<AdminRevenueReportResponse> {
    const { from, toEnd } = this.dayBoundsUtc(fromStr, toStr);
    const pf = this.pgPeriodFragments(groupBy, 'f.created_at');
    const pr = this.pgPeriodFragments(groupBy, 'r.created_at');

    const grandRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COUNT(*)', 'lines')
      .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
      .where('f.created_at >= :from', { from })
      .andWhere('f.created_at <= :toEnd', { toEnd })
      .getRawOne<{ lines: string; total: string }>();

    const grandTotalFeeLines = parseInt(grandRaw?.lines ?? '0', 10);
    const grandTotalFees = this.money(this.parseNum(grandRaw?.total));

    const labIds = await this.labCatalogItemIds();
    let grandTotalLabFees = '0.00';
    let grandTotalLabFeeLines = 0;
    const labFeeBuckets: RevenueReportBucket[] = [];

    if (labIds.length > 0) {
      const labSumRaw = await this.feeLinesRepo
        .createQueryBuilder('f')
        .select('COUNT(*)', 'lines')
        .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
        .where('f.created_at >= :from', { from })
        .andWhere('f.created_at <= :toEnd', { toEnd })
        .andWhere('f.catalog_item_id IN (:...labIds)', { labIds })
        .getRawOne<{ lines: string; total: string }>();
      grandTotalLabFeeLines = parseInt(labSumRaw?.lines ?? '0', 10);
      grandTotalLabFees = this.money(this.parseNum(labSumRaw?.total));

      const labBucketRows = await this.feeLinesRepo
        .createQueryBuilder('f')
        .select(pf.labelExpr, 'periodLabel')
        .addSelect(pf.truncExpr, 'periodStart')
        .addSelect('COUNT(*)', 'lineCount')
        .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
        .where('f.created_at >= :from', { from })
        .andWhere('f.created_at <= :toEnd', { toEnd })
        .andWhere('f.catalog_item_id IN (:...labIds)', { labIds })
        .groupBy(pf.truncExpr)
        .addGroupBy(pf.labelExpr)
        .orderBy(pf.truncExpr, 'ASC')
        .getRawMany<{
          periodLabel: string;
          periodStart: Date;
          lineCount: string;
          total: string;
        }>();

      for (const b of labBucketRows) {
        labFeeBuckets.push({
          periodLabel: b.periodLabel,
          periodStart:
            b.periodStart instanceof Date
              ? b.periodStart.toISOString()
              : new Date(b.periodStart).toISOString(),
          lineCount: parseInt(b.lineCount, 10),
          total: this.money(this.parseNum(b.total)),
        });
      }
    }

    const recRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .innerJoin('f.createdByUser', 'u')
      .select('u.id', 'userId')
      .addSelect('u.name', 'name')
      .addSelect('u.email', 'email')
      .addSelect(pf.labelExpr, 'periodLabel')
      .addSelect(pf.truncExpr, 'periodStart')
      .addSelect('COUNT(*)', 'lineCount')
      .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
      .where('f.created_at >= :from', { from })
      .andWhere('f.created_at <= :toEnd', { toEnd })
      .andWhere('f.created_by_id IS NOT NULL')
      .andWhere('u.role = :role', { role: Role.RECEPTIONIST })
      .groupBy('u.id')
      .addGroupBy('u.name')
      .addGroupBy('u.email')
      .addGroupBy(pf.truncExpr)
      .addGroupBy(pf.labelExpr)
      .orderBy('u.name', 'ASC')
      .addOrderBy(pf.truncExpr, 'ASC')
      .getRawMany();

    const docRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .innerJoin('f.patient', 'p')
      .innerJoin('p.appointmentDoctor', 'doc')
      .select('doc.id', 'userId')
      .addSelect('doc.name', 'name')
      .addSelect('doc.email', 'email')
      .addSelect(pf.labelExpr, 'periodLabel')
      .addSelect(pf.truncExpr, 'periodStart')
      .addSelect('COUNT(*)', 'lineCount')
      .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
      .where('f.created_at >= :from', { from })
      .andWhere('f.created_at <= :toEnd', { toEnd })
      .andWhere('p.appointment_doctor_id IS NOT NULL')
      .groupBy('doc.id')
      .addGroupBy('doc.name')
      .addGroupBy('doc.email')
      .addGroupBy(pf.truncExpr)
      .addGroupBy(pf.labelExpr)
      .orderBy('doc.name', 'ASC')
      .addOrderBy(pf.truncExpr, 'ASC')
      .getRawMany();

    const labReportCountRaw = await this.labRecordsRepo
      .createQueryBuilder('r')
      .select('COUNT(*)', 'c')
      .where('r.created_at >= :from', { from })
      .andWhere('r.created_at <= :toEnd', { toEnd })
      .getRawOne<{ c: string }>();
    const totalLabReports = parseInt(labReportCountRaw?.c ?? '0', 10);

    const labCreatorRaw = await this.labRecordsRepo
      .createQueryBuilder('r')
      .innerJoin('r.createdBy', 'u')
      .select('u.id', 'userId')
      .addSelect('u.name', 'name')
      .addSelect('u.email', 'email')
      .addSelect(pr.labelExpr, 'periodLabel')
      .addSelect(pr.truncExpr, 'periodStart')
      .addSelect('COUNT(*)', 'reportCount')
      .where('r.created_at >= :from', { from })
      .andWhere('r.created_at <= :toEnd', { toEnd })
      .groupBy('u.id')
      .addGroupBy('u.name')
      .addGroupBy('u.email')
      .addGroupBy(pr.truncExpr)
      .addGroupBy(pr.labelExpr)
      .orderBy('u.name', 'ASC')
      .addOrderBy(pr.truncExpr, 'ASC')
      .getRawMany<{
        userId: string;
        name: string;
        email: string;
        periodLabel: string;
        periodStart: Date;
        reportCount: string;
      }>();

    const labByCreatorMap = new Map<string, LabReportCreatorRow>();
    for (const r of labCreatorRaw) {
      let row = labByCreatorMap.get(r.userId);
      if (!row) {
        row = {
          userId: r.userId,
          name: r.name,
          email: r.email,
          reportCount: 0,
          buckets: [],
        };
        labByCreatorMap.set(r.userId, row);
      }
      const c = parseInt(r.reportCount, 10);
      row.reportCount += c;
      row.buckets.push({
        periodLabel: r.periodLabel,
        periodStart:
          r.periodStart instanceof Date
            ? r.periodStart.toISOString()
            : new Date(r.periodStart).toISOString(),
        reportCount: c,
      });
    }
    for (const row of labByCreatorMap.values()) {
      row.buckets.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
    }
    const labReportsByCreator = [...labByCreatorMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return {
      generatedAt: new Date().toISOString(),
      from: fromStr,
      toInclusive: toStr,
      groupBy,
      grandTotalFees,
      grandTotalFeeLines,
      grandTotalLabFees,
      grandTotalLabFeeLines,
      totalLabReports,
      receptionists: this.staffRowsFromFeeQuery(recRaw as never),
      doctors: this.staffRowsFromFeeQuery(docRaw as never),
      labReportsByCreator,
      labFeeBuckets,
    };
  }
}
