import api from '../utils/api';

export interface SellerClaim {
  claimed_owner_name: string;
  claimed_share_decimal: number;
  claimed_sale_area_decimal: number;
  claimed_khatian?: string;
  claimed_dag?: string;
  claimed_survey_type?: string;
}

export interface VerificationRequest {
  parcel_id: string;
  seller_claim: SellerClaim;
}

export interface VerificationFinding {
  check_type: string;
  finding_type: string;
  severity: string;
  title_en: string;
  title_bn?: string;
  description_en: string;
  description_bn?: string;
  explanation_en?: string;
  explanation_bn?: string;
  recommendation_en?: string;
  recommendation_bn?: string;
  related_data?: any;
}

export interface VerificationCheck {
  check_name: string;
  status: string;
  findings: VerificationFinding[];
}

export interface VerificationResult {
  case_id: string;
  parcel_id: string;
  overall_risk_level: string;
  risk_score?: number;
  checks: VerificationCheck[];
  total_checks: number;
  passed_checks: number;
  warnings: number;
  critical_issues: number;
  recommendations: string[];
  generated_at: string;
  data_note: string;
}

export interface VerificationCaseSummary {
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

class VerificationService {
  async runVerification(request: VerificationRequest): Promise<VerificationResult> {
    const response = await api.post('/verification/check', request);
    return response.data;
  }

  async getVerification(caseId: string): Promise<any> {
    const response = await api.get(`/verification/${caseId}`);
    return response.data;
  }

  /** Verification cases for the requesting citizen ("My Checks"), privacy-scoped. */
  async listMyCases(): Promise<VerificationCaseSummary[]> {
    const response = await api.get('/verification/cases');
    return response.data;
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW_CONCERN':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'REVIEW_REQUIRED':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'HIGH_ATTENTION':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'CRITICAL_SIGNAL':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'INSUFFICIENT_DATA':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  }

  getRiskLevelIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW_CONCERN':
        return '✓';
      case 'REVIEW_REQUIRED':
        return '⚠';
      case 'HIGH_ATTENTION':
        return '!';
      case 'CRITICAL_SIGNAL':
        return '×';
      case 'INSUFFICIENT_DATA':
        return '?';
      default:
        return '?';
    }
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
}

export default new VerificationService();
