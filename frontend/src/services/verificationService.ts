import api from '../utils/api';
import authService from './authService';
import { buildDemoCases } from './dashboardService';

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

// ---------------------------------------------------------------------------
// Hardcoded demo verification result — returned only when isDemoMode() is true.
// Mirrors the VerificationResult interface so VerificationResultPage renders
// without hitting the backend.
// ---------------------------------------------------------------------------
function buildDemoVerificationResult(parcelId: string, caseId: string): VerificationResult {
  return {
    case_id: caseId,
    parcel_id: parcelId,
    overall_risk_level: 'LOW_CONCERN',
    risk_score: 10,
    checks: [
      {
        check_name: 'ownership_check',
        status: 'passed',
        findings: [
          {
            check_type: 'ownership_check',
            finding_type: 'PASS',
            severity: 'low',
            title_en: 'Ownership Verified',
            title_bn: 'মালিকানা যাচাই সম্পন্ন',
            description_en: 'Seller name matches the recorded owner in the cadastral register.',
            description_bn: 'বিক্রেতার নাম কাতাস্ট্রাল রেজিস্টারে রেকর্ডকৃত মালিকের সাথে মিলে।',
            recommendation_en: 'Ownership check passed. Proceed with standard due diligence.',
          },
        ],
      },
      {
        check_name: 'mutation_check',
        status: 'passed',
        findings: [
          {
            check_type: 'mutation_check',
            finding_type: 'PASS',
            severity: 'low',
            title_en: 'Mutation Approved',
            title_bn: 'মিউটেশন অনুমোদিত',
            description_en: 'All mutation applications have been approved. No pending mutations.',
            description_bn: 'সমস্ত মিউটেশন আবেদন অনুমোদিত হয়েছে। কোন মুলতুবি মিউটেশন নেই।',
            recommendation_en: 'No mutation issues found.',
          },
        ],
      },
      {
        check_name: 'case_check',
        status: 'passed',
        findings: [
          {
            check_type: 'case_check',
            finding_type: 'PASS',
            severity: 'low',
            title_en: 'No Legal Cases Found',
            title_bn: 'কোন আইনি মামলা পাওয়া যায়নি',
            description_en: 'No pending or active legal cases found against this parcel.',
            description_bn: 'এই জমির বিরুদ্ধে কোন মুলতুবি বা সক্রিয় আইনি মামলা পাওয়া যায়নি।',
            recommendation_en: 'No legal cases found.',
          },
        ],
      },
      {
        check_name: 'acquisition_check',
        status: 'passed',
        findings: [
          {
            check_type: 'acquisition_check',
            finding_type: 'PASS',
            severity: 'low',
            title_en: 'No Acquisition Orders',
            title_bn: 'কোন অধিগ্রহণ আদেশ নেই',
            description_en: 'No government acquisition orders found for this parcel.',
            description_bn: 'এই জমির জন্য কোন সরকারি অধিগ্রহণ আদেশ পাওয়া যায়নি।',
            recommendation_en: 'No acquisition issues found.',
          },
        ],
      },
    ],
    total_checks: 4,
    passed_checks: 4,
    warnings: 0,
    critical_issues: 0,
    recommendations: [
      'All checks passed. Proceed with standard legal due diligence before completing the transaction.',
      'Verify documents in person at the local land registry office before final transfer.',
    ],
    generated_at: new Date().toISOString(),
    data_note: 'SYNTHETIC DEMONSTRATION DATA — Not an official government record.',
  };
}

class VerificationService {
  /**
   * Run a land verification check.
   * In Demo Mode (no live backend), returns a synthetic LOW_CONCERN result
   * instantly without touching the network. Real sessions always call the API.
   */
  async runVerification(request: VerificationRequest): Promise<VerificationResult> {
    if (authService.isDemoMode()) {
      const caseId = `DEMO-${Date.now().toString().slice(-8)}`;
      return buildDemoVerificationResult(request.parcel_id, caseId);
    }
    const response = await api.post('/verification/check', request);
    return response.data;
  }

  /**
   * Fetch a stored verification case by ID.
   * In Demo Mode, returns a synthetic result for any DEMO-* case ID so that
   * VerificationResultPage can display past checks from My Checks.
   */
  async getVerification(caseId: string): Promise<any> {
    if (authService.isDemoMode()) {
      const parcelId = 'BT-PARCEL-000001';
      const result = buildDemoVerificationResult(parcelId, caseId);
      // Return in the shape VerificationResultPage expects when caseId is set
      return {
        case_id: caseId,
        parcel_id: parcelId,
        overall_risk_level: result.overall_risk_level,
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        data_note: result.data_note,
        findings: result.checks.flatMap((c) => c.findings),
        result: {
          risk_score: result.risk_score,
          total_checks: result.total_checks,
          passed_checks: result.passed_checks,
          warnings: result.warnings,
          critical_issues: result.critical_issues,
        },
      };
    }
    const response = await api.get(`/verification/${caseId}`);
    return response.data;
  }

  /** Verification cases for the requesting citizen ("My Checks"), privacy-scoped.
   * When in Demo Mode (no live backend), returns synthetic cases from memory
   * without touching the network. Real sessions always call the API.
   */
  async listMyCases(): Promise<VerificationCaseSummary[]> {
    if (authService.isDemoMode()) {
      // buildDemoCases() returns DashboardCase objects, which are structurally
      // identical to VerificationCaseSummary — same fields, same types.
      return buildDemoCases() as VerificationCaseSummary[];
    }
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
