import api from '../utils/api';
import authService from './authService';

export interface LandSearchRequest {
  district: string;
  upazila: string;
  mouza: string;
  survey_type: string;
  khatian_no: string;
  dag_no: string;
}

export interface Owner {
  id: number;
  name_en: string;
  name_bn?: string;
  father_name?: string;
}

export interface Ownership {
  owner: Owner;
  share_decimal: number;
  share_percentage?: number;
  ownership_type: string;
  acquisition_date?: string;
  status: string;
}

export interface LandParcel {
  id: number;
  parcel_id: string;
  area_decimal: number;
  area_sqm?: number;
  centroid_lat?: number;
  centroid_lon?: number;
  status: string;
  district: string;
  upazila: string;
  mouza: string;
  survey_type: string;
  khatian_no: string;
  dag_no: string;
  land_class?: string;
}

export interface LandParcelDetail {
  parcel: LandParcel;
  ownership: Ownership[];
  geometry?: any; // GeoJSON
}

export interface HistoricalRecord {
  id: number;
  record_date: string;
  record_type: string;
  previous_owner?: string;
  new_owner?: string;
  transaction_type?: string;
  area_decimal?: number;
  deed_no?: string;
  description?: string;
}

export interface MutationRecord {
  id: number;
  mutation_no?: string;
  application_date?: string;
  approval_date?: string;
  status: string;
  previous_owner?: string;
  new_owner?: string;
  area_decimal?: number;
  mutation_type?: string;
}

export interface CaseRecord {
  id: number;
  case_no?: string;
  case_type: string;
  court_name?: string;
  filing_date?: string;
  status: string;
  plaintiff?: string;
  defendant?: string;
  case_summary?: string;
}

export interface GovernmentStatus {
  id: number;
  status_type: string;
  authority?: string;
  designation_date?: string;
  area_decimal?: number;
  restrictions?: string;
  is_active: boolean;
}

export interface AcquisitionRecord {
  id: number;
  acquisition_no?: string;
  acquiring_authority: string;
  purpose?: string;
  notification_date?: string;
  acquisition_date?: string;
  status: string;
  area_decimal?: number;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  transaction_date: string;
  transaction_type: string;
  seller_name?: string;
  buyer_name?: string;
  area_decimal: number;
  sale_value?: number;
  deed_no?: string;
}

export interface ChouhaddiBoundaries {
  north?: string | null;
  south?: string | null;
  east?: string | null;
  west?: string | null;
}

export interface ChouhaddiInfo {
  parcel_id: string;
  district: string;
  upazila: string;
  mouza: string;
  survey_type: string;
  khatian_no: string;
  dag_no: string;
  area_decimal: number;
  chouhaddi: ChouhaddiBoundaries;
  source: string;
  note?: string | null;
}

export interface InheritanceReview {
  parcel_id: string;
  ownership_type?: string | null;
  acquisition_mode?: string | null;
  succession_record_available?: boolean | null;
  declared_heir_count?: number | null;
  recorded_inherited_share?: number | null;
  recorded_owner_share?: number | null;
  total_area_decimal?: number | null;
  expected_share_decimal?: number | null;
  seller_recorded_share?: number | null;
  succession_status?: string | null;
  supporting_record_reference?: string | null;
  result: string;
  result_label_en: string;
  result_label_bn: string;
  reason_en: string;
  reason_bn: string;
  is_legal_conclusion: boolean;
  source: string;
}

// ---------------------------------------------------------------------------
// Demo-mode helpers — returned only when authService.isDemoMode() is true.
// Mirrors the LandParcelDetail / ChouhaddiInfo / InheritanceReview shapes so
// LandSearchPage, ChouhaddiCard, InheritanceReviewCard all render cleanly.
// ---------------------------------------------------------------------------

/** Build a mock GeoJSON square polygon centred on Savar, Dhaka. */
function buildDemoGeometry(dagNo: string): any {
  // Small offset per dag so adjacent parcels don't stack exactly
  const offset = (parseInt(dagNo, 10) - 120) * 0.001;
  const baseLat = 23.8583 + offset;
  const baseLon = 90.2667 + offset;
  const d = 0.003; // ~330m square
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [baseLon,     baseLat    ],
        [baseLon + d, baseLat    ],
        [baseLon + d, baseLat + d],
        [baseLon,     baseLat + d],
        [baseLon,     baseLat    ],
      ]],
    },
    properties: {},
  };
}

function buildDemoParcelDetail(req: LandSearchRequest): LandParcelDetail {
  const parcelIndex = parseInt(req.dag_no, 10) - 120;
  const parcelId = `BT-PARCEL-${String(Math.max(parcelIndex, 1)).padStart(6, '0')}`;
  const area = 25 + (parcelIndex % 10) * 5;
  return {
    parcel: {
      id: parcelIndex,
      parcel_id: parcelId,
      area_decimal: area,
      area_sqm: area * 436,
      centroid_lat: 23.8583,
      centroid_lon: 90.2667,
      status: 'active',
      district: req.district,
      upazila: req.upazila,
      mouza: req.mouza,
      survey_type: req.survey_type,
      khatian_no: req.khatian_no,
      dag_no: req.dag_no,
      land_class: 'Agricultural',
    },
    ownership: [
      {
        owner: {
          id: 1,
          name_en: 'Md. Karim Ahmed',
          name_bn: 'মো. করিম আহমেদ',
          father_name: 'Md. Rahim Ahmed',
        },
        share_decimal: area,
        share_percentage: 100,
        ownership_type: 'individual',
        status: 'active',
      },
    ],
    geometry: buildDemoGeometry(req.dag_no),
  };
}

