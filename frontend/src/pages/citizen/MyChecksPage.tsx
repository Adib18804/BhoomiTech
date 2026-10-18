import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileCheck, AlertTriangle, Loader2, RefreshCw, Eye, FileText, Clock } from 'lucide-react';
import verificationService, { VerificationCaseSummary } from '../../services/verificationService';

const RISK_STYLES: Record<string, string> = {
  LOW_CONCERN: 'text-green-700 bg-green-100 border-green-200',
  REVIEW_REQUIRED: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  HIGH_ATTENTION: 'text-orange-700 bg-orange-100 border-orange-200',
  CRITICAL_SIGNAL: 'text-red-700 bg-red-100 border-red-200',
  INSUFFICIENT_DATA: 'text-gray-700 bg-gray-100 border-gray-200',
};

export default function MyChecksPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [cases, setCases] = useState<VerificationCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCases(await verificationService.listMyCases());
    } catch {
      setError(t('myChecks.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString(isBn ? 'bn-BD' : 'en-GB', {
      dateStyle: 'medium', timeStyle: 'short',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 ${bnFont}`}>{t('myChecks.title')}</h1>
          <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('myChecks.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/land-search')} className="btn-primary">
          {t('myChecks.startCheck')}
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-10 h-10 text-primary-600 mx-auto mb-3 animate-spin" />
          <p className={`text-gray-600 ${bnFont}`}>{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="w-9 h-9 text-red-600 mx-auto mb-3" />
          <p className={`text-red-700 mb-4 ${bnFont}`}>{error}</p>
          <button onClick={load} className="btn-primary inline-flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span className={bnFont}>{t('myChecks.retry')}</span>
          </button>
        </div>
      ) : cases.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <FileCheck className="w-14 h-14 mx-auto mb-4 text-gray-400" />
          <p className={`mb-4 ${bnFont}`}>{t('myChecks.noChecks')}</p>
          <button onClick={() => navigate('/land-search')} className="btn-primary">
            {t('myChecks.startCheck')}
          </button>
        </div>
      ) : (
        <div className="card p-6">
          <div className="space-y-3">
            {cases.map((c) => (
              <div key={c.case_id} className="border border-gray-200 rounded-md p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_STYLES[c.overall_risk_level || ''] || RISK_STYLES.INSUFFICIENT_DATA} ${bnFont}`}>
                        {t(`riskLevels.${c.overall_risk_level}`, c.overall_risk_level || '')}
                      </span>
                      {c.has_report && (
                        <span className="inline-flex items-center text-xs text-green-700">
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          <span className={bnFont}>{t('myChecks.reportYes')}</span>
                        </span>
                      )}
                    </div>
                    <p className={`text-sm text-gray-900 font-medium ${bnFont}`}>
                      {c.district_name} › {c.upazila_name} › {c.mouza_name}
                    </p>
                    <p className={`text-sm text-gray-700 ${bnFont}`}>
                      {c.survey_type} · {t('dashboard.khatian')} {c.khatian_no} · {t('dashboard.dag')} {c.dag_no}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{c.case_id}</p>
                    <p className={`text-xs text-gray-500 mt-1 flex items-center ${bnFont}`}>
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {t('myChecks.checkedOn')} {fmtDate(c.completed_at || c.initiated_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/verification/case/${c.case_id}`)}
                    className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0 flex items-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span className={bnFont}>{t('myChecks.viewResult')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
