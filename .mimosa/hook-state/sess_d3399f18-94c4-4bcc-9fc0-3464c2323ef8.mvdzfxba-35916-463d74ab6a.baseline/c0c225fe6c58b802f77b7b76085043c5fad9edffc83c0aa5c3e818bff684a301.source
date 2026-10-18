import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import contentService, { LegalUpdate } from '../../services/contentService';

interface Props {
  limit?: number;
}

/** Tracks the user's reduced-motion preference so the marquee can be disabled. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

/**
 * Public-service announcement strip shown directly below the navbar.
 * Content is administrator-managed and always references an official source.
 */
export default function LegalUpdateTicker({ limit = 3 }: Props) {
  const { t, i18n } = useTranslation();
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';
  const pick = (en?: string | null, bn?: string | null) => (isBn && bn ? bn : en || '');

  useEffect(() => {
    let active = true;
    contentService.listPublished(undefined, limit)
      .then((data) => { if (active) setUpdates(data); })
      .catch(() => { if (active) setUpdates([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [limit]);

  // Slower strip for more content, so every headline stays readable.
  const duration = Math.max(22, updates.length * 9);

  const sourceLink = (u: LegalUpdate, duplicate: boolean) =>
    u.official_source_url ? (
      <a
        href={u.official_source_url}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={duplicate ? -1 : 0}
        aria-label={`${t('legalUpdatesPage.officialSource')}: ${u.official_source_name || u.official_source_url} (official external resource, opens in a new tab)`}
        className="inline-flex items-center ml-2 text-primary-600 hover:text-primary-700"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    ) : null;

  const runItem = (u: LegalUpdate, duplicate: boolean) => (
    <span key={`${u.id}-${duplicate ? 'b' : 'a'}`} className="inline-flex items-center">
      <span className={`text-sm text-gray-800 ${bnFont}`}>{pick(u.title_en, u.title_bn)}</span>
      {sourceLink(u, duplicate)}
      <span className="mx-3 sm:mx-4 text-primary-400 select-none" aria-hidden="true">•</span>
    </span>
  );

  return (
    <div className="border-y border-gray-200 bg-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 py-2">
          {/* Label */}
          <div className="flex items-center gap-1.5 flex-shrink-0 bg-primary-700 text-white rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-300" aria-hidden="true" />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${bnFont}`}>
              {t('ticker.newsLabel')}
            </span>
          </div>

          {/* Announcement area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                <span className={`truncate ${bnFont}`}>{t('ticker.loading')}</span>
              </div>
            ) : updates.length === 0 ? (
              <p className={`text-sm text-gray-600 truncate ${bnFont}`}>{t('ticker.empty')}</p>
            ) : reducedMotion ? (
              /* Reduced motion: the announcements are shown as a static, wrapped list. */
              <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
                {updates.map((u) => (
                  <li key={u.id} className="flex items-start text-sm">
                    <span className="inline-block mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 mr-2 flex-shrink-0" />
                    <span className={`min-w-0 break-words text-gray-800 ${bnFont}`}>
                      {pick(u.title_en, u.title_bn)}
                      {sourceLink(u, false)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bt-ticker-viewport overflow-hidden" role="region" aria-label={t('ticker.title')}>
                <div
                  className="bt-ticker-track"
                  style={{ '--bt-ticker-duration': `${duration}s` } as CSSProperties}
                >
                  {/* Second copy makes the loop seamless; it is hidden from assistive tech. */}
                  <span className="inline-flex items-center">
                    {updates.map((u) => runItem(u, false))}
                  </span>
                  <span className="inline-flex items-center" aria-hidden="true">
                    {updates.map((u) => runItem(u, true))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* View all */}
          <Link
            to="/legal-updates"
            className={`flex-shrink-0 inline-flex items-center text-xs sm:text-sm font-medium text-primary-700 hover:text-primary-800 whitespace-nowrap ${bnFont}`}
          >
            {t('ticker.viewAll')}
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
