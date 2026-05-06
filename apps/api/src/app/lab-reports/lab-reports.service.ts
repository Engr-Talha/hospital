import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateLabReportRecordDto,
  LabReportRecordDetail,
  LabReportRecordSummary,
  LabReportTemplateSummary,
  UpdateLabReportTemplateDto,
} from '@hospital/shared';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { FeeCatalogService } from '../fee-catalog/fee-catalog.service';
import {
  LabReportFieldSchemaRow,
  LabReportTemplateEntity,
} from './lab-report-template.entity';
import { LabReportRecordEntity } from './lab-report-record.entity';

/** Source names mirror files under `report-template/*.doc` (without extension). */
const REPORT_TEMPLATE_TITLES: readonly string[] = [
  'chest ultrasound',
  'FWB- Twins',
  'NECK',
  'ANOMALY SCAN',
  'FWB',
  'aaa. female',
  'aa.male',
  'OBS (2)',
  'BPP FWB',
  'CAROTID DOPPLER',
  'KUB',
  'ABD-OBS',
  'knee joint',
  'FEMALE R',
  'Brain',
  'THYROID ULTRASOUND',
  'CRL NAD',
  'BREAST',
  'G.sac',
  'ABD-CRL',
] as const;

const DEFAULT_FIELDS: LabReportFieldSchemaRow[] = [
  {
    key: 'clinicalHistory',
    label: 'Clinical history / indication',
    type: 'textarea',
  },
  { key: 'technique', label: 'Technique / protocol', type: 'textarea' },
  { key: 'findings', label: 'Findings / measurements', type: 'textarea' },
  { key: 'impression', label: 'Impression', type: 'textarea' },
  {
    key: 'recommendation',
    label: 'Recommendation / advice',
    type: 'textarea',
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class LabReportsService {
  constructor(
    @InjectRepository(LabReportTemplateEntity)
    private readonly templatesRepo: Repository<LabReportTemplateEntity>,
    @InjectRepository(LabReportRecordEntity)
    private readonly recordsRepo: Repository<LabReportRecordEntity>,
    private readonly feeCatalogService: FeeCatalogService,
  ) {}

  async ensureSeedTemplates(): Promise<void> {
    let order = 0;
    for (const title of REPORT_TEMPLATE_TITLES) {
      const slug = slugify(title);
      if (!slug) continue;
      const existing = await this.templatesRepo.findOne({ where: { slug } });
      if (existing) continue;
      await this.templatesRepo.save(
        this.templatesRepo.create({
          slug,
          title: title.trim(),
          fieldsSchema: DEFAULT_FIELDS,
          isActive: true,
          sortOrder: order++,
          feeCatalogItem: null,
        }),
      );
    }
  }

  private toTemplateSummary(
    row: LabReportTemplateEntity,
  ): LabReportTemplateSummary {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      feeCatalogItemId: row.feeCatalogItem?.id ?? null,
      feeCatalogItemName: row.feeCatalogItem?.name ?? null,
      fieldsSchema: row.fieldsSchema,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    };
  }

  async listTemplates(): Promise<LabReportTemplateSummary[]> {
    const rows = await this.templatesRepo.find({
      where: { isActive: true },
      relations: ['feeCatalogItem'],
      order: { sortOrder: 'ASC', title: 'ASC' },
    });
    return rows.map((r) => this.toTemplateSummary(r));
  }

  async listTemplatesAdmin(): Promise<LabReportTemplateSummary[]> {
    const rows = await this.templatesRepo.find({
      relations: ['feeCatalogItem'],
      order: { sortOrder: 'ASC', title: 'ASC' },
    });
    return rows.map((r) => this.toTemplateSummary(r));
  }

  async getTemplateForLab(id: string): Promise<LabReportTemplateSummary> {
    const row = await this.templatesRepo.findOne({
      where: { id, isActive: true },
      relations: ['feeCatalogItem'],
    });
    if (!row) throw new NotFoundException('Template not found');
    return this.toTemplateSummary(row);
  }

  async updateTemplateAdmin(
    id: string,
    dto: UpdateLabReportTemplateDto,
  ): Promise<LabReportTemplateSummary> {
    const row = await this.templatesRepo.findOne({
      where: { id },
      relations: ['feeCatalogItem'],
    });
    if (!row) throw new NotFoundException('Template not found');

    if (dto.isActive !== undefined) {
      row.isActive = dto.isActive;
    }

    if (dto.feeCatalogItemId !== undefined) {
      if (dto.feeCatalogItemId === null) {
        row.feeCatalogItem = null;
      } else {
        row.feeCatalogItem = await this.feeCatalogService.findOneEntity(
          dto.feeCatalogItemId,
        );
      }
    }

    await this.templatesRepo.save(row);
    const reloaded = await this.templatesRepo.findOne({
      where: { id },
      relations: ['feeCatalogItem'],
    });
    return this.toTemplateSummary(reloaded!);
  }

  private validateFieldValues(
    schema: LabReportFieldSchemaRow[],
    values: Record<string, string>,
  ): void {
    const keys = new Set(schema.map((f) => f.key));
    for (const k of Object.keys(values)) {
      if (!keys.has(k)) {
        throw new BadRequestException(`Unknown field: ${k}`);
      }
    }
    for (const f of schema) {
      if (!(f.key in values)) {
        throw new BadRequestException(`Missing field: ${f.key}`);
      }
      if (typeof values[f.key] !== 'string') {
        throw new BadRequestException(`Invalid value for: ${f.key}`);
      }
    }
  }

  async createRecord(
    userId: string,
    dto: CreateLabReportRecordDto,
  ): Promise<LabReportRecordDetail> {
    const template = await this.templatesRepo.findOne({
      where: { id: dto.templateId, isActive: true },
    });
    if (!template) throw new NotFoundException('Template not found');

    this.validateFieldValues(template.fieldsSchema, dto.fieldValues);

    const saved = await this.recordsRepo.save(
      this.recordsRepo.create({
        template,
        patientMrn: dto.patientMrn.trim(),
        patientName: dto.patientName.trim(),
        fieldValues: dto.fieldValues,
        createdBy: { id: userId } as UserEntity,
      }),
    );
    return this.getRecordDetail(saved.id);
  }

  async listRecords(limit = 50): Promise<LabReportRecordSummary[]> {
    const safe = Math.min(Math.max(limit, 1), 200);
    const rows = await this.recordsRepo.find({
      relations: ['template', 'createdBy'],
      order: { createdAt: 'DESC' },
      take: safe,
    });
    return rows.map((r) => ({
      id: r.id,
      templateId: r.template.id,
      templateTitle: r.template.title,
      patientMrn: r.patientMrn,
      patientName: r.patientName,
      createdAt: r.createdAt.toISOString(),
      createdByName: r.createdBy.name,
    }));
  }

  async getRecordDetail(id: string): Promise<LabReportRecordDetail> {
    const r = await this.recordsRepo.findOne({
      where: { id },
      relations: ['template', 'createdBy'],
    });
    if (!r) throw new NotFoundException('Report not found');
    return {
      id: r.id,
      templateId: r.template.id,
      templateTitle: r.template.title,
      templateSlug: r.template.slug,
      patientMrn: r.patientMrn,
      patientName: r.patientName,
      fieldValues: r.fieldValues,
      fieldsSchema: r.template.fieldsSchema,
      createdAt: r.createdAt.toISOString(),
      createdByName: r.createdBy.name,
    };
  }
}
