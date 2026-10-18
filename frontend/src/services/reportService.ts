import api from '../utils/api';
import authService from './authService';

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

// ---------------------------------------------------------------------------
// Demo-mode report generation — zero external libraries required.
//
// Strategy:
//   1. generateReport()  → builds a ReportDetail + a self-contained HTML Blob
//                          and stores it in DEMO_BLOBS keyed by report_id.
//   2. getReportPdf()    → returns the cached Blob (or a safe fallback).
//   3. viewReportPdf()   → opens the HTML Blob in a new tab; the page
//                          includes a "🖨 Print / Save as PDF" button.
//   4. downloadReportPdf → saves the Blob as <report_id>.html so the user
//                          can open it in a browser and print to PDF.
//
// All demo paths are completely bypassed when isDemoMode() is false.
// ---------------------------------------------------------------------------

/** Module-level cache: report_id → HTML Blob. Auto-cleared on tab close. */
const DEMO_BLOBS = new Map<string, Blob>();

// ---- Helpers ---------------------------------------------------------------

function _riskLabel(level: string | null): string {
  switch (level) {
    case 'LOW_CONCERN':       return '✓ LOW CONCERN';
    case 'REVIEW_REQUIRED':   return '⚠ REVIEW REQUIRED';
    case 'HIGH_ATTENTION':    return '! HIGH ATTENTION';
    case 'CRITICAL_SIGNAL':   return '✕ CRITICAL SIGNAL';
    case 'INSUFFICIENT_DATA': return '? INSUFFICIENT DATA';
    default:                  return level ?? 'UNKNOWN';
  }
}

function _riskColor(level: string | null): string {
  switch (level) {
    case 'LOW_CONCERN':       return '#166534';
    case 'REVIEW_REQUIRED':   return '#92400e';
    case 'HIGH_ATTENTION':    return '#9a3412';
    case 'CRITICAL_SIGNAL':   return '#991b1b';
    default:                  return '#374151';
  }
}

function _riskBg(level: string | null): string {
  switch (level) {
    case 'LOW_CONCERN':       return '#dcfce7';
    case 'REVIEW_REQUIRED':   return '#fef3c7';
    case 'HIGH_ATTENTION':    return '#ffedd5';
    case 'CRITICAL_SIGNAL':   return '#fee2e2';
    default:                  return '#f3f4f6';
  }
}

