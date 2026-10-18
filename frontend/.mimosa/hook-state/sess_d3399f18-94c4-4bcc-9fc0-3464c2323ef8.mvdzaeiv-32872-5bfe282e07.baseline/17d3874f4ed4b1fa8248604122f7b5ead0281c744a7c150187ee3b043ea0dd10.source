import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, FileCheck, FileText, Map, ShieldAlert, Activity, RefreshCw,
  AlertTriangle, Loader2, Database, CheckCircle2, Building2, Landmark,
} from 'lucide-react';
import dashboardService, { AdminDashboard as AdminData } from '../../services/dashboardService';
import adminService, { AdminJurisdiction, AdminStats } from '../../services/adminService';
import JurisdictionLandManager from '../../components/admin/JurisdictionLandManager';

const RISK_STYLES: Record<string, string> = {
  LOW_CONCERN: 'text-green-700 bg-green-100 border-green-200',
  REVIEW_REQUIRED: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  HIGH_ATTENTION: 'text-orange-700 bg-orange-100 border-orange-200',
  CRITICAL_SIGNAL: 'text-red-700 bg-red-100 border-red-200',
  INSUFFICIENT_DATA: 'text-gray-700 bg-gray-100 border-gray-200',
};

const SEVERITY_STYLES: Record<string, string> = {
  low: 'text-gray-700 bg-gray-100 border-gray-200',
  medium: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  high: 'text-orange-700 bg-orange-100 border-orange-200',
  critical: 'text-red-700 bg-red-100 border-red-200',
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<AdminData | null>(null);
  const [jurisdiction, setJurisdiction] = useState<AdminJurisdiction | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const load = async () => {
    setLoading(true);
    setError('');
    setStatsError('');
    try {
      setData(await dashboardService.getAdminDashboard());
    } catch {
      setError(t('adminDash.loadError'));
    } finally {
      setLoading(false);
    }
    // Jurisdiction-scoped data is loaded independently so a missing/absent
    // assigned upazila never blocks the platform overview.
    try {
      const [jur, st] = await Promise.all([
        adminService.getJurisdiction(),
        adminService.getStats(),
      ]);
      setJurisdiction(jur);
      setStats(st);
    } catch {
      setStatsError(t('adminDash.noJurisdiction'));
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
          <p className={`text-gray-600 ${bnFont}`}>{t('adminDash.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <p className={`text-red-700 mb-4 ${bnFont}`}>{error || t('adminDash.loadError')}</p>
          <button onClick={load} className="btn-primary inline-flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span className={bnFont}>{t('adminDash.retry')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.adminDashboard')}</h1>
          <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('adminDash.subtitle')}</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span className={bnFont}>{t('adminDash.refresh')}</span>
        </button>
      </div>

      {/* Assigned jurisdiction */}
      {jurisdiction && (
        <div className="card p-5 mb-6 border-2 border-primary-200">
          <div className="flex items-start">
            <Building2 className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className={`text-lg font-semibold text-gray-900 ${bnFont}`}>
                {t('adminDash.jurisdictionTitle')}
              </h2>
              {jurisdiction.is_global ? (
                <p className={`text-sm text-gray-700 mt-1 ${bnFont}`}>{t('adminDash.globalScope')}</p>
              ) : jurisdiction.assigned_upazila ? (
                <p className={`text-sm text-gray-700 mt-1 ${bnFont}`}>
                  {t('adminDash.assignedUpazila')}:{' '}
                  <span className="font-semibold">
                    {isBn && jurisdiction.assigned_upazila.name_bn
                      ? jurisdiction.assigned_upazila.name_bn
                      : jurisdiction.assigned_upazila.name_en}
                  </span>
                  {jurisdiction.assigned_upazila.district_name
                    ? ` · ${t('adminDash.district')}: ${jurisdiction.assigned_upazila.district_name}`
                    : ''}
                </p>
              ) : (
                <p className={`text-sm text-red-700 mt-1 ${bnFont}`}>{t('adminDash.noJurisdiction')}</p>
              )}
              <p className={`text-xs text-gray-500 mt-2 ${bnFont}`}>{t('adminDash.jurisdictionNote')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Jurisdiction statistics (real DB counts, scoped server-side) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="card p-4">
            <Landmark className="w-7 h-7 text-primary-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totals.mouzas}</p>
            <p className={`text-xs text-gray-600 ${bnFont}`}>{t('adminDash.statMouzas')}</p>
          </div>
          <div className="card p-4">
            <FileText className="w-7 h-7 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totals.khatian_records}</p>
            <p className={`text-xs text-gray-600 ${bnFont}`}>{t('adminDash.statKhatians')}</p>
          </div>
          <div className="card p-4">
            <FileText className="w-7 h-7 text-indigo-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totals.dag_records}</p>
            <p className={`text-xs text-gray-600 ${bnFont}`}>{t('adminDash.statDags')}</p>
          </div>
          <div className="card p-4">
            <Map className="w-7 h-7 text-primary-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totals.parcels}</p>
            <p className={`text-xs text-gray-600 ${bnFont}`}>{t('adminDash.statParcels')}</p>
          </div>
          <div className="card p-4">
            <Activity className="w-7 h-7 text-amber-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totals.pending_updates}</p>
            <p className={`text-xs text-gray-600 ${bnFont}`}>{t('adminDash.statPendingUpdates')}</p>
          </div>
          <div className="card p-4">
            <FileCheck className="w-7 h-7 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totals.verification_cases}</p>
            <p className={`text-xs text-gray-600 ${bnFont}`}>{t('adminDash.statVerificationCases')}</p>
          </div>
        </div>
      )}

      {statsError && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6">
          <p className={`text-sm text-amber-800 ${bnFont}`}>{statsError}</p>
        </div>
      )}

      {/* Manage land records (jurisdiction-scoped workflow) */}
      <JurisdictionLandManager />

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="card p-5">
          <Users className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{data.totals.total_citizens}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{t('adminDash.totalCitizens')}</p>
        </div>
        <div className="card p-5">
          <FileCheck className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{data.totals.total_cases}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{t('adminDash.totalCases')}</p>
        </div>
        <div className="card p-5">
          <FileText className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{data.totals.total_reports}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{t('adminDash.totalReports')}</p>
        </div>
        <div className="card p-5">
          <Map className="w-8 h-8 text-primary-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{data.totals.total_parcels}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{t('adminDash.totalParcels')}</p>
        </div>
        <div className="card p-5">
          <Activity className="w-8 h-8 text-orange-600 mb-2" />
          <p className={`text-sm font-semibold text-gray-900 mt-2 ${bnFont}`}>
            {t('adminDash.dbStatus')}: {data.system_health.database === 'connected'
              ? t('adminDash.dbConnected') : t('adminDash.dbUnavailable')}
          </p>
          <p className="text-xs text-gray-500">{data.system_health.database_latency_ms} ms · v{data.system_health.app_version}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk distribution */}
        <div className="card p-6">
          <h2 className={`text-lg font-semibold mb-4 ${bnFont}`}>{t('adminDash.riskDistribution')}</h2>
          <div className="space-y-3">
            {Object.entries(data.risk_distribution).map(([level, count]) => {
              const total = Math.max(1, Object.values(data.risk_distribution).reduce((a, b) => a + b, 0));
              return (
                <div key={level} className="flex items-center">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold w-28 sm:w-40 shrink-0 text-center ${RISK_STYLES[level]} ${bnFont}`}>
                    {t(`riskLevels.${level}`, level)}
                  </span>
                  <div className="flex-grow min-w-0 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case status distribution + health */}
        <div className="card p-6">
          <h2 className={`text-lg font-semibold mb-4 ${bnFont}`}>{t('adminDash.statusDistribution')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.case_status_distribution).map(([status, count]) => (
              <div key={status} className="border border-gray-200 rounded-md p-3">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className={`text-xs text-gray-600 capitalize ${bnFont}`}>{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <Database className="w-4 h-4 mr-2 text-green-600" />
            <span className={bnFont}>{t('adminDash.healthNote')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent verification activity */}
        <div className="card p-6">
          <h2 className={`text-lg font-semibold mb-4 ${bnFont}`}>{t('adminDash.recentActivity')}</h2>
          {data.recent_cases.length === 0 ? (
            <p className={`text-sm text-gray-500 py-8 text-center ${bnFont}`}>{t('adminDash.noActivity')}</p>
          ) : (
            <div className="space-y-3">
              {data.recent_cases.map((c) => (
                <div key={c.case_id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_STYLES[c.overall_risk_level || ''] || RISK_STYLES.INSUFFICIENT_DATA} ${bnFont}`}>
                      {t(`riskLevels.${c.overall_risk_level}`, c.overall_risk_level || '')}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{c.case_id}</span>
                  </div>
                  <p className={`text-sm text-gray-800 mt-1 ${bnFont}`}>
                    {c.mouza_name} · {t('dashboard.khatian')} {c.khatian_no} · {t('dashboard.dag')} {c.dag_no}
                  </p>
                  <p className="text-xs text-gray-500">{fmtDate(c.initiated_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent security events */}
        <div className="card p-6">
          <h2 className={`text-lg font-semibold mb-4 flex items-center ${bnFont}`}>
            <ShieldAlert className="w-5 h-5 mr-2 text-orange-600" />
            {t('adminDash.securityEvents')}
          </h2>
          {data.recent_security_events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p className={bnFont}>{t('adminDash.noSecurityEvents')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_security_events.map((e, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${SEVERITY_STYLES[e.severity] || SEVERITY_STYLES.low} ${bnFont}`}>
                      {e.severity}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDate(e.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{e.description}</p>
                  <p className="text-xs text-gray-500">{e.event_type}{e.ip_address ? ` · ${e.ip_address}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
