import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, FileText, AlertCircle, FlaskConical, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import LandSearchForm from '../../components/land/LandSearchForm';
import ChouhaddiCard from '../../components/land/ChouhaddiCard';
import InheritanceReviewCard from '../../components/land/InheritanceReviewCard';
import PlotMap from '../../components/map/PlotMap';
import landService, { LandParcelDetail } from '../../services/landService';
import demoService, { DemoScenario } from '../../services/demoService';

export default function LandSearchPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [landData, setLandData] = useState<LandParcelDetail | null>(null);

  // Demo / Development Mode state
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoScenarios, setDemoScenarios] = useState<DemoScenario[]>([]);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [demoBusyId, setDemoBusyId] = useState<string | null>(null);

  const isBn = i18n.language === 'bn';
  const bnFont = i18n.language === 'bn' ? 'font-bengali' : '';
  const scenarioName = (s: DemoScenario) => (isBn && s.name_bn ? s.name_bn : s.name_en);

  const toggleDemoPanel = async () => {
    const next = !demoOpen;
    setDemoOpen(next);
    if (next && demoScenarios.length === 0 && !demoError) {
      setDemoLoading(true);
      try {
        const res = await demoService.listScenarios();
        setDemoScenarios(res.scenarios);
      } catch {
        setDemoError(t('demoMode.loadError'));
      } finally {
        setDemoLoading(false);
      }
    }
  };

  const handleDemoSelect = async (scenario: DemoScenario) => {
    setDemoBusyId(scenario.scenario_id);
    setError('');
    try {
      // Fetch the scenario's seller claim, then open the parcel exactly
      // like a normal search so the full workflow continues from here.
      const detail = await demoService.getScenario(scenario.scenario_id);
      const result = await landService.searchLand({
        district: scenario.district_name,
        upazila: scenario.upazila_name,
        mouza: scenario.mouza_name,
        survey_type: scenario.survey_type,
        khatian_no: scenario.khatian_no,
        dag_no: scenario.dag_no,
      });
      sessionStorage.setItem('demoClaim', JSON.stringify(detail.seller_claim));
      setLandData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('landSearch.notFound'));
    } finally {
      setDemoBusyId(null);
    }
  };

  const handleSearch = async (searchData: any) => {
    setLoading(true);
    setError('');
    setLandData(null);

    try {
      const result = await landService.searchLand(searchData);
      setLandData(result);
    } catch (err: any) {
      setError(
        err.response?.status === 404
          ? t('landSearch.emptyRecord')
          : err.response?.data?.detail || t('landSearch.notFound')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueVerification = () => {
    if (landData) {
      // Store land data in session storage for next step
      sessionStorage.setItem('selectedLand', JSON.stringify(landData));
      navigate('/verification/seller-info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <MapPin className="w-8 h-8 text-primary-600 mr-3" />
          {t('verification.title')}
        </h1>
        <p className={`text-gray-600 mt-2 ${bnFont}`}>
          {t('landSearch.subtitle')}
        </p>
      </div>

      {/* Search Form */}
      <div className="card p-6 mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('verification.steps.landIdentity')}</h2>
        <LandSearchForm onSearch={handleSearch} loading={loading} />
      </div>

      {/* Demo / Development Mode selector */}
      <div className="border-2 border-dashed border-amber-400 bg-amber-50 rounded-lg p-4 mb-8">
        <button
          onClick={toggleDemoPanel}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-start">
            <FlaskConical className="w-5 h-5 text-amber-700 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`font-semibold text-amber-900 ${bnFont}`}>
                {t('demoMode.title')}
              </p>
              <p className={`text-xs text-amber-800 mt-0.5 ${bnFont}`}>
                {t('demoMode.subtitle')}
              </p>
            </div>
          </div>
          {demoOpen
            ? <ChevronUp className="w-5 h-5 text-amber-700" />
            : <ChevronDown className="w-5 h-5 text-amber-700" />}
        </button>

        {demoOpen && (
          <div className="mt-4">
            {demoLoading && (
              <div className="flex items-center text-sm text-amber-800 py-2">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className={bnFont}>{t('common.loading')}</span>
              </div>
            )}
            {demoError && <p className={`text-sm text-red-700 ${bnFont}`}>{demoError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {demoScenarios.map((s) => (
                <button
                  key={s.scenario_id}
                  onClick={() => handleDemoSelect(s)}
                  disabled={demoBusyId !== null}
                  className="text-left bg-white border border-amber-300 rounded-md p-3 hover:border-amber-500 hover:shadow-sm transition disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                      {s.letter}
                    </span>
                    {demoBusyId === s.scenario_id && (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                    )}
                  </div>
                  <p className={`text-sm font-semibold text-gray-900 mt-1.5 ${bnFont}`}>
                    {scenarioName(s)}
                  </p>
                  <p className={`text-xs text-gray-600 mt-0.5 ${bnFont}`}>
                    {t('dashboard.khatian')} {s.khatian_no} · {t('dashboard.dag')} {s.dag_no}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className={`text-red-800 font-medium ${bnFont}`}>{t('landSearch.notFoundTitle')}</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {landData && (
        <div className="space-y-6">
          {/* Land Summary */}
          <div className="card p-6">
            <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('landSearch.parcelInfo')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('map.parcelId')}</p>
                <p className="font-semibold text-gray-900 break-all">{landData.parcel.parcel_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verification.landIdentifiers.district')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.district}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verification.landIdentifiers.upazila')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.upazila}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verification.landIdentifiers.mouza')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.mouza}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verification.landIdentifiers.surveyType')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.survey_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verification.landIdentifiers.khatian')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.khatian_no}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('verification.landIdentifiers.dag')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.dag_no}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('map.area')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.area_decimal} {t('landSearch.decimal')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('landSearch.landClass')}</p>
                <p className="font-semibold text-gray-900">{landData.parcel.land_class || t('landSearch.notAvailable')}</p>
              </div>
            </div>
          </div>

          {/* Ownership */}
          {landData.ownership && landData.ownership.length > 0 && (
            <div className="card p-6">
              <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('landSearch.recordedOwnership')}</h2>
              <div className="space-y-4">
                {landData.ownership.map((ownership, idx) => (
                  <div key={idx} className="border-l-4 border-primary-500 pl-4">
                    <p className="font-semibold text-gray-900">{ownership.owner.name_en}</p>
                    {ownership.owner.father_name && (
                      <p className="text-sm text-gray-600">{t('landSearch.father')}: {ownership.owner.father_name}</p>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{t('landSearch.share')}: </span>
                        <span className="font-medium">{ownership.share_decimal} {t('landSearch.decimal')} ({ownership.share_percentage}%)</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('landSearch.type')}: </span>
                        <span className="font-medium capitalize">{ownership.ownership_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chouhaddi (four-side boundaries) */}
          <ChouhaddiCard parcelId={landData.parcel.parcel_id} />

          {/* Inheritance / heirship review */}
          <InheritanceReviewCard parcelId={landData.parcel.parcel_id} />

          {/* Map */}
          {landData.geometry && (
            <div className="card p-6">
              <h2 className={`text-xl font-semibold mb-4 ${bnFont}`}>{t('map.title')}</h2>
              <PlotMap
                geometry={landData.geometry}
                parcelId={landData.parcel.parcel_id}
                dag={landData.parcel.dag_no}
                khatian={landData.parcel.khatian_no}
                area={landData.parcel.area_decimal}
                mouza={landData.parcel.mouza}
              />
            </div>
          )}

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleContinueVerification}
              className="btn-primary flex items-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span className={bnFont}>{t('landSearch.continueVerification')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
