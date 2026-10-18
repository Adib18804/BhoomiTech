import { useState, useEffect, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Shield, Settings, ScrollText, RefreshCw, AlertTriangle, Loader2,
  Lock, CheckCircle2, XCircle, Building2, Landmark, Map as MapIcon, Activity,
  AlertOctagon, TrendingUp, MapPin, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
} from 'lucide-react';
import superAdminService, {
  ManagedUser, ManagedUserList, AuditLogEntry, SystemSetting, SystemStats,
  LocationDivision, LocationDistrict, LocationUpazila, LocationMouza,
} from '../../services/superAdminService';

const ROLE_STYLES: Record<string, string> = {
  citizen: 'text-blue-700 bg-blue-100 border-blue-200',
  admin: 'text-purple-700 bg-purple-100 border-purple-200',
  super_admin: 'text-red-700 bg-red-100 border-red-200',
};

const RISK_STYLES: Record<string, string> = {
  LOW_CONCERN: 'text-green-700 bg-green-100 border-green-200',
  REVIEW_REQUIRED: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  HIGH_ATTENTION: 'text-orange-700 bg-orange-100 border-orange-200',
  CRITICAL_SIGNAL: 'text-red-700 bg-red-100 border-red-200',
  INSUFFICIENT_DATA: 'text-gray-700 bg-gray-100 border-gray-200',
};

