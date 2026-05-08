export type LabReportFieldType = 'text' | 'textarea' | 'richtext';

export interface LabReportFieldSchema {
  key: string;
  label: string;
  type: LabReportFieldType;
}

/** Active template for technicians (and admin). */
export interface LabReportTemplateSummary {
  id: string;
  slug: string;
  title: string;
  feeCatalogItemId: string | null;
  feeCatalogItemName?: string | null;
  fieldsSchema: LabReportFieldSchema[];
  isActive: boolean;
  sortOrder: number;
}

export interface LabReportRecordSummary {
  id: string;
  templateId: string;
  templateTitle: string;
  patientMrn: string;
  patientName: string;
  createdAt: string;
  createdByName?: string;
}

/** Full record for print / review. */
export interface LabReportRecordDetail {
  id: string;
  templateId: string;
  templateTitle: string;
  templateSlug: string;
  patientMrn: string;
  patientName: string;
  fieldValues: Record<string, string>;
  fieldsSchema: LabReportFieldSchema[];
  createdAt: string;
  createdByName?: string;
}

export interface CreateLabReportRecordDto {
  templateId: string;
  patientMrn: string;
  patientName: string;
  fieldValues: Record<string, string>;
}

export interface UpdateLabReportTemplateDto {
  feeCatalogItemId?: string | null;
  isActive?: boolean;
}