/** Render a fully self-contained, print-ready HTML report string. */
function _buildHtml(detail: ReportDetail): string {
  const c         = detail.content;
  const riskLevel = detail.overall_risk_level;
  const now       = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });

  // ---- Land identity section ---
  const landRows = c
    ? [
        ['Parcel ID',     c.land_identity.parcel_id    ?? '-'],
        ['District',      c.land_identity.district],
        ['Upazila',       c.land_identity.upazila],
        ['Mouza',         c.land_identity.mouza],
        ['Survey Type',   c.land_identity.survey_type],
        ['Khatian No.',   c.land_identity.khatian_no],
        ['Dag No.',       c.land_identity.dag_no],
        ['Total Area',    (c.land_identity.total_area_decimal ?? '-') + ' decimal'],
        ['Land Class',    c.land_identity.land_class    ?? '-'],
        ['Parcel Status', c.land_identity.parcel_status ?? 'active'],
      ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')
    : '';

  // ---- Verification summary section ---
  const caseRows = c
    ? [
        ['Case ID',       `<span class="mono">${c.case.case_id}</span>`],
        ['Status',        c.case.status],
        ['Risk Score',    String(c.case.risk_score ?? '-')],
        ['Total Checks',  String(c.case.total_checks ?? '-')],
        ['Passed',        String(c.case.passed_checks ?? '-')],
        ['Warnings',      String(c.case.warnings ?? 0)],
        ['Critical',      String(c.case.critical_issues ?? 0)],
        ['Initiated',     c.case.initiated_at  ? new Date(c.case.initiated_at).toLocaleString('en-GB')  : '-'],
        ['Completed',     c.case.completed_at  ? new Date(c.case.completed_at).toLocaleString('en-GB')  : '-'],
      ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')
    : '';

  // ---- Ownership section ---
  const ownerRows = (c?.recorded_owners?.length)
    ? c.recorded_owners.map((o: any) =>
        `<tr>
          <td>${o.name_en ?? o.owner?.name_en ?? '-'}</td>
          <td>${o.share_decimal ?? '-'}</td>
          <td>${o.ownership_type ?? '-'}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="color:#6b7280;font-style:italic">No recorded owner data for this demo case.</td></tr>`;

  // ---- Recommendations section ---
  const recItems = (c?.case.recommendations?.length)
    ? c.case.recommendations.map((r) => `<li>${r}</li>`).join('')
    : '<li style="color:#6b7280;font-style:italic">No specific recommendations.</li>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>BhoomiTech Due-Diligence Report &mdash; ${detail.report_id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      line-height: 1.55;
      color: #1f2937;
      background: #fff;
      padding: 36px 40px;
      max-width: 880px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 0; font-size: 11.5px; }
      .no-print { display: none !important; }
      @page { margin: 20mm 18mm; }
    }

    /* ---------- Print banner ---------- */
    .print-banner {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .print-btn {
      background: #15803d;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .print-btn:hover { background: #166534; }
    .print-hint { font-size: 12px; color: #374151; }

    /* ---------- Header ---------- */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 3px solid #15803d;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 20px; font-weight: 700; color: #15803d; }
    .header .meta { font-size: 11px; color: #6b7280; margin-top: 5px; line-height: 1.7; }
    .header .logo { font-size: 32px; flex-shrink: 0; }

    /* ---------- Synthetic notice ---------- */
    .notice {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 10px 14px;
      font-size: 11.5px;
      color: #78350f;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    /* ---------- Risk badge ---------- */
    .risk-badge {
      display: inline-block;
      padding: 10px 22px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      border: 2px solid ${_riskColor(riskLevel)};
      background: ${_riskBg(riskLevel)};
      color: ${_riskColor(riskLevel)};
      margin-bottom: 24px;
    }

    /* ---------- Sections ---------- */
    .section { margin-bottom: 24px; }
    .section h2 {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }

    /* ---------- Tables ---------- */
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 5px 10px; border: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-weight: 600; width: 36%; color: #4b5563; }
    td { color: #1f2937; }
    tr:nth-child(even) td { background: #fafafa; }

    /* ---------- Lists ---------- */
    ul { padding-left: 18px; }
    li { margin-bottom: 5px; }

    /* ---------- Misc ---------- */
    .mono { font-family: 'Courier New', monospace; font-size: 10.5px; word-break: break-all; }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      margin-top: 36px;
      font-size: 10px;
      color: #9ca3af;
      line-height: 1.6;
    }
    p { line-height: 1.6; }
  </style>
</head>
<body>

  <!-- Print banner (hidden when printing) -->
  <div class="no-print print-banner">
    <button class="print-btn" onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
    <span class="print-hint">
      Use your browser's Print dialog and select <strong>"Save as PDF"</strong> as the destination.
    </span>
  </div>

  <!-- Header -->
  <div class="header">
    <div>
      <h1>🌿 BhoomiTech &mdash; Land Due-Diligence Report</h1>
      <div class="meta">
        <strong>Report ID:</strong> <span class="mono">${detail.report_id}</span><br>
        <strong>Case ID:</strong> <span class="mono">${detail.case_id}</span><br>
        <strong>Generated:</strong> ${now}
      </div>
    </div>
  </div>

  <!-- Synthetic data notice -->
  <div class="notice">
    <strong>⚠ SYNTHETIC DEMONSTRATION DATA</strong> — This report was produced in BhoomiTech Demo Mode.
    It is <strong>NOT</strong> an official government document and has no legal validity.
    All land records, ownership details, and verification findings are entirely fictional and exist
    solely for evaluation and demonstration purposes.
  </div>

  <!-- Overall risk -->
  <div class="risk-badge">${_riskLabel(riskLevel)}</div>

  <!-- 1. Land Identity -->
  <div class="section">
    <h2>1. Land Identity</h2>
    ${landRows
      ? `<table><tbody>${landRows}</tbody></table>`
      : '<p>Land identity data not available.</p>'}
  </div>

  <!-- 2. Verification Summary -->
  <div class="section">
    <h2>2. Verification Summary</h2>
    ${caseRows
      ? `<table><tbody>${caseRows}</tbody></table>`
      : '<p>Verification summary not available.</p>'}
  </div>

  <!-- 3. Seller Claim -->
  <div class="section">
    <h2>3. Seller Claim (as entered)</h2>
    ${c ? `<table><tbody>
      <tr><th>Claimed Owner Name</th><td>${c.seller_claim.claimed_owner_name ?? '-'}</td></tr>
      <tr><th>Claimed Share (decimal)</th><td>${c.seller_claim.claimed_share_decimal ?? '-'}</td></tr>
      <tr><th>Claimed Sale Area (decimal)</th><td>${c.seller_claim.claimed_sale_area_decimal ?? '-'}</td></tr>
    </tbody></table>` : '<p>Not available.</p>'}
  </div>

  <!-- 4. Recorded Ownership -->
  <div class="section">
    <h2>4. Recorded Ownership</h2>
    <table>
      <thead>
        <tr>
          <th>Owner Name</th>
          <th>Share (decimal)</th>
          <th>Ownership Type</th>
        </tr>
      </thead>
      <tbody>${ownerRows}</tbody>
    </table>
  </div>

  <!-- 5. Recommendations -->
  <div class="section">
    <h2>5. Recommendations</h2>
    <ul>${recItems}</ul>
  </div>

  <!-- 6. Disclaimer -->
  <div class="section">
    <h2>6. Disclaimer</h2>
    <p>
      This report is generated by BhoomiTech for informational purposes only. It does not constitute
      legal advice, a legal title opinion, or an official government land record. BhoomiTech accepts
      no liability for any decision made on the basis of this report. Always verify all land records
      directly with the relevant government authority (e.g., AC Land office, sub-registry) before
      completing any property transaction.
    </p>
  </div>

  <!-- Footer -->
  <div class="footer">
    BhoomiTech &copy; ${new Date().getFullYear()}
    &nbsp;&bull;&nbsp; Report ID: ${detail.report_id}
    &nbsp;&bull;&nbsp; Printed: ${now}
    &nbsp;&bull;&nbsp; SYNTHETIC DEMONSTRATION DATA &mdash; NOT AN OFFICIAL DOCUMENT
  </div>

</body>
</html>`;
}

/**
 * Build a mock ReportDetail from the caseId.
 * Pulls real land/claim data from sessionStorage when available
 * (fresh verification flow) and falls back to demo defaults otherwise
 * (viewing a past DEMO-* case from My Checks).
 */
function _buildDemoDetail(caseId: string, lang: 'en' | 'bn'): ReportDetail {
  const reportId = `DEMO-RPT-${Date.now().toString(36).toUpperCase()}`;
  const now      = new Date().toISOString();

  // Defaults — overridden by sessionStorage when present.
  let district = 'Dhaka', upazila = 'Savar', mouza = 'Demo Mouza';
  let surveyType = 'RS', khatianNo = '342', dagNo = '121';
  let parcelId = 'BT-PARCEL-000001';
  let ownerName = 'Md. Karim Ahmed', shareDecimal = 30;
  let claimedOwner = 'Md. Karim Ahmed', claimedShare = '30', claimedArea = '25';

  try {
    const rawLand = sessionStorage.getItem('selectedLand');
    if (rawLand) {
      const land  = JSON.parse(rawLand);
      district    = land.parcel?.district    ?? district;
      upazila     = land.parcel?.upazila     ?? upazila;
      mouza       = land.parcel?.mouza       ?? mouza;
      surveyType  = land.parcel?.survey_type ?? surveyType;
      khatianNo   = land.parcel?.khatian_no  ?? khatianNo;
      dagNo       = land.parcel?.dag_no      ?? dagNo;
      parcelId    = land.parcel?.parcel_id   ?? parcelId;
      if (land.ownership?.[0]) {
        ownerName    = land.ownership[0].owner?.name_en ?? ownerName;
        shareDecimal = land.ownership[0].share_decimal  ?? shareDecimal;
      }
    }
    const rawClaim = sessionStorage.getItem('sellerClaim');
    if (rawClaim) {
      const claim  = JSON.parse(rawClaim);
      claimedOwner = claim.claimed_owner_name             ?? claimedOwner;
      claimedShare = String(claim.claimed_share_decimal       ?? claimedShare);
      claimedArea  = String(claim.claimed_sale_area_decimal   ?? claimedArea);
    }
  } catch { /* sessionStorage unavailable — stick with defaults */ }

  const detail: ReportDetail = {
    report_id:          reportId,
    case_id:            caseId,
    title:              `Land Due-Diligence Report \u2014 ${parcelId}`,
    language:           lang,
    format:             'html',
    file_size_bytes:    null,
    created_at:         now,
    overall_risk_level: 'LOW_CONCERN',
    content: {
      language: lang,
      case: {
        case_id:            caseId,
        status:             'COMPLETED',
        initiated_at:       now,
        completed_at:       now,
        overall_risk_level: 'LOW_CONCERN',
        risk_score:         10,
        total_checks:       4,
        passed_checks:      4,
        warnings:           0,
        critical_issues:    0,
        recommendations: [
          'All checks passed. Proceed with standard legal due diligence before completing the transaction.',
          'Verify all documents in person at the local land registry office before final transfer.',
        ],
      },
      seller_claim: {
        claimed_owner_name:        claimedOwner,
        claimed_share_decimal:     claimedShare,
        claimed_sale_area_decimal: claimedArea,
      },
      land_identity: {
        parcel_id:          parcelId,
        district,
        upazila,
        mouza,
        survey_type:        surveyType,
        khatian_no:         khatianNo,
        dag_no:             dagNo,
        total_area_decimal: String(shareDecimal),
        land_class:         'Agricultural',
        parcel_status:      'active',
      },
      recorded_owners: [
        { name_en: ownerName, share_decimal: shareDecimal, ownership_type: 'individual' },
      ],
      historical_records:  [],
      mutation_records:    [],
      case_records:        [],
      government_status:   [],
      acquisition_records: [],
      transactions:        [],
      verification_checks: {
        ownership_check:   [{ finding_type: 'PASS', title_en: 'Ownership Verified',  severity: 'low' }],
        mutation_check:    [{ finding_type: 'PASS', title_en: 'Mutation Approved',   severity: 'low' }],
        case_check:        [{ finding_type: 'PASS', title_en: 'No Legal Cases',      severity: 'low' }],
        acquisition_check: [{ finding_type: 'PASS', title_en: 'No Acquisition Orders', severity: 'low' }],
      },
      notices: {
        not_certificate_en: 'This is NOT an official government certificate.',
        not_certificate_bn: '\u098f\u099f\u09bf \u09b8\u09b0\u0995\u09be\u09b0\u09bf \u09b8\u09be\u09b0\u09cd\u099f\u09bf\u09ab\u09bf\u0995\u09c7\u099f \u09a8\u09af\u09bc\u0964',
        synthetic_en:       'SYNTHETIC DEMONSTRATION DATA \u2014 Not an official record.',
        synthetic_bn:       '\u0995\u09c3\u09a4\u09cd\u09b0\u09bf\u09ae \u09aa\u09cd\u09b0\u09a6\u09b0\u09cd\u09b6\u09a8\u09c0 \u09a1\u09c7\u099f\u09be \u2014 \u09b8\u09b0\u0995\u09be\u09b0\u09bf \u09b0\u09c7\u0995\u09b0\u09cd\u09a1 \u09a8\u09af\u09bc\u0964',
        footer_en:          'BhoomiTech is a demonstration platform only.',
        footer_bn:          'BhoomiTech \u09b6\u09c1\u09a7\u09c1\u09ae\u09be\u09a4\u09cd\u09b0 \u098f\u0995\u099f\u09bf \u09aa\u09cd\u09b0\u09a6\u09b0\u09cd\u09b6\u09a8\u09c0 \u09aa\u09cd\u09b2\u09cd\u09af\u09be\u099f\u09ab\u09b0\u09cd\u09ae\u0964',
      },
    },
  };

  // Cache the HTML Blob immediately so view/download work right after.
  const blob = new Blob([_buildHtml(detail)], { type: 'text/html; charset=utf-8' });
  DEMO_BLOBS.set(reportId, blob);

  return detail;
}

// ============================================================================
// ReportService
// ============================================================================

class ReportService {
  /**
   * Generate (and persist) a due-diligence report for a verification case.
   *
   * Demo Mode: builds a styled, self-contained HTML report entirely in the
   * browser using sessionStorage data. Returns a mock ReportDetail instantly
   * and stores the HTML Blob so viewReportPdf / downloadReportPdf can reuse it.
   * Real sessions always POST to the backend.
   */
  async generateReport(caseId: string, lang: 'en' | 'bn' = 'en'): Promise<ReportDetail> {
    if (authService.isDemoMode()) {
      return _buildDemoDetail(caseId, lang);
    }
    const response = await api.post(`/reports/case/${caseId}?lang=${lang}`);
    return response.data;
  }

  /** List reports already generated for a verification case. */
  async listReportsForCase(caseId: string): Promise<ReportSummary[]> {
    const response = await api.get(`/reports/case/${caseId}`);
    return response.data;
  }

  /**
   * Reports owned by the requesting user ("Reports"), privacy-scoped.
   * Demo Mode: returns [] so ReportsPage shows the friendly empty state
   * instead of a red error box. Real sessions always call the API.
   */
  async listMyReports(): Promise<ReportSummary[]> {
    if (authService.isDemoMode()) {
      return [];
    }
    const response = await api.get('/reports');
    return response.data;
  }

  /** Fetch a report's metadata + structured snapshot (JSON). */
  async getReport(reportId: string): Promise<ReportDetail> {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  }

  /**
   * Fetch the report as a Blob.
   * Demo Mode: returns the HTML Blob cached by generateReport(). If the Blob
   * has been garbage-collected (e.g. hard refresh), returns a minimal fallback
   * so the call never throws. Real sessions fetch the PDF from the backend.
   */
  async getReportPdf(reportId: string): Promise<Blob> {
    if (authService.isDemoMode()) {
      const cached = DEMO_BLOBS.get(reportId);
      if (cached) return cached;
      // Fallback after page refresh — a minimal HTML page that never throws.
      const fallback = [
        '<!DOCTYPE html><html><head><meta charset="UTF-8">',
        '<title>BhoomiTech Demo Report</title>',
        '<style>body{font-family:Arial,sans-serif;padding:32px;max-width:720px;margin:0 auto}',
        'h1{color:#15803d}.notice{background:#fffbeb;border-left:4px solid #f59e0b;',
        'padding:10px 14px;margin-top:16px;border-radius:4px;font-size:13px;color:#78350f}</style>',
        '</head><body>',
        '<h1>&#127807; BhoomiTech Demo Report</h1>',
        `<p><strong>Report ID:</strong> ${reportId}</p>`,
        '<div class="notice">',
        '<strong>&#9888; SYNTHETIC DEMONSTRATION DATA</strong> &mdash; Not an official document.<br>',
        'Return to the Verification Result page and click <strong>Generate Report</strong> to regenerate.',
        '</div></body></html>',
      ].join('');
      return new Blob([fallback], { type: 'text/html; charset=utf-8' });
    }
    const response = await api.get(`/reports/${reportId}/pdf`, { responseType: 'blob' });
    return response.data as Blob;
  }

  /**
   * Download the report with a readable filename.
   * Demo Mode: saves as <report_id>.html (open in browser → Ctrl+P → Save as PDF).
   * Real sessions save the backend PDF as <report_id>.pdf.
   */
  async downloadReportPdf(reportId: string): Promise<void> {
    const blob = await this.getReportPdf(reportId);
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = authService.isDemoMode()
      ? `${reportId}.html`
      : `${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Open the report in a new browser tab for inline viewing.
   * Demo Mode: opens the HTML blob — includes a "Print / Save as PDF" button.
   * Real sessions open the backend PDF blob.
   */
  async viewReportPdf(reportId: string): Promise<void> {
    const blob = await this.getReportPdf(reportId);
    const url  = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Give the new tab 60 s to fully render before revoking the object URL.
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }
}

export default new ReportService();