export default function SuperAdminDashboard() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [users, setUsers] = useState<ManagedUserList | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  // Location reference data (divisions / districts / upazilas / mouzas)
  const [divisions, setDivisions] = useState<LocationDivision[]>([]);
  const [locationDivisionId, setLocationDivisionId] = useState<number | ''>('');
  const [districts, setDistricts] = useState<LocationDistrict[]>([]);
  const [locBusy, setLocBusy] = useState(false);
  const [locError, setLocError] = useState('');
  const [locMessage, setLocMessage] = useState('');
  const [showDistrictForm, setShowDistrictForm] = useState(false);
  const [districtForm, setDistrictForm] = useState<{
    id: number | null; division_id: number | ''; name_en: string; name_bn: string; code: string;
  }>({ id: null, division_id: '', name_en: '', name_bn: '', code: '' });
  const [expandedDistrictId, setExpandedDistrictId] = useState<number | null>(null);
  const [expandedUpazilaId, setExpandedUpazilaId] = useState<number | null>(null);
  const [upazilasByDistrict, setUpazilasByDistrict] = useState<Record<number, LocationUpazila[]>>({});
  const [mouzasByUpazila, setMouzasByUpazila] = useState<Record<number, LocationMouza[]>>({});

  const load = useCallback(async (role = roleFilter, q = search) => {
    setLoading(true);
    setError('');
    try {
      const [userList, logs, settingRows, systemStats] = await Promise.all([
        superAdminService.listUsers(role || undefined, q || undefined),
        superAdminService.listAuditLogs(10),
        superAdminService.listSettings(),
        superAdminService.getSystemStats(),
      ]);
      setUsers(userList);
      setAuditLogs(logs);
      setSettings(settingRows);
      setStats(systemStats);
    } catch {
      setError(t('superAdminDash.loadError'));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, t]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString(isBn ? 'bn-BD' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleStatusChange = async (user: ManagedUser) => {
    const target = user.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(t(`superAdminDash.confirm${target === 'activate' ? 'Activate' : 'Deactivate'}`, { email: user.email }))) {
      return;
    }
    setBusyUserId(user.id);
    setActionError('');
    try {
      await superAdminService.updateUserStatus(user.id, !user.is_active);
      await load();
    } catch {
      setActionError(t('superAdminDash.actionError'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRoleChange = async (user: ManagedUser, role: string) => {
    if (role === user.role) return;
    if (!window.confirm(t('superAdminDash.confirmRole', { email: user.email, role }))) {
      await load(); // reset the select
      return;
    }
    setBusyUserId(user.id);
    setActionError('');
    try {
      await superAdminService.updateUserRole(user.id, role);
      await load();
    } catch {
      setActionError(t('superAdminDash.actionError'));
      await load();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleSettingSave = async (setting: SystemSetting, value: string) => {
    if (value === setting.value) return;
    setActionError('');
    try {
      await superAdminService.updateSetting(setting.key, value);
      await load();
    } catch {
      setActionError(t('superAdminDash.actionError'));
    }
  };

  const loadLocations = useCallback(async (divisionId?: number) => {
    setLocBusy(true);
    setLocError('');
    try {
      const [divRows, distRows] = await Promise.all([
        superAdminService.listDivisions(),
        superAdminService.listDistricts(divisionId),
      ]);
      setDivisions(divRows);
      setDistricts(distRows);
    } catch {
      setLocError(t('superAdminDash.locationsLoadError'));
    } finally {
      setLocBusy(false);
    }
  }, [t]);

  useEffect(() => {
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateDistrict = () => {
    setDistrictForm({ id: null, division_id: locationDivisionId, name_en: '', name_bn: '', code: '' });
    setShowDistrictForm(true);
    setLocError('');
    setLocMessage('');
  };

  const openEditDistrict = (d: LocationDistrict) => {
    setDistrictForm({
      id: d.id,
      division_id: d.division_id ?? '',
      name_en: d.name_en,
      name_bn: d.name_bn ?? '',
      code: d.code ?? '',
    });
    setShowDistrictForm(true);
    setLocError('');
    setLocMessage('');
  };

  const closeDistrictForm = () => {
    setDistrictForm({ id: null, division_id: '', name_en: '', name_bn: '', code: '' });
    setShowDistrictForm(false);
  };

  const handleDistrictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocError('');
    setLocMessage('');
    if (!districtForm.name_en.trim() || !districtForm.code.trim()) {
      setLocError(t('superAdminDash.locationsRequired'));
      return;
    }
    setLocBusy(true);
    try {
      const payload = {
        division_id: districtForm.division_id === '' ? null : Number(districtForm.division_id),
        name_en: districtForm.name_en.trim(),
        name_bn: districtForm.name_bn.trim() || undefined,
        code: districtForm.code.trim(),
      };
      if (districtForm.id) {
        await superAdminService.updateDistrict(districtForm.id, payload);
        setLocMessage(t('superAdminDash.locationsUpdated'));
      } else {
        await superAdminService.createDistrict(payload);
        setLocMessage(t('superAdminDash.locationsCreated'));
      }
      closeDistrictForm();
      await loadLocations(locationDivisionId === '' ? undefined : locationDivisionId);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setLocError(status === 409
        ? t('superAdminDash.locationsDuplicate')
        : t('superAdminDash.locationsError'));
    } finally {
      setLocBusy(false);
    }
  };

  const handleDeleteDistrict = async (d: LocationDistrict) => {
    if (!window.confirm(t('superAdminDash.locationsConfirmDelete', { name: d.name_en }))) return;
    setLocError('');
    setLocMessage('');
    setLocBusy(true);
    try {
      await superAdminService.deleteDistrict(d.id);
      setLocMessage(t('superAdminDash.locationsDeleted'));
      if (expandedDistrictId === d.id) setExpandedDistrictId(null);
      await loadLocations(locationDivisionId === '' ? undefined : locationDivisionId);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setLocError(status === 409
        ? t('superAdminDash.locationsDeleteBlocked')
        : t('superAdminDash.locationsError'));
    } finally {
      setLocBusy(false);
    }
  };

  const toggleDistrict = async (d: LocationDistrict) => {
    if (expandedDistrictId === d.id) {
      setExpandedDistrictId(null);
      return;
    }
    setExpandedDistrictId(d.id);
    setExpandedUpazilaId(null);
    if (!upazilasByDistrict[d.id]) {
      try {
        const rows = await superAdminService.listUpazilas(d.id);
        setUpazilasByDistrict((prev) => ({ ...prev, [d.id]: rows }));
      } catch {
        setLocError(t('superAdminDash.locationsLoadError'));
      }
    }
  };

  const toggleUpazila = async (u: LocationUpazila) => {
    if (expandedUpazilaId === u.id) {
      setExpandedUpazilaId(null);
      return;
    }
    setExpandedUpazilaId(u.id);
    if (!mouzasByUpazila[u.id]) {
      try {
        const rows = await superAdminService.listMouzas(u.id);
        setMouzasByUpazila((prev) => ({ ...prev, [u.id]: rows }));
      } catch {
        setLocError(t('superAdminDash.locationsLoadError'));
      }
    }
  };

  const roleLabel = (role: string) =>
    t(`superAdminDash.roles.${role}`, role.replace(/_/g, ' '));

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-12 text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className={`text-gray-600 ${bnFont}`}>{t('superAdminDash.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !users) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <p className={`text-red-700 mb-4 ${bnFont}`}>{error || t('superAdminDash.loadError')}</p>
          <button onClick={() => load()} className="btn-primary inline-flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span className={bnFont}>{t('superAdminDash.retry')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('nav.superAdmin')} — {t('superAdminDash.title')}</h1>
        <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('superAdminDash.subtitle')}</p>
      </div>

      {/* Application administration vs government authority notice */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Building2 className="w-6 h-6 text-amber-700 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`font-semibold text-amber-900 ${bnFont}`}>
              {t('superAdminDash.appAdminNotice')}
            </p>
            <p className={`text-sm text-amber-800 mt-1 ${bnFont}`}>
              {t('superAdminDash.appAdminNoteDetail')}
            </p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <p className={`text-sm text-red-700 ${bnFont}`}>{actionError}</p>
        </div>
      )}

      {/* Role totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <Users className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{users.totals.all}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{t('superAdminDash.totalUsers')}</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-gray-900">{users.totals.citizen}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{roleLabel('citizen')}</p>
        </div>
        <div className="card p-5">
          <Shield className="w-7 h-7 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{users.totals.admin}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{roleLabel('admin')}</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl font-bold text-gray-900">{users.totals.super_admin}</p>
          <p className={`text-sm text-gray-600 ${bnFont}`}>{roleLabel('super_admin')}</p>
        </div>
      </div>

      {/* System overview (real DB/API statistics, no security internals) */}
      {stats && (
        <>
          <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('superAdminDash.systemOverview')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div className="card p-4">
              <Users className="w-7 h-7 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_citizens}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalCitizens')}</p>
            </div>
            <div className="card p-4">
              <Shield className="w-7 h-7 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_admins}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalAdmins')}</p>
            </div>
            <div className="card p-4">
              <Landmark className="w-7 h-7 text-primary-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_districts}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalDistricts')}</p>
            </div>
            <div className="card p-4">
              <Landmark className="w-7 h-7 text-primary-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_upazilas}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalUpazilas')}</p>
            </div>
            <div className="card p-4">
              <MapIcon className="w-7 h-7 text-primary-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_mouzas}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalMouzas')}</p>
            </div>
            <div className="card p-4">
              <MapIcon className="w-7 h-7 text-primary-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_parcels}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalParcels')}</p>
            </div>
            <div className="card p-4">
              <Activity className="w-7 h-7 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.total_verification_cases}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.totalVerificationCases')}</p>
            </div>
            <div className="card p-4">
              <AlertOctagon className="w-7 h-7 text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.high_attention}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.highAttention')}</p>
            </div>
            <div className="card p-4">
              <AlertTriangle className="w-7 h-7 text-red-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totals.critical_signals}</p>
              <p className={`text-xs text-gray-600 ${bnFont}`}>{t('superAdminDash.criticalSignals')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Risk distribution */}
            <div className="card p-6">
              <h3 className={`text-lg font-semibold mb-4 ${bnFont}`}>{t('superAdminDash.riskDistribution')}</h3>
              <div className="space-y-3">
                {Object.entries(stats.risk_distribution).map(([level, count]) => {
                  const total = Math.max(1, Object.values(stats.risk_distribution).reduce((a, b) => a + b, 0));
                  return (
                    <div key={level} className="flex items-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold w-28 sm:w-40 shrink-0 text-center ${RISK_STYLES[level] || RISK_STYLES.INSUFFICIENT_DATA} ${bnFont}`}>
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

            {/* Cases by jurisdiction */}
            <div className="card p-6">
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${bnFont}`}>
                <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                {t('superAdminDash.casesByJurisdiction')}
              </h3>
              {stats.cases_by_jurisdiction.length === 0 ? (
                <p className={`text-sm text-gray-500 py-6 text-center ${bnFont}`}>{t('superAdminDash.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {stats.cases_by_jurisdiction.map((j) => {
                    const max = Math.max(1, ...stats.cases_by_jurisdiction.map((x) => x.count));
                    return (
                      <div key={j.upazila} className="flex items-center">
                        <span className={`text-sm text-gray-700 w-24 sm:w-32 shrink-0 truncate ${bnFont}`}>{j.upazila}</span>
                        <div className="flex-grow min-w-0 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(j.count / max) * 100}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-10 text-right">{j.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Data completeness */}
            <div className="card p-6">
              <h3 className={`text-lg font-semibold mb-4 ${bnFont}`}>{t('superAdminDash.dataCompleteness')}</h3>
              <div className="space-y-4">
                {[
                  ['geometry', t('superAdminDash.completenessGeometry')],
                  ['ownership', t('superAdminDash.completenessOwnership')],
                  ['chouhaddi', t('superAdminDash.completenessChouhaddi')],
                ].map(([key, label]) => {
                  const pct = stats.data_completeness[key] ?? 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={`text-gray-700 ${bnFont}`}>{label}</span>
                        <span className="font-semibold text-gray-900">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className="card p-6">
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${bnFont}`}>
                <Activity className="w-5 h-5 mr-2 text-primary-600" />
                {t('superAdminDash.recentActivity')}
              </h3>
              {stats.recent_activity.length === 0 ? (
                <p className={`text-sm text-gray-500 py-6 text-center ${bnFont}`}>{t('superAdminDash.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {stats.recent_activity.map((a, i) => (
                    <div key={i} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-mono text-gray-500">{a.action_type}</span>
                        <span className="text-xs text-gray-400">{fmtDate(a.created_at)}</span>
                      </div>
                      <p className={`text-sm text-gray-800 mt-1 ${bnFont}`}>{a.action_description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* User management */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className={`text-xl font-semibold ${bnFont}`}>{t('superAdminDash.userManagement')}</h2>
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder={t('superAdminDash.searchPlaceholder')}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full sm:w-56"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); load(e.target.value, search); }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-grow sm:flex-grow-0"
            >
              <option value="">{t('superAdminDash.allRoles')}</option>
              <option value="citizen">{roleLabel('citizen')}</option>
              <option value="admin">{roleLabel('admin')}</option>
              <option value="super_admin">{roleLabel('super_admin')}</option>
            </select>
            <button onClick={() => load()} className="btn-secondary text-sm flex items-center space-x-1">
              <RefreshCw className="w-4 h-4" />
              <span className={bnFont}>{t('superAdminDash.refresh')}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-2 pr-4">{t('superAdminDash.user')}</th>
                <th className="py-2 pr-4">{t('superAdminDash.role')}</th>
                <th className="py-2 pr-4">{t('superAdminDash.status')}</th>
                <th className="py-2 pr-4">{t('superAdminDash.lastLogin')}</th>
                <th className="py-2 pr-4 text-right">{t('superAdminDash.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.users.map((u) => (
                <tr key={u.id} className={busyUserId === u.id ? 'opacity-50' : ''}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    {busyUserId === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className={`inline-block px-2 py-1 rounded-full border text-xs font-semibold ${ROLE_STYLES[u.role] || ROLE_STYLES.citizen}`}
                      >
                        <option value="citizen">{roleLabel('citizen')}</option>
                        <option value="admin">{roleLabel('admin')}</option>
                        <option value="super_admin">{roleLabel('super_admin')}</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {u.is_active ? (
                        <span className={`inline-flex items-center text-xs text-green-700 ${bnFont}`}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />{t('superAdminDash.active')}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center text-xs text-red-700 ${bnFont}`}>
                          <XCircle className="w-4 h-4 mr-1" />{t('superAdminDash.inactive')}
                        </span>
                      )}
                      {u.is_locked && (
                        <span className="inline-flex items-center text-xs text-orange-700" title={t('superAdminDash.locked')}>
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-500">{fmtDate(u.last_login_at)}</td>
                  <td className="py-3 pr-4 text-right">
                    <button
                      onClick={() => handleStatusChange(u)}
                      disabled={busyUserId === u.id}
                      className={`${u.is_active ? 'btn-secondary text-red-700 border-red-200' : 'btn-secondary text-green-700 border-green-200'} text-xs px-3 py-1 disabled:opacity-50`}
                    >
                      {u.is_active ? t('superAdminDash.deactivate') : t('superAdminDash.activate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location reference data management */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className={`text-xl font-semibold flex items-center ${bnFont}`}>
            <MapPin className="w-5 h-5 mr-2 text-primary-600" />
            {t('superAdminDash.locations')}
          </h2>
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            <select
              value={locationDivisionId}
              onChange={(e) => {
                const v = e.target.value === '' ? '' : Number(e.target.value);
                setLocationDivisionId(v);
                setExpandedDistrictId(null);
                setExpandedUpazilaId(null);
                loadLocations(v === '' ? undefined : v);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm flex-grow sm:flex-grow-0"
            >
              <option value="">{t('superAdminDash.allDivisions')}</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {isBn ? (d.name_bn || d.name_en) : d.name_en}
                </option>
              ))}
            </select>
            <button onClick={openCreateDistrict} className="btn-primary text-sm flex items-center space-x-1">
              <Plus className="w-4 h-4" />
              <span className={bnFont}>{t('superAdminDash.addDistrict')}</span>
            </button>
            <button
              onClick={() => loadLocations(locationDivisionId === '' ? undefined : locationDivisionId)}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${locBusy ? 'animate-spin' : ''}`} />
              <span className={bnFont}>{t('superAdminDash.refresh')}</span>
            </button>
          </div>
        </div>

        <p className={`text-xs text-gray-500 mb-3 ${bnFont}`}>{t('superAdminDash.locationsNotice')}</p>

        {locMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-3">
            <p className={`text-sm text-green-700 ${bnFont}`}>{locMessage}</p>
          </div>
        )}
        {locError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-3">
            <p className={`text-sm text-red-700 ${bnFont}`}>{locError}</p>
          </div>
        )}

        {showDistrictForm && (
          <form onSubmit={handleDistrictSubmit} className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
            <p className={`font-semibold text-gray-800 mb-3 ${bnFont}`}>
              {districtForm.id ? t('superAdminDash.editDistrict') : t('superAdminDash.addDistrict')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className={`text-sm ${bnFont}`}>
                <span className="block text-gray-700 mb-1">{t('superAdminDash.fieldNameEn')}</span>
                <input
                  value={districtForm.name_en}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, name_en: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
                />
              </label>
              <label className={`text-sm ${bnFont}`}>
                <span className="block text-gray-700 mb-1">{t('superAdminDash.fieldNameBn')}</span>
                <input
                  value={districtForm.name_bn}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, name_bn: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
                />
              </label>
              <label className={`text-sm ${bnFont}`}>
                <span className="block text-gray-700 mb-1">{t('superAdminDash.fieldCode')}</span>
                <input
                  value={districtForm.code}
                  onChange={(e) => setDistrictForm((f) => ({ ...f, code: e.target.value }))}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
                />
              </label>
              <label className={`text-sm ${bnFont}`}>
                <span className="block text-gray-700 mb-1">{t('superAdminDash.fieldDivision')}</span>
                <select
                  value={districtForm.division_id}
                  onChange={(e) => setDistrictForm((f) => ({
                    ...f,
                    division_id: e.target.value === '' ? '' : Number(e.target.value),
                  }))}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
                >
                  <option value="">{t('superAdminDash.noDivision')}</option>
                  {divisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {isBn ? (d.name_bn || d.name_en) : d.name_en}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button type="submit" disabled={locBusy} className="btn-primary text-sm disabled:opacity-50">
                {t('common.save')}
              </button>
              <button type="button" onClick={closeDistrictForm} className="btn-secondary text-sm">
                {t('common.cancel')}
              </button>
              {locBusy && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-2 pr-4">{t('superAdminDash.fieldNameEn')}</th>
                <th className="py-2 pr-4">{t('superAdminDash.fieldNameBn')}</th>
                <th className="py-2 pr-4">{t('superAdminDash.fieldDivision')}</th>
                <th className="py-2 pr-4">{t('superAdminDash.fieldCode')}</th>
                <th className="py-2 pr-4 text-right">{t('superAdminDash.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {districts.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`py-6 text-center text-gray-500 ${bnFont}`}>
                    {locBusy ? t('common.loading') : t('superAdminDash.noData')}
                  </td>
                </tr>
              ) : (
                districts.map((d) => {
                  const division = divisions.find((x) => x.id === d.division_id);
                  const isExpanded = expandedDistrictId === d.id;
                  const upazilaRows = upazilasByDistrict[d.id];
                  return (
                    <Fragment key={d.id}>
                      <tr>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => toggleDistrict(d)}
                            className="inline-flex items-center text-left font-medium text-gray-900 hover:text-primary-700"
                          >
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 mr-1 flex-shrink-0" />
                              : <ChevronRight className="w-4 h-4 mr-1 flex-shrink-0" />}
                            <span className={bnFont}>{d.name_en}</span>
                          </button>
                        </td>
                        <td className={`py-3 pr-4 text-gray-700 ${bnFont}`}>{d.name_bn || '-'}</td>
                        <td className={`py-3 pr-4 text-gray-700 ${bnFont}`}>
                          {division ? (isBn ? (division.name_bn || division.name_en) : division.name_en) : '-'}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-500">{d.code || '-'}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => openEditDistrict(d)}
                              className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center space-x-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className={bnFont}>{t('common.edit')}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDistrict(d)}
                              disabled={locBusy}
                              className="btn-secondary text-red-700 border-red-200 text-xs px-2.5 py-1 inline-flex items-center space-x-1 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className={bnFont}>{t('common.delete')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 px-4 py-3">
                            {!upazilaRows ? (
                              <p className={`text-xs text-gray-500 ${bnFont}`}>{t('common.loading')}</p>
                            ) : upazilaRows.length === 0 ? (
                              <p className={`text-xs text-gray-500 ${bnFont}`}>{t('superAdminDash.noUpazilas')}</p>
                            ) : (
                              <ul className="space-y-2">
                                {upazilaRows.map((u) => {
                                  const isUpExpanded = expandedUpazilaId === u.id;
                                  const mouzaRows = mouzasByUpazila[u.id];
                                  return (
                                    <li key={u.id} className="border border-gray-200 rounded-md bg-white p-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleUpazila(u)}
                                        className="inline-flex items-center text-sm text-gray-800 hover:text-primary-700"
                                      >
                                        {isUpExpanded
                                          ? <ChevronDown className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                          : <ChevronRight className="w-3.5 h-3.5 mr-1 flex-shrink-0" />}
                                        <span className={`font-medium ${bnFont}`}>{u.name_en}</span>
                                        <span className="text-xs text-gray-500 ml-2">{u.name_bn}</span>
                                      </button>
                                      {isUpExpanded && (
                                        <div className="mt-2 pl-5">
                                          {!mouzaRows ? (
                                            <p className={`text-xs text-gray-500 ${bnFont}`}>{t('common.loading')}</p>
                                          ) : mouzaRows.length === 0 ? (
                                            <p className={`text-xs text-gray-500 ${bnFont}`}>{t('superAdminDash.noMouzas')}</p>
                                          ) : (
                                            <ul className="space-y-1">
                                              {mouzaRows.map((m) => (
                                                <li key={m.id} className="text-xs text-gray-700">
                                                  <span className={bnFont}>{m.name_en}</span>
                                                  {m.name_bn ? <span className={`text-gray-500 ml-2 ${bnFont}`}>{m.name_bn}</span> : null}
                                                  {m.jl_no ? <span className="font-mono text-gray-400 ml-2">JL {m.jl_no}</span> : null}
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Audit logs */}
        <div className="card p-6">
          <h2 className={`text-lg font-semibold mb-4 flex items-center ${bnFont}`}>
            <ScrollText className="w-5 h-5 mr-2 text-primary-600" />
            {t('superAdminDash.auditLogs')}
          </h2>
          {auditLogs.length === 0 ? (
            <p className={`text-sm text-gray-500 ${bnFont}`}>{t('superAdminDash.noAuditLogs')}</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-mono text-gray-500">{log.action_type}</span>
                    <span className="text-xs text-gray-400">{fmtDate(log.created_at)}</span>
                  </div>
                  <p className={`text-sm text-gray-800 mt-1 ${bnFont}`}>{log.action_description}</p>
                  <p className="text-xs text-gray-500">
                    {log.actor_email ? `${log.actor_email}` : 'system'} · {log.success}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System settings */}
        <div className="card p-6">
          <h2 className={`text-lg font-semibold mb-4 flex items-center ${bnFont}`}>
            <Settings className="w-5 h-5 mr-2 text-primary-600" />
            {t('superAdminDash.settings')}
          </h2>
          {settings.length === 0 ? (
            <p className={`text-sm text-gray-500 ${bnFont}`}>{t('superAdminDash.noSettings')}</p>
          ) : (
            <div className="space-y-3">
              {settings.map((s) => (
                <div key={s.key} className="border border-gray-200 rounded-md p-3">
                  <p className="text-sm font-mono text-gray-900">{s.key}</p>
                  <p className={`text-xs text-gray-500 mb-2 ${bnFont}`}>
                    {isBn ? (s.description_bn || s.description_en) : (s.description_en || s.description_bn)}
                  </p>
                  {s.is_editable ? (
                    <input
                      defaultValue={s.value ?? ''}
                      onBlur={(e) => handleSettingSave(s, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full"
                    />
                  ) : (
                    <p className="text-sm text-gray-700">{s.value}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
