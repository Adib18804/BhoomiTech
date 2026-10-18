import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, ListChecks } from 'lucide-react';
import type { VerificationFinding } from '../../services/verificationService';

interface FindingCardProps {
  finding: VerificationFinding;
}

const severityStyles = (severity: string, findingType: string) => {
  if (findingType === 'success') {
    return { box: 'bg-green-50 border-green-200', badge: 'bg-green-200 text-green-700', mark: '✓' };
  }
  switch (severity) {
    case 'critical':
      return { box: 'bg-red-50 border-red-200', badge: 'bg-red-200 text-red-700', mark: '×' };
    case 'high':
      return { box: 'bg-orange-50 border-orange-200', badge: 'bg-orange-200 text-orange-700', mark: '!' };
    case 'medium':
      return { box: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-200 text-yellow-700', mark: '⚠' };
    default:
      return { box: 'bg-green-50 border-green-200', badge: 'bg-green-200 text-green-700', mark: '✓' };
  }
};

/**
 * Expandable presentation of a single verification finding.
 * Presentation only — the verification logic and finding payload are unchanged.
 */
export default function FindingCard({ finding }: FindingCardProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const pick = (en?: string | null, bn?: string | null) => (isBn && bn ? bn : en || '');

  const [open, setOpen] = useState(false);

  const style = severityStyles(finding.severity, finding.finding_type);

  const title = pick(finding.title_en, finding.title_bn);
  const description = pick(finding.description_en, finding.description_bn);
  const explanation = pick(finding.explanation_en, finding.explanation_bn);
  const recommendation = pick(finding.recommendation_en, finding.recommendation_bn);

  const evidenceEntries = Object.entries(finding.related_data || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  const formatKey = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const hasDetails = Boolean(explanation || recommendation || evidenceEntries.length > 0);

  return (
    <div className={`rounded-md border ${style.box} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${style.badge}`}>
            {style.mark}
          </div>
          <div className="flex-grow">
            <h4 className={`font-semibold text-gray-900 ${bnFont}`}>{title}</h4>
            <p className={`text-sm text-gray-700 mt-1 ${bnFont}`}>{description}</p>
          </div>
        </div>
      </div>

      {hasDetails && (
        <>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-2 border-t border-black/5 bg-white/40 hover:bg-white/70 transition text-left ${bnFont}`}
            aria-expanded={open}
          >
            <span className="text-xs font-medium text-gray-700 flex items-center">
              <ListChecks className="w-4 h-4 mr-1.5" />
              {open ? t('verification.result.hideDetails') : t('verification.result.showDetails')}
            </span>
            {open ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
          </button>

          {open && (
            <div className="px-4 py-3 bg-white/70 border-t border-black/5 space-y-3">
              {explanation && (
                <div>
                  <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${bnFont}`}>
                    {t('verification.result.whyThisMatters')}
                  </p>
                  <p className={`text-sm text-gray-700 mt-1 ${bnFont}`}>{explanation}</p>
                </div>
              )}

              <div>
                <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${bnFont}`}>
                  {t('verification.result.evidence')}
                </p>
                {evidenceEntries.length > 0 ? (
                  <div className="mt-1 border border-gray-200 rounded-md overflow-hidden">
                    {evidenceEntries.map(([key, value], idx) => (
                      <div
                        key={key}
                        className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4 px-3 py-1.5 text-sm ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                      >
                        <span className={`text-gray-600 min-w-0 break-words ${bnFont}`}>{formatKey(key)}</span>
                        <span className="font-medium text-gray-900 sm:text-right break-words min-w-0">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm text-gray-500 mt-1 ${bnFont}`}>{t('verification.result.noDetails')}</p>
                )}
              </div>

              {recommendation && (
                <div className="p-3 bg-primary-50 rounded border border-primary-200">
                  <p className={`text-xs font-semibold text-primary-700 uppercase tracking-wide ${bnFont}`}>
                    {t('verification.result.whatToReview')}
                  </p>
                  <p className={`text-sm text-gray-800 mt-1 ${bnFont}`}>{recommendation}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
