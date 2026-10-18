import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Users, AlertCircle, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import landService, { InheritanceReview } from '../../services/landService';

interface InheritanceReviewCardProps {
  parcelId: string;
}

/**
 * Inheritance / heirship review — a land-ownership consistency check based on
 * available synthetic records. Not a legal conclusion.
 */
export default function InheritanceReviewCard({ parcelId }: InheritanceReviewCardProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const [data, setData] = useState<InheritanceReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    landService
      .getInheritanceReview(parcelId)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {
        if (mounted) setError(t('common.error'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [parcelId, t]);

  const resultStyles = (result: string) => {
    switch (result) {
      case 'potential_inheritance_share_inconsistency':
        return {
          box: 'bg-amber-50 border-amber-300',
          text: 'text-amber-900',
          Icon: AlertTriangle,
          iconColor: 'text-amber-600',
        };
      case 'no_matching_inconsistency':
        return {
          box: 'bg-green-50 border-green-300',
          text: 'text-green-900',
          Icon: CheckCircle,
          iconColor: 'text-green-600',
        };
      default:
        return {
          box: 'bg-gray-50 border-gray-300',
          text: 'text-gray-800',
          Icon: HelpCircle,
          iconColor: 'text-gray-500',
        };
    }
  };

  const row = (labelKey: string, value: string | number | null | undefined) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className={`text-sm text-gray-600 ${bnFont}`}>{t(`inheritance.${labelKey}`)}</span>
      <span className={`text-sm font-medium text-gray-900 break-words sm:text-right ${bnFont}`}>
        {value === null || value === undefined || value === '' ? t('landSearch.notAvailable') : value}
      </span>
    </div>
  );

  return (
    <div className="card p-6">
      <h2 className={`text-xl font-semibold mb-1 flex items-center ${bnFont}`}>
        <Users className="w-6 h-6 text-primary-600 mr-2" />
        {t('inheritance.title')}
      </h2>
      <p className={`text-sm text-gray-600 mb-4 ${bnFont}`}>{t('inheritance.subtitle')}</p>

      {loading && (
        <div className="flex items-center text-sm text-gray-600 py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className={bnFont}>{t('common.loading')}</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center text-sm text-red-700 py-2">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className={bnFont}>{error}</span>
        </div>
      )}

      {data && !loading && (
        <>
          {(() => {
            const style = resultStyles(data.result);
            const { Icon } = style;
            const label = isBn ? data.result_label_bn : data.result_label_en;
            const reason = isBn ? data.reason_bn : data.reason_en;
            return (
              <div className={`border rounded-md p-4 mb-4 ${style.box}`}>
                <div className="flex items-start">
                  <Icon className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                  <div>
                    <p className={`font-semibold ${style.text} ${bnFont}`}>{label}</p>
                    <p className={`text-sm mt-1 ${style.text} ${bnFont}`}>{reason}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              {row('ownershipType', data.ownership_type)}
              {row(
                'successionRecord',
                data.succession_record_available === null || data.succession_record_available === undefined
                  ? null
                  : data.succession_record_available
                    ? t('inheritance.yes')
                    : t('inheritance.no')
              )}
              {row('declaredHeirCount', data.declared_heir_count)}
              {row('recordedInheritedShare', data.recorded_inherited_share)}
            </div>
            <div>
              {row('recordedOwnerShare', data.recorded_owner_share)}
              {row('expectedShare', data.expected_share_decimal)}
              {row('successionStatus', data.succession_status)}
              {row('recordReference', data.supporting_record_reference)}
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start">
            <AlertCircle className="w-4 h-4 text-blue-700 mr-2 mt-0.5 flex-shrink-0" />
            <p className={`text-xs text-blue-900 ${bnFont}`}>{t('inheritance.notLegalAdvice')}</p>
          </div>
        </>
      )}
    </div>
  );
}
