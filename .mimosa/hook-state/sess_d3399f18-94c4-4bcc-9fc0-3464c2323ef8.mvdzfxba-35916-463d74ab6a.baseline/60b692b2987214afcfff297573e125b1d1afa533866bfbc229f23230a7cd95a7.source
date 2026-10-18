import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowLeft } from 'lucide-react';
import { LandParcelDetail } from '../../services/landService';

export default function SellerInformationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [landData, setLandData] = useState<LandParcelDetail | null>(null);
  const [formData, setFormData] = useState({
    claimed_owner_name: '',
    claimed_share_decimal: '',
    claimed_sale_area_decimal: '',
  });

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';

  useEffect(() => {
    // Retrieve land data from session
    const stored = sessionStorage.getItem('selectedLand');
    if (!stored) {
      navigate('/land-search');
      return;
    }
    const data = JSON.parse(stored);
    setLandData(data);

    // Demo / Development Mode: pre-fill the scenario's seller claim
    const demoClaim = sessionStorage.getItem('demoClaim');
    if (demoClaim) {
      const claim = JSON.parse(demoClaim);
      setFormData({
        claimed_owner_name: claim.claimed_owner_name ?? '',
        claimed_share_decimal: claim.claimed_share_decimal?.toString() ?? '',
        claimed_sale_area_decimal: claim.claimed_sale_area_decimal?.toString() ?? '',
      });
      return;
    }

    // Pre-fill with recorded data if available
    if (data.ownership && data.ownership.length > 0) {
      setFormData({
        claimed_owner_name: data.ownership[0].owner.name_en,
        claimed_share_decimal: data.ownership[0].share_decimal.toString(),
        claimed_sale_area_decimal: data.parcel.area_decimal.toString(),
      });
    }
  }, [navigate]);

  const isDemoFlow = !!sessionStorage.getItem('demoClaim');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store seller claim; the demo claim pre-fill is consumed
    sessionStorage.setItem('sellerClaim', JSON.stringify(formData));
    sessionStorage.removeItem('demoClaim');
    navigate('/verification/result');
  };

  if (!landData) {
    return <div className="max-w-7xl mx-auto px-4 py-8">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/land-search')}
        className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('sellerInfo.backToSearch')}
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="w-8 h-8 text-primary-600 mr-3" />
          <span className={bnFont}>{t('verification.steps.sellerInfo')}</span>
        </h1>
        <p className={`text-gray-600 mt-2 ${bnFont}`}>
          {t('sellerInfo.subtitle')}
        </p>
        {isDemoFlow && (
          <p className={`inline-block mt-3 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded-full px-3 py-1 ${bnFont}`}>
            {t('demoMode.prefillBadge')}
          </p>
        )}
      </div>

      {/* Land Summary */}
      <div className="card p-6 mb-6">
        <h2 className={`text-lg font-semibold mb-3 ${bnFont}`}>{t('sellerInfo.selectedParcel')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-600">{t('verification.landIdentifiers.district')}:</span>
            <p className="font-medium">{landData.parcel.district}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('verification.landIdentifiers.upazila')}:</span>
            <p className="font-medium">{landData.parcel.upazila}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('verification.landIdentifiers.mouza')}:</span>
            <p className="font-medium">{landData.parcel.mouza}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('verification.landIdentifiers.surveyType')}:</span>
            <p className="font-medium">{landData.parcel.survey_type}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('verification.landIdentifiers.khatian')}:</span>
            <p className="font-medium">{landData.parcel.khatian_no}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('verification.landIdentifiers.dag')}:</span>
            <p className="font-medium">{landData.parcel.dag_no}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('sellerInfo.totalArea')}:</span>
            <p className="font-medium">{landData.parcel.area_decimal} {t('landSearch.decimal')}</p>
          </div>
          <div>
            <span className="text-gray-600">{t('map.parcelId')}:</span>
            <p className="font-medium text-xs break-all">{landData.parcel.parcel_id}</p>
          </div>
        </div>
      </div>

      {/* Recorded Ownership Reference */}
      {landData.ownership && landData.ownership.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className={`text-sm font-semibold text-blue-900 mb-2 ${bnFont}`}>
            {t('sellerInfo.recordedOwnership')}
          </h3>
          {landData.ownership.map((ownership, idx) => (
            <div key={idx} className={`text-sm text-blue-800 ${bnFont}`}>
              <p>
                <strong>{t('sellerInfo.owner')}:</strong> {ownership.owner.name_en}
              </p>
              <p>
                <strong>{t('landSearch.share')}:</strong> {ownership.share_decimal} {t('landSearch.decimal')} ({ownership.share_percentage}%)
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Seller Claim Form */}
      <div className="card p-6">
        <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('sellerInfo.formTitle')}</h2>
        <p className={`text-sm text-gray-600 mb-4 ${bnFont}`}>
          {t('sellerInfo.formSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('sellerInfo.ownerName')} *</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.claimed_owner_name}
              onChange={(e) =>
                setFormData({ ...formData, claimed_owner_name: e.target.value })
              }
              placeholder={t('sellerInfo.ownerNamePlaceholder')}
            />
            <p className={`text-xs text-gray-500 mt-1 ${bnFont}`}>
              {t('sellerInfo.ownerNameHelp')}
            </p>
          </div>

          <div>
            <label className="label">{t('sellerInfo.claimedShare')} *</label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              className="input-field"
              value={formData.claimed_share_decimal}
              onChange={(e) =>
                setFormData({ ...formData, claimed_share_decimal: e.target.value })
              }
              placeholder={t('sellerInfo.sharePlaceholder')}
            />
            <p className={`text-xs text-gray-500 mt-1 ${bnFont}`}>
              {t('sellerInfo.shareHelp')}
            </p>
          </div>

          <div>
            <label className="label">{t('sellerInfo.transactionArea')} *</label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              max={landData.parcel.area_decimal}
              className="input-field"
              value={formData.claimed_sale_area_decimal}
              onChange={(e) =>
                setFormData({ ...formData, claimed_sale_area_decimal: e.target.value })
              }
              placeholder={t('sellerInfo.areaPlaceholder')}
            />
            <p className={`text-xs text-gray-500 mt-1 ${bnFont}`}>
              {t('sellerInfo.areaHelp')} ({landData.parcel.area_decimal} {t('landSearch.decimal')})
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className={`text-sm text-yellow-800 ${bnFont}`}>
              <strong>{t('sellerInfo.important')}:</strong> {t('sellerInfo.importantText')}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/land-search')}
              className="btn-secondary"
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('verification.runVerification')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
