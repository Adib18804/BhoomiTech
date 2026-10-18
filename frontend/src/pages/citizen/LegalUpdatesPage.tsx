import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Newspaper, AlertTriangle, ExternalLink, Loader2, RefreshCw, Calendar, ChevronDown, ChevronUp, Info } from 'lucide-react';
import contentService, { LegalUpdate } from '../../services/contentService';

const CATEGORIES = [
  'Mutation', 'Land Records', 'Land Map', 'Land Tax',
  'Acquisition', 'Registration', 'Land Administration', 'General Land Service',
];

export default function LegalUpdatesPage() {
  const { t, i18n } = useTranslation();
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';
  const pick = (en?: string | null, bn?: string | null) => (isBn && bn ? bn : en || '');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contentService.listPublished(category || undefined, 50);
      setUpdates(data);
    } catch {
      setError(t('legalUpdatesPage.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category]);

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', { dateStyle: 'medium' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start mb-6">
        <Newspaper className="w-10 h-10 text-primary-600 mr-4 flex-shrink-0 mt-0.5" />
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 ${bnFont}`}>{t('legalUpdatesPage.title')}</h1>
          <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('legalUpdatesPage.subtitle')}</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
        <label className={`text-sm font-medium text-gray-700 ${bnFont}`} htmlFor="legal-update-category">
          {t('legalUpdatesPage.filterByCategory')}:
        </label>
        <select
          id="legal-update-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">{t('legalUpdatesPage.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`legalUpdatesPage.categories.${c}`, c)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-10 h-10 text-primary-600 mx-auto mb-3 animate-spin" />
          <p className={`text-gray-600 ${bnFont}`}>{t('ticker.loading')}</p>
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
      ) : updates.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Newspaper className="w-14 h-14 mx-auto mb-4 text-gray-400" />
          <p className={bnFont}>{t('legalUpdatesPage.noUpdates')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((u) => {
            const isOpen = expanded === u.id;
            return (
              <article key={u.id} className="card p-6 border border-gray-200">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-xs font-semibold">
                    {t(`legalUpdatesPage.categories.${u.category}`, u.category)}
                  </span>
                  <span className={`text-xs text-gray-500 flex items-center ${bnFont}`}>
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {t('legalUpdatesPage.publishedOn')}: {fmtDate(u.publication_date)}
                  </span>
                  {u.effective_date && (
                    <span className={`text-xs text-gray-500 ${bnFont}`}>
                      · {t('legalUpdatesPage.effectiveOn')}: {fmtDate(u.effective_date)}
                    </span>
                  )}
                </div>

                <h2 className={`text-lg font-semibold text-gray-900 mb-2 ${bnFont}`}>
                  {pick(u.title_en, u.title_bn)}
                </h2>
                <p className={`text-sm text-gray-700 ${bnFont}`}>
                  {isOpen ? pick(u.summary_en, u.summary_bn) : `${pick(u.summary_en, u.summary_bn).slice(0, 180)}${pick(u.summary_en, u.summary_bn).length > 180 ? '…' : ''}`}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  {u.official_source_url ? (
                    <a
                      href={u.official_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('legalUpdatesPage.officialSource')}: ${u.official_source_name || u.official_source_url} (official external resource, opens in a new tab)`}
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      <span className={bnFont}>
                        {t('legalUpdatesPage.officialSource')}: {u.official_source_name || u.official_source_url}
                      </span>
                    </a>
                  ) : (
                    <span className={`text-sm text-gray-500 ${bnFont}`}>
                      {t('legalUpdatesPage.officialSource')}: {u.official_source_name || '-'}
                    </span>
                  )}
                  <button
                    onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="inline-flex items-center text-sm text-gray-700 hover:text-primary-600 font-medium"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    <span className={bnFont}>
                      {isOpen ? t('legalUpdatesPage.readLess') : t('legalUpdatesPage.readMore')}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-start bg-gray-50 border border-gray-200 rounded-md p-4">
        <Info className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
        <p className={`text-xs text-gray-600 ${bnFont}`}>{t('legalUpdatesPage.sourceNote')}</p>
      </div>
    </div>
  );
}
