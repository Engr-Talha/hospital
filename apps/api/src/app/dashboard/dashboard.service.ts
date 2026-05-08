import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DashboardOverview,
  LabBenchOverview,
  ReceptionDeskOverview,
  ReceptionistPerformanceOverview,
  Role,
} from '@hospital/shared';
import { Repository } from 'typeorm';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
import { PatientEntity } from '../patients/patient.entity';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(PatientEntity)
    private readonly patientsRepo: Repository<PatientEntity>,
    @InjectRepository(PatientFeeLineEntity)
    private readonly feeLinesRepo: Repository<PatientFeeLineEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
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

  async getOverview(): Promise<DashboardOverview> {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(now);
    start7.setDate(start7.getDate() - 7);
    start7.setHours(0, 0, 0, 0);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const start30 = new Date(now);
    start30.setDate(start30.getDate() - 29);
    start30.setHours(0, 0, 0, 0);

    const totalPatients = await this.patientsRepo.count();
    const todayPatients = await this.patientsRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :d', { d: startToday })
      .getCount();
    const weekPatients = await this.patientsRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :d', { d: start7 })
      .getCount();
    const monthPatients = await this.patientsRepo
      .createQueryBuilder('p')
      .where('p.created_at >= :d', { d: startMonth })
      .getCount();

    const genderRows = await this.patientsRepo
      .createQueryBuilder('p')
      .select('p.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.gender')
      .getRawMany<{ gender: string; count: string }>();

    const dailyRegRows = await this.patientsRepo
      .createQueryBuilder('p')
      .select("TO_CHAR(DATE_TRUNC('day', p.created_at), 'YYYY-MM-DD')", 'd')
      .addSelect('COUNT(*)', 'c')
      .where('p.created_at >= :from', { from: start30 })
      .groupBy("DATE_TRUNC('day', p.created_at)")
      .addGroupBy("TO_CHAR(DATE_TRUNC('day', p.created_at), 'YYYY-MM-DD')")
      .orderBy(
        "TO_CHAR(DATE_TRUNC('day', p.created_at), 'YYYY-MM-DD')",
        'ASC',
      )
      .getRawMany<{ d: string; c: string }>();

    const totalChargeLines = await this.feeLinesRepo.count();
    const sumAllRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .getRawOne<{ s: string }>();
    const totalRevenue = this.money(this.parseNum(sumAllRaw?.s));

    const sumTodayRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_at >= :d', { d: startToday })
      .getRawOne<{ s: string }>();
    const feesToday = this.money(this.parseNum(sumTodayRaw?.s));

    const sumWeekRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_at >= :d', { d: start7 })
      .getRawOne<{ s: string }>();
    const feesWeek = this.money(this.parseNum(sumWeekRaw?.s));

    const sumMonthRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_at >= :d', { d: startMonth })
      .getRawOne<{ s: string }>();
    const feesMonth = this.money(this.parseNum(sumMonthRaw?.s));

    const patientsWithChargesRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COUNT(DISTINCT f.patient_id)', 'c')
      .getRawOne<{ c: string }>();
    const patientsWithCharges = parseInt(patientsWithChargesRaw?.c ?? '0', 10);
    const avgRev =
      patientsWithCharges > 0
        ? this.money(this.parseNum(sumAllRaw?.s) / patientsWithCharges)
        : '0.00';

    const dailyRevRows = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select("TO_CHAR(DATE_TRUNC('day', f.created_at), 'YYYY-MM-DD')", 'd')
      .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_at >= :from', { from: start30 })
      .groupBy("DATE_TRUNC('day', f.created_at)")
      .addGroupBy("TO_CHAR(DATE_TRUNC('day', f.created_at), 'YYYY-MM-DD')")
      .orderBy(
        "TO_CHAR(DATE_TRUNC('day', f.created_at), 'YYYY-MM-DD')",
        'ASC',
      )
      .getRawMany<{ d: string; s: string }>();

    const byCategoryRows = await this.feeLinesRepo
      .createQueryBuilder('f')
      .leftJoin('f.catalogItem', 'c')
      .select('COALESCE(c.name, f.description)', 'category')
      .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
      .addSelect('COUNT(*)', 'chargecount')
      .groupBy('COALESCE(c.name, f.description)')
      .orderBy('COALESCE(SUM(f.line_total::numeric),0)', 'DESC')
      .limit(12)
      .getRawMany<{ category: string; total: string; chargecount: string }>();

    const topServices = byCategoryRows.slice(0, 8).map((r) => ({
      name: r.category,
      total: this.money(this.parseNum(r.total)),
      count: parseInt(r.chargecount, 10),
    }));

    const recent = await this.patientsRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      select: ['id', 'mrn', 'firstName', 'lastName', 'createdAt'],
    });

    return {
      generatedAt: new Date().toISOString(),
      patients: {
        total: totalPatients,
        today: todayPatients,
        last7Days: weekPatients,
        thisMonth: monthPatients,
        byGender: genderRows.map((g) => ({
          gender: g.gender,
          count: parseInt(g.count, 10),
        })),
        dailyRegistrations: dailyRegRows.map((r) => ({
          date: r.d,
          count: parseInt(r.c, 10),
        })),
      },
      fees: {
        totalRevenue,
        today: feesToday,
        last7Days: feesWeek,
        thisMonth: feesMonth,
        totalChargeLines,
        patientsWithCharges,
        avgRevenuePerChargedPatient: avgRev,
        dailyRevenue: dailyRevRows.map((r) => ({
          date: r.d,
          total: this.money(this.parseNum(r.s)),
        })),
        byCategory: byCategoryRows.map((r) => ({
          category: r.category,
          total: this.money(this.parseNum(r.total)),
          chargeCount: parseInt(r.chargecount, 10),
        })),
        topServices,
      },
      recentPatients: recent.map((p) => ({
        id: p.id,
        mrn: p.mrn,
        firstName: p.firstName,
        lastName: p.lastName,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  /** Metrics scoped to one receptionist (patients they registered, fees they posted). */
  async getReceptionDesk(userId: string): Promise<ReceptionDeskOverview> {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(now);
    start7.setDate(start7.getDate() - 7);
    start7.setHours(0, 0, 0, 0);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPatients = await this.patientsRepo.count({
      where: { registeredById: userId },
    });
    const todayPatients = await this.patientsRepo
      .createQueryBuilder('p')
      .where('p.registered_by_id = :uid', { uid: userId })
      .andWhere('p.created_at >= :d', { d: startToday })
      .getCount();
    const weekPatients = await this.patientsRepo
      .createQueryBuilder('p')
      .where('p.registered_by_id = :uid', { uid: userId })
      .andWhere('p.created_at >= :d', { d: start7 })
      .getCount();
    const monthPatients = await this.patientsRepo
      .createQueryBuilder('p')
      .where('p.registered_by_id = :uid', { uid: userId })
      .andWhere('p.created_at >= :d', { d: startMonth })
      .getCount();

    const sumTodayRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_by_id = :uid', { uid: userId })
      .andWhere('f.created_at >= :d', { d: startToday })
      .getRawOne<{ s: string }>();
    const feesToday = this.money(this.parseNum(sumTodayRaw?.s));

    const sumWeekRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_by_id = :uid', { uid: userId })
      .andWhere('f.created_at >= :d', { d: start7 })
      .getRawOne<{ s: string }>();
    const feesWeek = this.money(this.parseNum(sumWeekRaw?.s));

    const sumMonthRaw = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.line_total::numeric),0)', 's')
      .where('f.created_by_id = :uid', { uid: userId })
      .andWhere('f.created_at >= :d', { d: startMonth })
      .getRawOne<{ s: string }>();
    const feesMonth = this.money(this.parseNum(sumMonthRaw?.s));

    const totalChargeLines = await this.feeLinesRepo.count({
      where: { createdById: userId },
    });

    const recent = await this.patientsRepo.find({
      where: { registeredById: userId },
      order: { createdAt: 'DESC' },
      take: 10,
      select: ['id', 'mrn', 'firstName', 'lastName', 'createdAt'],
    });

    return {
      generatedAt: new Date().toISOString(),
      patients: {
        total: totalPatients,
        today: todayPatients,
        last7Days: weekPatients,
        thisMonth: monthPatients,
      },
      fees: {
        today: feesToday,
        last7Days: feesWeek,
        thisMonth: feesMonth,
        totalChargeLines,
      },
      recentPatients: recent.map((p) => ({
        id: p.id,
        mrn: p.mrn,
        firstName: p.firstName,
        lastName: p.lastName,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  }

  async getReceptionistPerformance(): Promise<ReceptionistPerformanceOverview> {
    const receptionists = await this.usersRepo.find({
      where: { role: Role.RECEPTIONIST },
      order: { name: 'ASC' },
    });

    const patientRows = await this.patientsRepo
      .createQueryBuilder('p')
      .select('p.registered_by_id', 'uid')
      .addSelect('COUNT(*)', 'cnt')
      .where('p.registered_by_id IS NOT NULL')
      .groupBy('p.registered_by_id')
      .getRawMany<{ uid: string; cnt: string }>();

    const feeRows = await this.feeLinesRepo
      .createQueryBuilder('f')
      .select('f.created_by_id', 'uid')
      .addSelect('COUNT(*)', 'lines')
      .addSelect('COALESCE(SUM(f.line_total::numeric),0)', 'total')
      .where('f.created_by_id IS NOT NULL')
      .groupBy('f.created_by_id')
      .getRawMany<{ uid: string; lines: string; total: string }>();

    const byPatients = new Map(
      patientRows.map((r) => [r.uid, parseInt(r.cnt, 10)]),
    );
    const byFees = new Map(
      feeRows.map((r) => [
        r.uid,
        {
          lines: parseInt(r.lines, 10),
          total: this.money(this.parseNum(r.total)),
        },
      ]),
    );

    return {
      generatedAt: new Date().toISOString(),
      receptionists: receptionists.map((u) => {
        const f = byFees.get(u.id);
        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          patientsRegisteredTotal: byPatients.get(u.id) ?? 0,
          feeLinesPostedTotal: f?.lines ?? 0,
          feesCollectedTotal: f?.total ?? '0.00',
        };
      }),
    };
  }

  getLabBench(): LabBenchOverview {
    return {
      generatedAt: new Date().toISOString(),
      title: 'Laboratory',
      summary:
        'Specimen intake, worklists, and results will be wired here. Use Patients to look up demographics by MRN.',
    };
  }
}
