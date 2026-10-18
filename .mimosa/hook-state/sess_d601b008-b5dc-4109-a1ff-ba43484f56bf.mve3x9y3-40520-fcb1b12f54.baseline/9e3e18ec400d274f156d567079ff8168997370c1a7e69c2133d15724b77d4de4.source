import api from '../utils/api';

export interface ReportNotice {
  not_certificate_en: string;
  not_certificate_bn: string;
  synthetic_en: string;
  synthetic_bn: string;
  footer_en: string;
  footer_bn: string;
}

export interface ReportSummary {
  report_id: string;
  case_id: string;
  title: string;
  language: string;
  format: string;
  file_size_bytes: number | null;
  created_at: string;
  overall_risk_level: string | null;
}

export interface ReportDetail extends ReportSummary {
  content: {
    language: string;
    case: {
      case_id: string;
      status: string;
      initiated_at: string | null;
      completed_at: string | null;
      overall_risk_level: string | null;
      risk_score: number | null;
      total_checks: number | null;
      passed_checks: number | null;
      warnings: number | null;
      critical_issues: number | null;
      recommendations: string[];
    };
    seller_claim: Record<string, string | null>;
    land_identity: {
      parcel_id: string | null;
      district: string;
      upazila: string;
      mouza: string;
      survey_type: string;
      khatian_no: string;
      dag_no: string;
      total_area_decimal: string | null;
      land_class: string | null;
      parcel_status: string | null;
    };
    recorded_owners: any[];
    historical_records: any[];
    mutation_records: any[];
    case_records: any[];
    government_status: any[];
    acquisition_records: any[];
    transactions: any[];
    verification_checks: Record<string, any[]>;
    notices: ReportNotice;
  } | null;
}

class ReportService {
  /** Generate (and persist) a due-diligence report for a verification case. */
  async generateReport(caseId: string, lang: 'en' | 'bn' = 'en'): Promise<ReportDetail> {
    const response = await api.post(`/reports/case/${caseId}?lang=${lang}`);
    return response.data;
  }

  /** List reports already generated for a verification case. */
  async listReportsForCase(caseId: string): Promise<ReportSummary[]> {
    const response = await api.get(`/reports/case/${caseId}`);
    return response.data;
  }

  /** Reports owned by the requesting user ("Reports"), privacy-scoped. */
  async listMyReports(): Promise<ReportSummary[]> {
    const response = await api.get('/reports');
    return response.data;
  }

  /** Fetch a report's metadata + structured snapshot (JSON). */
  async getReport(reportId: string): Promise<ReportDetail> {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  /** Fetch the persisted PDF as a Blob (same bytes as at generation time). */
  async getReportPdf(reportId: string): Promise<Blob> {
    const response = await api.get(`/reports/${reportId}/pdf`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  /** Download the PDF with a readable filename. */
  async downloadReportPdf(reportId: string): Promise<void> {
    const blob = await this.getReportPdf(reportId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /** Open the PDF in a new browser tab for inline viewing. */
  async viewReportPdf(reportId: string): Promise<void> {
    const blob = await this.getReportPdf(reportId);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Give the new tab time to load before revoking
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }
}

export default new ReportService();
