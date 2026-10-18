import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import locationService, { Division, District, Upazila, Mouza } from '../../services/locationService';

interface LandSearchFormProps {
  onSearch: (data: {
    district: string;
    upazila: string;
    mouza: string;
    survey_type: string;
    khatian_no: string;
    dag_no: string;
  }) => void;
  loading?: boolean;
}

export default function LandSearchForm({ onSearch, loading }: LandSearchFormProps) {
  const { t, i18n } = useTranslation();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [mouzas, setMouzas] = useState<Mouza[]>([]);

  const [formData, setFormData] = useState({
    district: '',
    upazila: '',
    mouza: '',
    survey_type: 'RS',
    khatian_no: '',
    dag_no: '',
  });

  const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | null>(null);

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      const data = await locationService.getDivisions();
      setDivisions(data);
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  };

  const handleDivisionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const division = divisions.find((d) => d.name_en === value);

    setFormData({ ...formData, district: '', upazila: '', mouza: '' });
    setSelectedDivisionId(division?.id || null);
    setSelectedDistrictId(null);
    setSelectedUpazilaId(null);
    setDistricts([]);
    setUpazilas([]);
    setMouzas([]);

    if (division) {
      try {
        const data = await locationService.getDistricts(division.id);
        setDistricts(data);
      } catch (error) {
        console.error('Error loading districts:', error);
      }
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const district = districts.find((d) => d.name_en === value);

    setFormData({ ...formData, district: value, upazila: '', mouza: '' });
    setSelectedDistrictId(district?.id || null);
    setSelectedUpazilaId(null);
    setUpazilas([]);
    setMouzas([]);

    if (district) {
      try {
        const data = await locationService.getUpazilas(district.id);
        setUpazilas(data);
      } catch (error) {
        console.error('Error loading upazilas:', error);
      }
    }
  };

  const handleUpazilaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const upazila = upazilas.find((u) => u.name_en === value);

    setFormData({ ...formData, upazila: value, mouza: '' });
    setSelectedUpazilaId(upazila?.id || null);
    setMouzas([]);

    if (upazila) {
      try {
        const data = await locationService.getMouzas(upazila.id);
        setMouzas(data);
      } catch (error) {
        console.error('Error loading mouzas:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Division */}
        <div>
          <label className="label">{t('verification.landIdentifiers.division')}</label>
          <select
            required
            className="input-field"
            value={selectedDivisionId
              ? divisions.find((d) => d.id === selectedDivisionId)?.name_en || ''
              : ''}
            onChange={handleDivisionChange}
          >
            <option value="">{t('landSearch.selectDivision')}</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.name_en}>
                {i18n.language === 'bn' ? d.name_bn : d.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="label">{t('verification.landIdentifiers.district')}</label>
          <select
            required
            className="input-field"
            value={formData.district}
            onChange={handleDistrictChange}
            disabled={!selectedDivisionId}
          >
            <option value="">{t('landSearch.selectDistrict')}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.name_en}>
                {i18n.language === 'bn' ? d.name_bn : d.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Upazila */}
        <div>
          <label className="label">{t('verification.landIdentifiers.upazila')}</label>
          <select
            required
            className="input-field"
            value={formData.upazila}
            onChange={handleUpazilaChange}
            disabled={!selectedDistrictId}
          >
            <option value="">{t('landSearch.selectUpazila')}</option>
            {upazilas.map((u) => (
              <option key={u.id} value={u.name_en}>
                {i18n.language === 'bn' ? u.name_bn : u.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Mouza */}
        <div>
          <label className="label">{t('verification.landIdentifiers.mouza')}</label>
          <select
            required
            className="input-field"
            value={formData.mouza}
            onChange={(e) => setFormData({ ...formData, mouza: e.target.value })}
            disabled={!selectedUpazilaId}
          >
            <option value="">{t('landSearch.selectMouza')}</option>
            {mouzas.map((m) => (
              <option key={m.id} value={m.name_en}>
                {i18n.language === 'bn' ? m.name_bn : m.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Survey Type */}
        <div>
          <label className="label">{t('verification.landIdentifiers.surveyType')}</label>
          <select
            required
            className="input-field"
            value={formData.survey_type}
            onChange={(e) => setFormData({ ...formData, survey_type: e.target.value })}
          >
            <option value="RS">RS (Revisional Survey)</option>
            <option value="SA">SA (State Acquisition)</option>
            <option value="BS">BS (Bangladesh Survey)</option>
            <option value="CS">CS (Cadastral Survey)</option>
          </select>
        </div>

        {/* Khatian No */}
        <div>
          <label className="label">{t('verification.landIdentifiers.khatian')}</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.khatian_no}
            onChange={(e) => setFormData({ ...formData, khatian_no: e.target.value })}
            placeholder="e.g., 342"
          />
        </div>

        {/* Dag No */}
        <div>
          <label className="label">{t('verification.landIdentifiers.dag')}</label>
          <input
            type="text"
            required
            className="input-field"
            value={formData.dag_no}
            onChange={(e) => setFormData({ ...formData, dag_no: e.target.value })}
            placeholder="e.g., 121"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary flex items-center justify-center space-x-2"
      >
        <Search className="w-5 h-5" />
        <span>{loading ? t('common.loading') : t('verification.findPlot')}</span>
      </button>
    </form>
  );
}
