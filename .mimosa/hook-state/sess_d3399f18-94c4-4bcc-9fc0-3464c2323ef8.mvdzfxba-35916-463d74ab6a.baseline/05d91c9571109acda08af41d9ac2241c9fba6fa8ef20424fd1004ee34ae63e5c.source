import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, CheckCircle, AlertTriangle, AlertCircle, XCircle, HelpCircle,
  ArrowLeft, Download, FileText, Eye, Loader2, Info
} from 'lucide-react';
import verificationService, { VerificationResult } from '../../services/verificationService';
import FindingCard from '../../components/verification/FindingCard';
import reportService, { ReportDetail } from '../../services/reportService';
import { LandParcelDetail } from '../../services/landService';

export default function VerificationResultPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [reportBusy, setReportBusy] = useState<'generate' | 'view' | 'download' | null>(null);
  const [reportError, setReportError] = useState('');

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  useEffect(() => {
    runVerification();
  }, []);

  const runVerification = async () => {
    setLoading(true);
    setError('');

    try {
      // Existing case view (from the dashboard): load the stored case by ID
      if (caseId) {
        const detail = await verificationService.getVerification(caseId);
        const r = detail.result;
        // Group the flat findings list by check type for display
        const grouped: Record<string, any[]> = {};
        for (const f of detail.findings || []) {
          (grouped[f.check_type] = grouped[f.check_type] || []).push(f);
        }
        const recommendations = Array.from(new Set(
          (detail.findings || [])
            .map((f: any) => f.recommendation_en)
            .filter(Boolean)
        )) as string[];
        setResult({
          case_id: detail.case_id,
          parcel_id: detail.parcel_id || '',
          overall_risk_level: detail.overall_risk_level || 'INSUFFICIENT_DATA',
          risk_score: r?.risk_score,
          checks: Object.entries(grouped).map(([check_name, findings]) => ({
            check_name,
            status: 'recorded',
            findings,
          })),
          total_checks: r?.total_checks ?? Object.keys(grouped).length,
          passed_checks: r?.passed_checks ?? 0,
          warnings: r?.warnings ?? 0,
          critical_issues: r?.critical_issues ?? 0,
          recommendations,
          generated_at: detail.completed_at || detail.initiated_at,
          data_note: detail.data_note,
        });
        return;
      }

      // Fresh verification: get stored data
      const storedLand = sessionStorage.getItem('selectedLand');
      const storedClaim = sessionStorage.getItem('sellerClaim');

      if (!storedLand || !storedClaim) {
        navigate('/land-search');
        return;
      }

      const land: LandParcelDetail = JSON.parse(storedLand);
      const claim = JSON.parse(storedClaim);

      // Run verification
      const verificationResult = await verificationService.runVerification({
        parcel_id: land.parcel.parcel_id,
        seller_claim: {
          claimed_owner_name: claim.claimed_owner_name,
          claimed_share_decimal: parseFloat(claim.claimed_share_decimal),
          claimed_sale_area_decimal: parseFloat(claim.claimed_sale_area_decimal),
          claimed_khatian: land.parcel.khatian_no,
          claimed_dag: land.parcel.dag_no,
          claimed_survey_type: land.parcel.survey_type,
        },
      });

      setResult(verificationResult);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW_CONCERN':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'REVIEW_REQUIRED':
        return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
      case 'HIGH_ATTENTION':
        return <AlertCircle className="w-12 h-12 text-orange-600" />;
      case 'CRITICAL_SIGNAL':
        return <XCircle className="w-12 h-12 text-red-600" />;
      case 'INSUFFICIENT_DATA':
        return <HelpCircle className="w-12 h-12 text-gray-600" />;
      default:
        return <Shield className="w-12 h-12 text-gray-600" />;
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    return t(`riskLevels.${riskLevel}`) || riskLevel.replace(/_/g, ' ');
  };

  // ---- Due-diligence report (Phase 11A) --------------------------------
  const reportLanguage: 'en' | 'bn' = isBn ? 'bn' : 'en';

  const handleGenerateReport = async () => {
    if (!result) return;
    setReportBusy('generate');
    setReportError('');
    try {
      const generated = await reportService.generateReport(result.case_id, reportLanguage);
      setReport(generated);
      // Open the freshly generated PDF for immediate review
      await reportService.viewReportPdf(generated.report_id);
    } catch (err: any) {
      setReportError(t('verification.result.reportError'));
    } finally {
      setReportBusy(null);
    }
  };

  const handleViewReport = async () => {
    if (!report) return;
    setReportBusy('view');
    try {
      await reportService.viewReportPdf(report.report_id);
    } catch {
      setReportError(t('verification.result.reportError'));
    } finally {
      setReportBusy(null);
    }
  };

  const handleDownloadReport = async () => {
    if (!report) return;
    setReportBusy('download');
    try {
      await reportService.downloadReportPdf(report.report_id);
    } catch {
      setReportError(t('verification.result.reportError'));
    } finally {
      setReportBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-12 text-center">
          <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-pulse" />
          <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${bnFont}`}>{t('verification.result.running')}</h2>
          <p className={`text-gray-600 ${bnFont}`}>{t('verification.result.analyzing')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <XCircle className="w-8 h-8 text-red-600 mb-3" />
          <h2 className={`text-xl font-bold text-red-900 mb-2 ${bnFont}`}>{t('verification.result.failed')}</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate('/land-search')}
            className="btn-secondary mt-4"
          >
            {t('verification.result.backToSearch')}
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/land-search')}
        className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('verification.result.backToSearch')}
      </button>

      {/* Synthetic Data Warning */}
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-700 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`font-semibold text-yellow-900 ${bnFont}`}>
              {result.data_note}
            </p>
            <p className={`text-sm text-yellow-800 mt-1 ${bnFont}`}>
              {t('verification.result.syntheticNote')}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Risk Status */}
      <div className={`card p-5 sm:p-8 mb-6 border-2 ${verificationService.getRiskLevelColor(result.overall_risk_level)}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex-shrink-0">{getRiskIcon(result.overall_risk_level)}</div>
            <div className="min-w-0">
              <p className={`text-sm text-gray-600 mb-1 ${bnFont}`}>{t('verification.result.overallStatus')}</p>
              <h2 className={`text-2xl sm:text-3xl font-bold break-words ${bnFont}`}>
                {verificationService.getRiskLevelIcon(result.overall_risk_level)}{' '}
                {getRiskLabel(result.overall_risk_level)}
              </h2>
              <p className="text-sm mt-2 break-words">
                {t('verification.caseId')}: <span className="font-mono break-all">{result.case_id}</span>
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-3xl sm:text-4xl font-bold text-gray-700">{result.risk_score}</div>
            <div className={`text-sm text-gray-600 ${bnFont}`}>{t('verification.result.riskScore')}</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-900">{result.total_checks}</div>
          <div className={`text-sm text-gray-600 ${bnFont}`}>{t('verification.result.totalChecks')}</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-green-600">{result.passed_checks}</div>
          <div className={`text-sm text-gray-600 ${bnFont}`}>{t('verification.result.passed')}</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-yellow-600">{result.warnings}</div>
          <div className={`text-sm text-gray-600 ${bnFont}`}>{t('verification.result.warnings')}</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-red-600">{result.critical_issues}</div>
          <div className={`text-sm text-gray-600 ${bnFont}`}>{t('verification.result.criticalIssues')}</div>
        </div>
      </div>

      {/* Verification Checks */}
      <div className="card p-6 mb-6">
        <h2 className={`text-2xl font-semibold mb-6 ${bnFont}`}>{t('verification.result.findings')}</h2>
        <div className="space-y-6">
          {result.checks.map((check, idx) => (
            <div key={idx} className="border-l-4 border-gray-300 pl-4">
              <h3 className={`text-lg font-semibold text-gray-900 mb-3 ${bnFont}`}>{t(`verification.checks.${check.check_name}`, check.check_name)}</h3>
              <div className="space-y-4">
                {check.findings.map((finding, findingIdx) => (
                  <FindingCard key={findingIdx} finding={finding} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('verification.result.recommendedActions')}</h2>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className={`flex items-start ${bnFont}`}>
                <span className="text-primary-600 mr-2">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="card p-6 bg-gray-50 mb-6">
        <h3 className={`font-semibold text-gray-900 mb-3 ${i18n.language === 'bn' ? 'font-bengali' : ''}`}>
          {t('disclaimer.title')}
        </h3>
        <p className={`text-sm text-gray-700 ${i18n.language === 'bn' ? 'font-bengali' : ''}`}>
          {t('disclaimer.text')}
        </p>
      </div>

      {/* Due-Diligence Report (Phase 11A) */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start min-w-0">
            <FileText className="w-8 h-8 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className={`text-xl font-semibold text-gray-900 ${bnFont}`}>
                {t('verification.generateReport')}
              </h2>
              {report ? (
                <p className={`text-sm text-green-700 mt-1 break-words ${bnFont}`}>
                  ✓ {t('verification.result.reportReady')} — <span className="font-mono break-all">{report.report_id}</span>
                </p>
              ) : (
                <p className={`text-sm text-gray-600 mt-1 ${bnFont}`}>
                  {t('verification.result.reportNotice')}
                </p>
              )}
              {reportError && (
                <p className="text-sm text-red-700 mt-2">{reportError}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!report ? (
              <button
                onClick={handleGenerateReport}
                disabled={reportBusy !== null}
                className="btn-primary flex items-center space-x-2 disabled:opacity-60"
              >
                {reportBusy === 'generate'
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <FileText className="w-5 h-5" />}
                <span className={bnFont}>
                  {reportBusy === 'generate'
                    ? t('verification.result.reportGenerating')
                    : t('verification.generateReport')}
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleViewReport}
                  disabled={reportBusy !== null}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-60"
                >
                  {reportBusy === 'view'
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Eye className="w-5 h-5" />}
                  <span className={bnFont}>{t('verification.result.reportView')}</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={reportBusy !== null}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-60"
                >
                  {reportBusy === 'download'
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Download className="w-5 h-5" />}
                  <span className={bnFont}>{t('verification.result.reportDownload')}</span>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-start bg-amber-50 border border-amber-200 rounded-md p-3">
          <Info className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className={`text-xs text-amber-800 ${bnFont}`}>
            {t('verification.result.reportNotice')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-secondary"
        >
          {t('verification.result.backToDashboard')}
        </button>
      </div>
    </div>
  );
}
