import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck, PlusCircle, History, FileText, MapPin, Eye, RefreshCw,
  AlertTriangle, Loader2, ShieldCheck, Clock, BookOpen, Search
} from 'lucide-react';
import dashboardService, { CitizenDashboard as DashboardData } from '../../services/dashboardService';

interface BeforeYouBuyItem {
  title: string;
  body: string;
}

const RISK_STYLES: Record<string, string> = {
  LOW_CONCERN: 'text-green-700 bg-green-100 border-green-200',
  REVIEW_REQUIRED: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  HIGH_ATTENTION: 'text-orange-700 bg-orange-100 border-orange-200',
  CRITICAL_SIGNAL: 'text-red-700 bg-red-100 border-red-200',
  INSUFFICIENT_DATA: 'text-gray-700 bg-gray-100 border-gray-200',
};

export default function CitizenDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const dashboard = await dashboardService.getCitizenDashboard();
      setData(dashboard);
    } catch {
      setError(t('dashboard.loadError'));
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
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-12 text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className={`text-gray-600 ${bnFont}`}>{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <p className={`text-red-700 mb-4 ${bnFont}`}>{error}</p>
          <button onClick={load} className="btn-primary inline-flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span className={bnFont}>{t('dashboard.retry')}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasActivity = data.totals.total_cases > 0;
  const beforeYouBuy = t('dashboard.beforeYouBuyItems', { returnObjects: true }) as BeforeYouBuyItem[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('nav.dashboard')}</h1>
        <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('dashboard.subtitle')}</p>
      </div>

      {/* Primary and secondary calls to action */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/land-search')}
          className="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
        >
          <Search className="w-5 h-5 mr-2" />
          <span className={bnFont}>{t('dashboard.checkALand')}</span>
        </button>
        <button
          onClick={() => navigate('/land-buying-guide')}
          className="btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          <span className={bnFont}>{t('dashboard.learnBeforeYouBuy')}</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => navigate('/land-search')}
          className="card p-6 hover:shadow-md transition-shadow text-left"
        >
          <PlusCircle className="w-12 h-12 text-primary-600 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${bnFont}`}>{t('verification.startNew')}</h3>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{t('dashboard.startNewHelp')}</p>
        </button>

        {/* Latest result quick action */}
        <div className="card p-6">
          <ShieldCheck className="w-12 h-12 text-green-600 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${bnFont}`}>{t('dashboard.currentStatus')}</h3>
          {data.latest_case ? (
            <>
              <span className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold ${RISK_STYLES[data.latest_case.overall_risk_level || ''] || RISK_STYLES.INSUFFICIENT_DATA} ${bnFont}`}>
                {t(`riskLevels.${data.latest_case.overall_risk_level}`, data.latest_case.overall_risk_level || '')}
              </span>
              <button
                onClick={() => navigate(`/verification/case/${data.latest_case!.case_id}`)}
                className="mt-4 flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <Eye className="w-4 h-4 mr-1" />
                <span className={bnFont}>{t('dashboard.viewLatestResult')}</span>
              </button>
            </>
          ) : (
            <p className={`text-2xl font-bold text-gray-400 ${bnFont}`}>{t('dashboard.noResultYet')}</p>
          )}
        </div>

        <div className="card p-6">
          <History className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${bnFont}`}>{t('dashboard.totalChecks')}</h3>
          <p className="text-2xl font-bold text-gray-900">{data.totals.total_cases}</p>
          <p className={`text-sm text-gray-500 mt-2 ${bnFont}`}>
            {t('dashboard.completedChecks')}: {data.totals.completed_cases} ·{' '}
            {t('dashboard.totalReports')}: {data.totals.total_reports}
          </p>
        </div>
      </div>

      {/* Before You Buy Land — guidance cards */}
      <div className="mb-8">
        <h2 className={`text-2xl font-semibold text-gray-900 ${bnFont}`}>{t('dashboard.beforeYouBuy')}</h2>
        <p className={`text-gray-600 mt-1 mb-4 ${bnFont}`}>{t('dashboard.beforeYouBuySubtitle')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.isArray(beforeYouBuy) && beforeYouBuy.map((item, idx) => (
            <div key={idx} className="card p-4 border border-gray-200">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center mr-2">
                  {idx + 1}
                </span>
                <div>
                  <h3 className={`text-sm font-semibold text-gray-900 mb-1 ${bnFont}`}>{item.title}</h3>
                  <p className={`text-xs text-gray-600 ${bnFont}`}>{item.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasActivity ? (
        <div className="card p-6">
          <div className="text-center py-12 text-gray-500">
            <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className={bnFont}>{t('dashboard.emptyState')}</p>
            <button
              onClick={() => navigate('/land-search')}
              className="btn-primary mt-4"
            >
              {t('verification.startNew')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent checks */}
          <div className="card p-6">
            <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('dashboard.recentCases')}</h2>
            <div className="space-y-3">
              {data.recent_cases.map((c) => (
                <div key={c.case_id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_STYLES[c.overall_risk_level || ''] || RISK_STYLES.INSUFFICIENT_DATA} ${bnFont}`}>
                          {t(`riskLevels.${c.overall_risk_level}`, c.overall_risk_level || '')}
                        </span>
                        {c.has_report && (
                          <span className="inline-flex items-center text-xs text-green-700">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            <span className={bnFont}>{t('dashboard.reportAvailable')}</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-sm text-gray-900 font-medium truncate ${bnFont}`}>
                        {c.mouza_name} · {t('dashboard.khatian')} {c.khatian_no} · {t('dashboard.dag')} {c.dag_no}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{c.case_id}</p>
                      <p className={`text-xs text-gray-500 mt-1 flex items-center ${bnFont}`}>
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {t('dashboard.checkedOn')} {fmtDate(c.completed_at || c.initiated_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/verification/case/${c.case_id}`)}
                      className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0 flex items-center"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span className={bnFont}>{t('dashboard.viewResult')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent land references */}
          <div className="card p-6">
            <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('dashboard.recentLandRefs')}</h2>
            {data.recent_parcels.length === 0 ? (
              <p className={`text-sm text-gray-500 ${bnFont}`}>{t('dashboard.noResultYet')}</p>
            ) : (
              <div className="space-y-3">
                {data.recent_parcels.map((p) => (
                  <div key={p.parcel_id} className="border border-gray-200 rounded-md p-4 flex items-start">
                    <MapPin className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 font-medium font-mono">{p.parcel_id}</p>
                      <p className={`text-sm text-gray-700 ${bnFont}`}>
                        {p.district_name} › {p.upazila_name} › {p.mouza_name}
                      </p>
                      <p className={`text-xs text-gray-500 ${bnFont}`}>
                        {p.survey_type} · {t('dashboard.khatian')} {p.khatian_no} · {t('dashboard.dag')} {p.dag_no}
                        {p.area_decimal != null && ` · ${p.area_decimal} dec`}
                      </p>
                      <p className={`text-xs text-gray-500 mt-1 flex items-center ${bnFont}`}>
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {t('dashboard.checkedOn')} {fmtDate(p.last_checked_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
