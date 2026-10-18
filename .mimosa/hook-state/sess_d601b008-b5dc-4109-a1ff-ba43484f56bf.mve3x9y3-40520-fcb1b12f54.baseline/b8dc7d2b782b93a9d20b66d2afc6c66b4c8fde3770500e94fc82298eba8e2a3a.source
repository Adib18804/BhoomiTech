import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Pencil, AlertCircle, CheckCircle2 } from 'lucide-react';
import adminService, { AdminParcel, ScopedMouza } from '../../services/adminService';

/**
 * Jurisdiction-scoped land records workflow:
 * Select Assigned Upazila (implicit) -> Select Mouza -> Manage Land Records.
 * All access is enforced server-side; this UI only presents the scoped data.
 */
export default function JurisdictionLandManager() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const [mouzas, setMouzas] = useState<ScopedMouza[]>([]);
  const [mouzaId, setMouzaId] = useState<number | ''>('');
  const [parcels, setParcels] = useState<AdminParcel[]>([]);
  const [loadingMouzas, setLoadingMouzas] = useState(true);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ north: '', south: '', east: '', west: '' });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const mouzaName = (m: ScopedMouza) => (isBn && m.name_bn ? m.name_bn : m.name_en);

  useEffect(() => {
    let mounted = true;
    adminService
      .listMouzas()
      .then((rows) => {
        if (mounted) setMouzas(rows);
      })
      .catch(() => {
        if (mounted) setError(t('adminDash.loadError'));
      })
      .finally(() => {
        if (mounted) setLoadingMouzas(false);
      });
    return () => {
      mounted = false;
    };
  }, [t]);

  const loadParcels = async (id: number) => {
    setLoadingParcels(true);
    setError('');
    setParcels([]);
    try {
      setParcels(await adminService.listParcels(id));
    } catch {
      setError(t('adminDash.loadError'));
    } finally {
      setLoadingParcels(false);
    }
  };

  const handleMouzaChange = (value: string) => {
    const id = value ? Number(value) : '';
    setMouzaId(id);
    setEditing(null);
    setSavedMsg('');
    setSaveError('');
    if (id !== '') loadParcels(id);
  };

  const startEdit = (p: AdminParcel) => {
    setEditing(p.parcel_id);
    setSavedMsg('');
    setSaveError('');
    setForm({
      north: p.chouhaddi.north || '',
      south: p.chouhaddi.south || '',
      east: p.chouhaddi.east || '',
      west: p.chouhaddi.west || '',
    });
  };

  const handleSave = async (parcelId: string) => {
    setSaving(true);
    setSaveError('');
    try {
      const chouhaddi = await adminService.updateChouhaddi(parcelId, {
        north: form.north || null,
        south: form.south || null,
        east: form.east || null,
        west: form.west || null,
      });
      setParcels((prev) =>
        prev.map((p) => (p.parcel_id === parcelId ? { ...p, chouhaddi } : p))
      );
      setEditing(null);
      setSavedMsg(t('adminDash.chouhaddiUpdated'));
    } catch {
      setSaveError(t('adminDash.chouhaddiSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 mb-8">
      <h2 className={`text-xl font-semibold mb-1 flex items-center ${bnFont}`}>
        <MapPin className="w-6 h-6 text-primary-600 mr-2" />
        {t('adminDash.dataManagement')}
      </h2>
      <p className={`text-sm text-gray-600 mb-4 ${bnFont}`}>{t('adminDash.selectMouzaHint')}</p>

      {loadingMouzas ? (
        <div className="flex items-center text-sm text-gray-600 py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className={bnFont}>{t('common.loading')}</span>
        </div>
      ) : mouzas.length === 0 ? (
        <p className={`text-sm text-gray-500 ${bnFont}`}>{t('adminDash.noMouzas')}</p>
      ) : (
        <div className="max-w-md">
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${bnFont}`}>
            {t('adminDash.mouza')}
          </label>
          <select
            value={mouzaId}
            onChange={(e) => handleMouzaChange(e.target.value)}
            className="input-field w-full"
          >
            <option value="">{t('adminDash.selectMouza')}</option>
            {mouzas.map((m) => (
              <option key={m.id} value={m.id}>
                {mouzaName(m)}
                {m.jl_no ? ` (JL ${m.jl_no})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className={bnFont}>{error}</span>
        </div>
      )}

      {savedMsg && (
        <div className="mt-4 flex items-center text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          <span className={bnFont}>{savedMsg}</span>
        </div>
      )}

      {loadingParcels && (
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className={bnFont}>{t('common.loading')}</span>
        </div>
      )}

      {!loadingParcels && mouzaId !== '' && parcels.length === 0 && !error && (
        <p className={`text-sm text-gray-500 mt-4 ${bnFont}`}>{t('adminDash.noParcels')}</p>
      )}

      {parcels.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-2 pr-4">{t('adminDash.parcelId')}</th>
                <th className="py-2 pr-4">{t('adminDash.khatian')}</th>
                <th className="py-2 pr-4">{t('adminDash.dag')}</th>
                <th className="py-2 pr-4">{t('adminDash.area')}</th>
                <th className="py-2 pr-4">{t('chouhaddi.title')}</th>
                <th className="py-2 pr-4 text-right">{t('superAdminDash.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parcels.map((p) => (
                <tr key={p.parcel_id} className="align-top">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-800">{p.parcel_id}</td>
                  <td className="py-3 pr-4 text-gray-800">{p.khatian_no}</td>
                  <td className="py-3 pr-4 text-gray-800">{p.dag_no}</td>
                  <td className="py-3 pr-4 text-gray-800">{p.area_decimal ?? '-'}</td>
                  <td className="py-3 pr-4">
                    {editing === p.parcel_id ? (
                      <div className="grid grid-cols-2 gap-2 max-w-sm">
                        {(['north', 'south', 'east', 'west'] as const).map((dir) => (
                          <div key={dir}>
                            <label className="block text-[11px] text-gray-500 mb-0.5">
                              {t(`adminDash.${dir}`)}
                            </label>
                            <input
                              value={form[dir]}
                              onChange={(e) => setForm({ ...form, [dir]: e.target.value })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-700">
                        {[p.chouhaddi.north, p.chouhaddi.south, p.chouhaddi.east, p.chouhaddi.west]
                          .filter(Boolean)
                          .join(' · ') || t('chouhaddi.notRecorded')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    {editing === p.parcel_id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(p.parcel_id)}
                          disabled={saving}
                          className="btn-primary text-xs px-3 py-1 disabled:opacity-50"
                        >
                          {saving ? t('adminDash.saving') : t('adminDash.saveChouhaddi')}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          disabled={saving}
                          className="btn-secondary text-xs px-3 py-1 disabled:opacity-50"
                        >
                          {t('adminDash.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(p)}
                        className="btn-secondary text-xs px-3 py-1 inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {t('adminDash.editChouhaddi')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {saveError && (
            <p className={`text-sm text-red-700 mt-3 ${bnFont}`}>{saveError}</p>
          )}
          <p className={`text-xs text-gray-500 mt-3 ${bnFont}`}>{t('adminDash.chouhaddiNote')}</p>
        </div>
      )}
    </div>
  );
}
