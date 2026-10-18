import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, PlusCircle, Pencil, Trash2, AlertCircle, CheckCircle2, Newspaper } from 'lucide-react';
import contentService, { LegalUpdate, LegalUpdatePayload } from '../../services/contentService';

const CATEGORIES = [
  'Mutation', 'Land Records', 'Land Map', 'Land Tax',
  'Acquisition', 'Registration', 'Land Administration', 'General Land Service',
];

const STATUSES = ['draft', 'published', 'archived'];

type FormState = LegalUpdatePayload;

const emptyForm: FormState = {
  title_en: '',
  title_bn: '',
  summary_en: '',
  summary_bn: '',
  category: CATEGORIES[0],
  publication_date: '',
  effective_date: '',
  official_source_name: '',
  official_source_url: '',
  language: 'both',
  status: 'draft',
};

/**
 * Legal & Land Update management (Feature #5).
 * Visible to administrators only; citizen access is read-only via /legal-updates.
 * Server-side RBAC + jurisdiction is enforced by the content API.
 */
export default function LegalUpdateManagement() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setUpdates(await contentService.listManage());
    } catch {
      setError(t('legalUpdateManage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setMessage('');
    setShowForm(true);
  };

  const openEdit = (u: LegalUpdate) => {
    setEditingId(u.id);
    setForm({
      title_en: u.title_en,
      title_bn: u.title_bn || '',
      summary_en: u.summary_en,
      summary_bn: u.summary_bn || '',
      category: u.category,
      publication_date: u.publication_date || '',
      effective_date: u.effective_date || '',
      official_source_name: u.official_source_name || '',
      official_source_url: u.official_source_url || '',
      language: u.language,
      status: u.status,
    });
    setFormError('');
    setMessage('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload: FormState = {
        ...form,
        title_bn: form.title_bn || null,
        summary_bn: form.summary_bn || null,
        publication_date: form.publication_date || null,
        effective_date: form.effective_date || null,
        official_source_name: form.official_source_name || null,
        official_source_url: form.official_source_url || null,
      };
      if (editingId) {
        await contentService.update(editingId, payload);
        setMessage(t('legalUpdateManage.updated'));
      } else {
        await contentService.create(payload);
        setMessage(t('legalUpdateManage.created'));
      }
      setShowForm(false);
      await load();
    } catch {
      setFormError(t('legalUpdateManage.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: LegalUpdate) => {
    if (!window.confirm(t('legalUpdateManage.confirmDelete'))) return;
    setBusyId(u.id);
    setMessage('');
    try {
      await contentService.remove(u.id);
      setMessage(t('legalUpdateManage.deleted'));
      await load();
    } catch {
      setError(t('legalUpdateManage.deleteError'));
    } finally {
      setBusyId(null);
    }
  };

  const titleOf = (u: LegalUpdate) => (isBn && u.title_bn ? u.title_bn : u.title_en);
  const catLabel = (c: string) => t(`legalUpdatesPage.categories.${c}`, c);
  const statusLabel = (s: string) => t(`legalUpdatesPage.status.${s}`, s);

  const statusStyle = (s: string) =>
    s === 'published'
      ? 'text-green-700 bg-green-100 border-green-200'
      : s === 'archived'
      ? 'text-gray-700 bg-gray-100 border-gray-200'
      : 'text-amber-700 bg-amber-100 border-amber-200';

  const field = (labelKey: string, node: React.ReactNode) => (
    <div>
      <label className={`block text-sm font-medium text-gray-700 mb-1 ${bnFont}`}>
        {t(`legalUpdateManage.${labelKey}`)}
      </label>
      {node}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 flex items-center ${bnFont}`}>
            <Newspaper className="w-8 h-8 text-primary-600 mr-3" />
            {t('legalUpdateManage.title')}
          </h1>
          <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('legalUpdateManage.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
          <PlusCircle className="w-5 h-5" />
          <span className={bnFont}>{t('legalUpdateManage.newUpdate')}</span>
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-300 rounded-md p-3 mb-6 flex items-start">
        <AlertCircle className="w-4 h-4 text-amber-700 mr-2 mt-0.5 flex-shrink-0" />
        <p className={`text-sm text-amber-900 ${bnFont}`}>{t('legalUpdateManage.notice')}</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-6 flex items-center">
          <CheckCircle2 className="w-4 h-4 text-green-700 mr-2" />
          <span className={`text-sm text-green-800 ${bnFont}`}>{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6 flex items-center">
          <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
          <span className={`text-sm text-red-700 ${bnFont}`}>{error}</span>
        </div>
      )}

      {/* Create / edit form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>
            {editingId ? t('legalUpdateManage.editUpdate') : t('legalUpdateManage.newUpdate')}
          </h2>
          {formError && <p className={`text-sm text-red-700 mb-4 ${bnFont}`}>{formError}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('titleEn', (
                <input
                  required
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  className="input-field w-full"
                />
              ))}
              {field('titleBn', (
                <input
                  value={form.title_bn || ''}
                  onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
                  className="input-field w-full font-bengali"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('summaryEn', (
                <textarea
                  required
                  rows={3}
                  value={form.summary_en}
                  onChange={(e) => setForm({ ...form, summary_en: e.target.value })}
                  className="input-field w-full"
                />
              ))}
              {field('summaryBn', (
                <textarea
                  rows={3}
                  value={form.summary_bn || ''}
                  onChange={(e) => setForm({ ...form, summary_bn: e.target.value })}
                  className="input-field w-full font-bengali"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {field('category', (
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field w-full"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{catLabel(c)}</option>
                  ))}
                </select>
              ))}
              {field('status', (
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-field w-full"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
              ))}
              {field('language', (
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="en">{t('legalUpdateManage.languages.en')}</option>
                  <option value="bn">{t('legalUpdateManage.languages.bn')}</option>
                  <option value="both">{t('legalUpdateManage.languages.both')}</option>
                </select>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('publicationDate', (
                <input
                  type="date"
                  value={form.publication_date || ''}
                  onChange={(e) => setForm({ ...form, publication_date: e.target.value })}
                  className="input-field w-full"
                />
              ))}
              {field('effectiveDate', (
                <input
                  type="date"
                  value={form.effective_date || ''}
                  onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                  className="input-field w-full"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('sourceName', (
                <input
                  value={form.official_source_name || ''}
                  onChange={(e) => setForm({ ...form, official_source_name: e.target.value })}
                  className="input-field w-full"
                />
              ))}
              {field('sourceUrl', (
                <input
                  type="url"
                  placeholder="https://"
                  value={form.official_source_url || ''}
                  onChange={(e) => setForm({ ...form, official_source_url: e.target.value })}
                  className="input-field w-full"
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? t('legalUpdateManage.saving') : t('legalUpdateManage.save')}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="btn-secondary disabled:opacity-60"
              >
                {t('legalUpdateManage.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className={bnFont}>{t('common.loading')}</span>
          </div>
        ) : updates.length === 0 ? (
          <p className={`text-sm text-gray-500 text-center py-8 ${bnFont}`}>
            {t('legalUpdateManage.noUpdates')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="py-2 pr-4">{t('legalUpdateManage.colTitle')}</th>
                  <th className="py-2 pr-4">{t('legalUpdateManage.colCategory')}</th>
                  <th className="py-2 pr-4">{t('legalUpdateManage.colStatus')}</th>
                  <th className="py-2 pr-4">{t('legalUpdateManage.colUpdated')}</th>
                  <th className="py-2 pr-4 text-right">{t('legalUpdateManage.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {updates.map((u) => (
                  <tr key={u.id} className={busyId === u.id ? 'opacity-50' : ''}>
                    <td className="py-3 pr-4">
                      <p className={`font-medium text-gray-900 ${bnFont}`}>{titleOf(u)}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{catLabel(u.category)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${statusStyle(u.status)} ${bnFont}`}>
                        {statusLabel(u.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {u.updated_at ? new Date(u.updated_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB') : '-'}
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(u)}
                        className="btn-secondary text-xs px-3 py-1 inline-flex items-center gap-1 mr-2"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={busyId === u.id}
                        className="btn-secondary text-xs px-3 py-1 inline-flex items-center gap-1 text-red-700 border-red-200 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('legalUpdateManage.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