class LandService {
  /**
   * Search for a parcel by location identifiers.
   * In Demo Mode (no live backend), returns a synthetic parcel matching the
   * search request so LandSearchPage displays results without errors.
   */
  async searchLand(data: LandSearchRequest): Promise<LandParcelDetail> {
    if (authService.isDemoMode()) {
      return buildDemoParcelDetail(data);
    }
    const response = await api.post('/land/search', data);
    return response.data;
  }

  /**
   * Fetch a parcel by its parcel_id.
   * In Demo Mode, returns a generic mock parcel so callers (e.g. map) don't error.
   */
  async getLandParcel(parcelId: string): Promise<LandParcelDetail> {
    if (authService.isDemoMode()) {
      const dagNo = String(120 + (parseInt(parcelId.slice(-6), 10) || 1));
      return buildDemoParcelDetail({
        district: 'Dhaka', upazila: 'Savar', mouza: 'Demo Mouza',
        survey_type: 'RS', khatian_no: '342', dag_no: dagNo,
      });
    }
    const response = await api.get(`/land/${parcelId}`);
    return response.data;
  }

  /**
   * Fetch GeoJSON geometry for a parcel.
   * In Demo Mode, returns a synthetic square polygon centred on Savar.
   */
  async getGeometry(parcelId: string): Promise<any> {
    if (authService.isDemoMode()) {
      const dagNo = String(120 + (parseInt(parcelId.slice(-6), 10) || 1));
      return buildDemoGeometry(dagNo);
    }
    const response = await api.get(`/land/${parcelId}/geometry`);
    return response.data;
  }

  async getOwnership(parcelId: string): Promise<Ownership[]> {
    const response = await api.get(`/land/${parcelId}/ownership`);
    return response.data;
  }

  async getHistory(parcelId: string): Promise<HistoricalRecord[]> {
    const response = await api.get(`/land/${parcelId}/history`);
    return response.data;
  }

  async getMutation(parcelId: string): Promise<MutationRecord[]> {
    const response = await api.get(`/land/${parcelId}/mutation`);
    return response.data;
  }

  async getCases(parcelId: string): Promise<CaseRecord[]> {
    const response = await api.get(`/land/${parcelId}/cases`);
    return response.data;
  }

  async getGovernmentStatus(parcelId: string): Promise<GovernmentStatus[]> {
    const response = await api.get(`/land/${parcelId}/government-status`);
    return response.data;
  }

  async getAcquisition(parcelId: string): Promise<AcquisitionRecord[]> {
    const response = await api.get(`/land/${parcelId}/acquisition`);
    return response.data;
  }

  async getTransactions(parcelId: string): Promise<Transaction[]> {
    const response = await api.get(`/land/${parcelId}/transactions`);
    return response.data;
  }

  /**
   * Chouhaddi (four-side boundary) information — synthetic demonstration data.
   * In Demo Mode, returns a synthetic chouhaddi so ChouhaddiCard renders cleanly.
   */
  async getChouhaddi(parcelId: string): Promise<ChouhaddiInfo> {
    if (authService.isDemoMode()) {
      const dagNo = String(120 + (parseInt(parcelId.slice(-6), 10) || 1));
      return {
        parcel_id: parcelId,
        district: 'Dhaka',
        upazila: 'Savar',
        mouza: 'Demo Mouza',
        survey_type: 'RS',
        khatian_no: '342',
        dag_no: dagNo,
        area_decimal: 30,
        chouhaddi: {
          north: 'Dag ' + String(parseInt(dagNo, 10) - 1),
          south: 'Dag ' + String(parseInt(dagNo, 10) + 1),
          east: 'Road / Rasta',
          west: 'Canal / Khal',
        },
        source: 'SYNTHETIC DEMONSTRATION DATA',
        note: 'Not an official cadastral boundary determination.',
      };
    }
    const response = await api.get(`/land/${parcelId}/chouhaddi`);
    return response.data;
  }

  /**
   * Inheritance / heirship (land-ownership consistency) review.
   * In Demo Mode, returns a synthetic "no inconsistency" result so
   * InheritanceReviewCard renders cleanly.
   */
  async getInheritanceReview(parcelId: string): Promise<InheritanceReview> {
    if (authService.isDemoMode()) {
      return {
        parcel_id: parcelId,
        ownership_type: 'individual',
        acquisition_mode: 'purchase',
        succession_record_available: true,
        declared_heir_count: 0,
        recorded_inherited_share: null,
        recorded_owner_share: 30,
        total_area_decimal: 30,
        expected_share_decimal: 30,
        seller_recorded_share: 30,
        succession_status: 'N/A',
        supporting_record_reference: null,
        result: 'no_matching_inconsistency',
        result_label_en: 'No Inheritance Inconsistency Found',
        result_label_bn: 'কোন উত্তরাধিকার অসঙ্গতি পাওয়া যায়নি',
        reason_en: 'The ownership records appear consistent with no inheritance share discrepancy.',
        reason_bn: 'মালিকানার রেকর্ড সামঞ্জস্যপূর্ণ এবং কোন উত্তরাধিকার শেয়ারের অসঙ্গতি নেই।',
        is_legal_conclusion: false,
        source: 'SYNTHETIC DEMONSTRATION DATA',
      };
    }
    const response = await api.get(`/land/${parcelId}/inheritance`);
    return response.data;
  }
}

export default new LandService();
