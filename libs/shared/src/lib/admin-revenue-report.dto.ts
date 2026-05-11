export type RevenueReportGroupBy = 'day' | 'week' | 'month';

export interface RevenueReportBucket {
  /** Human label, e.g. 2026-05-12 or 2026-05 for month */
  periodLabel: string;
  /** Start of bucket in ISO UTC */
  periodStart: string;
  lineCount: number;
  total: string;
}

export interface RevenueReportStaffRow {
  userId: string;
  name: string;
  email: string;
  lineCount: number;
  total: string;
  buckets: RevenueReportBucket[];
}

export interface LabReportCreatorBucket {
  periodLabel: string;
  periodStart: string;
  reportCount: number;
}

export interface LabReportCreatorRow {
  userId: string;
  name: string;
  email: string;
  reportCount: number;
  buckets: LabReportCreatorBucket[];
}

export interface AdminRevenueReportResponse {
  generatedAt: string;
  from: string;
  toInclusive: string;
  groupBy: RevenueReportGroupBy;
  grandTotalFees: string;
  grandTotalFeeLines: number;
  /** Fee lines whose catalog item is linked to a lab report template */
  grandTotalLabFees: string;
  grandTotalLabFeeLines: number;
  totalLabReports: number;
  receptionists: RevenueReportStaffRow[];
  doctors: RevenueReportStaffRow[];
  labReportsByCreator: LabReportCreatorRow[];
  /** Lab-linked catalog fee lines over time (empty if no template ↔ catalog link). */
  labFeeBuckets: RevenueReportBucket[];
}
