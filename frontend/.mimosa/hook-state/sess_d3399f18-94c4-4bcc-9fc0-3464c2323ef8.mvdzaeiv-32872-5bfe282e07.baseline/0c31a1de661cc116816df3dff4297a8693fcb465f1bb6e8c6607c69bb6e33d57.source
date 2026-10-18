import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Compass, AlertCircle } from 'lucide-react';
import landService, { ChouhaddiInfo } from '../../services/landService';

interface ChouhaddiCardProps {
  parcelId: string;
}

/**
 * Chouhaddi (four-side boundary) card for a parcel.
 * Values come from synthetic demonstration data only and are not a legal
 * cadastral boundary determination.
 */
export default function ChouhaddiCard({ parcelId }: ChouhaddiCardProps) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  const [data, setData] = useState<ChouhaddiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    landService
      .getChouhaddi(parcelId)
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

  const value = (v?: string | null) => (v && v.trim() ? v : t('chouhaddi.notRecorded'));

  return (
    <div className="card p-6">
      <h2 className={`text-xl font-semibold mb-4 flex items-center ${bnFont}`}>
        <Compass className="w-6 h-6 text-primary-600 mr-2" />
        {t('chouhaddi.title')}
      </h2>

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
          {/* Visual four-side boundary grid */}
          <div className="grid grid-cols-3 gap-2 max-w-xl mx-auto my-2">
            <div />
            <div className="min-w-0 border-2 border-primary-300 bg-primary-50 rounded-md p-2 sm:p-3 text-center">
              <p className={`text-xs font-semibold text-primary-700 ${bnFont}`}>{t('chouhaddi.north')}</p>
              <p className={`text-sm text-gray-900 mt-1 break-words ${bnFont}`}>{value(data.chouhaddi.north)}</p>
            </div>
            <div />

            <div className="min-w-0 border-2 border-primary-300 bg-primary-50 rounded-md p-2 sm:p-3 text-center">
              <p className={`text-xs font-semibold text-primary-700 ${bnFont}`}>{t('chouhaddi.west')}</p>
              <p className={`text-sm text-gray-900 mt-1 break-words ${bnFont}`}>{value(data.chouhaddi.west)}</p>
            </div>
            <div className="min-w-0 border-2 border-dashed border-gray-300 rounded-md p-2 sm:p-3 text-center flex flex-col items-center justify-center bg-gray-50">
              <Compass className="w-6 h-6 text-gray-400" />
              <p className={`text-xs text-gray-500 mt-1 ${bnFont}`}>
                {t('verification.landIdentifiers.dag')} {data.dag_no}
              </p>
            </div>
            <div className="min-w-0 border-2 border-primary-300 bg-primary-50 rounded-md p-2 sm:p-3 text-center">
              <p className={`text-xs font-semibold text-primary-700 ${bnFont}`}>{t('chouhaddi.east')}</p>
              <p className={`text-sm text-gray-900 mt-1 break-words ${bnFont}`}>{value(data.chouhaddi.east)}</p>
            </div>

            <div />
            <div className="min-w-0 border-2 border-primary-300 bg-primary-50 rounded-md p-2 sm:p-3 text-center">
              <p className={`text-xs font-semibold text-primary-700 ${bnFont}`}>{t('chouhaddi.south')}</p>
              <p className={`text-sm text-gray-900 mt-1 break-words ${bnFont}`}>{value(data.chouhaddi.south)}</p>
            </div>
            <div />
          </div>

          <p className={`text-xs text-gray-500 mt-2 break-words ${bnFont}`}>
            {t('chouhaddi.source')}: {data.source}
          </p>

          <div className="mt-4 bg-amber-50 border border-amber-300 rounded-md p-3 flex items-start">
            <AlertCircle className="w-4 h-4 text-amber-700 mr-2 mt-0.5 flex-shrink-0" />
            <p className={`text-xs text-amber-900 ${bnFont}`}>{t('chouhaddi.note')}</p>
          </div>
        </>
      )}
    </div>
  );
}
