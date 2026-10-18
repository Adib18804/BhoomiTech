import api from '../utils/api';
import authService from './authService';

export interface DashboardCase {
  case_id: string;
  status: string;
  overall_risk_level: string | null;
  district_name: string;
  upazila_name: string;
  mouza_name: string;
  survey_type: string;
  khatian_no: string;
  dag_no: string;
  parcel_id: string | null;
  initiated_at: string;
  completed_at: string | null;
  has_report: boolean;
}

export interface DashboardLandReference {
  parcel_id: string;
  district_name: string;
  upazila_name: string;
  mouza_name: string;
  survey_type: string;
  khatian_no: string;
  dag_no: string;
  area_decimal: number | null;
  last_checked_at: string;
}

export interface CitizenDashboard {
  totals: {
    total_cases: number;
    completed_cases: number;
    total_reports: number;
  };
  risk_summary: Record<string, number>;
  latest_case: DashboardCase | null;
  recent_cases: DashboardCase[];
  recent_parcels: DashboardLandReference[];
}

export interface AdminSecurityEvent {
  event_type: string;
  severity: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

export interface AdminDashboard {
  totals: {
    total_citizens: number;
    total_admins: number;
    total_cases: number;
    total_reports: number;
    total_parcels: number;
  };
  case_status_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  recent_cases: {
    case_id: string;
    status: string;
    overall_risk_level: string | null;
    district_name: string;
    upazila_name: string;
    mouza_name: string;
    survey_type: string;
    khatian_no: string;
    dag_no: string;
    initiated_at: string;
  }[];
  recent_security_events: AdminSecurityEvent[];
  system_health: {
    database: string;
    database_latency_ms: number;
    app_version: string;
    environment: string;
  };
}

// Synthetic case list shown only to frontend-only demo sessions (see
// authService.isDemoMode) so judges can explore with no backend. Mirrors the
// VerificationCaseSummary / DashboardCase shape; all values are fake.
export function buildDemoCases(): DashboardCase[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
  const demoCase = (
    n: number,
    risk: string,
    status: string,
    initiatedHoursAgo: number,
    completedHoursAgo: number | null,
    hasReport: boolean
  ): DashboardCase => ({
    case_id: `DEMO-2026-00${n}`,
    status,
    overall_risk_level: risk,
    district_name: 'Dhaka',
    upazila_name: 'Savar',
    mouza_name: 'Bagbari',
    survey_type: 'RS',
    khatian_no: `${1180 + n}`,
    dag_no: `${217 + n}`,
    parcel_id: `DHK-SVR-RS-1180-${217 + n}`,
    initiated_at: hoursAgo(initiatedHoursAgo),
    completed_at: completedHoursAgo === null ? null : hoursAgo(completedHoursAgo),
    has_report: hasReport,
  });

  return [
    demoCase(1, 'REVIEW_REQUIRED', 'COMPLETED', 96, 90, true),
    demoCase(2, 'LOW_CONCERN', 'COMPLETED', 240, 232, true),
    demoCase(3, 'CRITICAL_SIGNAL', 'INITIATED', 6, null, false),
  ];
}

// Synthetic dataset shown only to frontend-only demo sessions so judges can
// explore the dashboard with no backend. Mirrors the CitizenDashboard shape.
function buildDemoCitizenDashboard(): CitizenDashboard {
  const cases = buildDemoCases();

  return {
    totals: { total_cases: 3, completed_cases: 2, total_reports: 2 },
    risk_summary: { LOW_CONCERN: 1, REVIEW_REQUIRED: 1, CRITICAL_SIGNAL: 1 },
    latest_case: cases[0],
    recent_cases: cases,
    recent_parcels: cases.map((c) => ({
      parcel_id: c.parcel_id!,
      district_name: c.district_name,
      upazila_name: c.upazila_name,
      mouza_name: c.mouza_name,
      survey_type: c.survey_type,
      khatian_no: c.khatian_no,
      dag_no: c.dag_no,
      area_decimal: 90 + Number(c.dag_no) % 40,
      last_checked_at: c.completed_at || c.initiated_at,
    })),
  };
}

class DashboardService {
  async getCitizenDashboard(): Promise<CitizenDashboard> {
    if (authService.isDemoMode()) {
      return buildDemoCitizenDashboard();
    }

    const response = await api.get('/dashboard/citizen');
    return response.data;
  }

  async getAdminDashboard(): Promise<AdminDashboard> {
    const response = await api.get('/dashboard/admin');
    return response.data;
  }
}

export default new DashboardService();
