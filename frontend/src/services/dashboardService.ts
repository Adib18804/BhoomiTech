import api from '../utils/api';

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

class DashboardService {
  async getCitizenDashboard(): Promise<CitizenDashboard> {
    const response = await api.get('/dashboard/citizen');
    return response.data;
  }

  async getAdminDashboard(): Promise<AdminDashboard> {
    const response = await api.get('/dashboard/admin');
    return response.data;
  }
}

export default new DashboardService();
