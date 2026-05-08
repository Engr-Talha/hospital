export interface DashboardGenderSlice {
  gender: string;
  count: number;
}

export interface DashboardDailyPoint {
  date: string;
  count?: number;
  total?: string;
}

export interface DashboardCategorySlice {
  category: string;
  total: string;
  chargeCount: number;
}

export interface DashboardTopService {
  name: string;
  total: string;
  count: number;
}

export interface DashboardRecentPatient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface DashboardOverview {
  generatedAt: string;
  patients: {
    total: number;
    today: number;
    last7Days: number;
    thisMonth: number;
    byGender: DashboardGenderSlice[];
    dailyRegistrations: DashboardDailyPoint[];
  };
  fees: {
    totalRevenue: string;
    today: string;
    last7Days: string;
    thisMonth: string;
    totalChargeLines: number;
    patientsWithCharges: number;
    avgRevenuePerChargedPatient: string;
    dailyRevenue: DashboardDailyPoint[];
    byCategory: DashboardCategorySlice[];
    topServices: DashboardTopService[];
  };
  recentPatients: DashboardRecentPatient[];
}

/** Front-desk snapshot (reception); lighter than full admin overview. */
export interface ReceptionDeskOverview {
  generatedAt: string;
  patients: {
    total: number;
    today: number;
    last7Days: number;
    thisMonth: number;
  };
  fees: {
    today: string;
    last7Days: string;
    thisMonth: string;
    totalChargeLines: number;
  };
  recentPatients: DashboardRecentPatient[];
}

/** Placeholder payload until lab workflows are implemented. */
export interface LabBenchOverview {
  generatedAt: string;
  title: string;
  summary: string;
}

/** Admin: per–front-desk user totals (patients registered vs fees posted). */
export interface ReceptionistPerformanceRow {
  userId: string;
  name: string;
  email: string;
  patientsRegisteredTotal: number;
  feeLinesPostedTotal: number;
  feesCollectedTotal: string;
}

export interface ReceptionistPerformanceOverview {
  generatedAt: string;
  receptionists: ReceptionistPerformanceRow[];
}
