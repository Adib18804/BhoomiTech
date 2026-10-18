import api from '../utils/api';

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

class LandService {
  async searchLand(data: LandSearchRequest): Promise<LandParcelDetail> {
    const response = await api.post('/land/search', data);
    return response.data;
  }

  async getLandParcel(parcelId: string): Promise<LandParcelDetail> {
    const response = await api.get(`/land/${parcelId}`);
    return response.data;
  }

  async getGeometry(parcelId: string): Promise<any> {
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

  /** Chouhaddi (four-side boundary) information — synthetic demonstration data. */
  async getChouhaddi(parcelId: string): Promise<ChouhaddiInfo> {
    const response = await api.get(`/land/${parcelId}/chouhaddi`);
    return response.data;
  }

  /** Inheritance / heirship (land-ownership consistency) review. */
  async getInheritanceReview(parcelId: string): Promise<InheritanceReview> {
    const response = await api.get(`/land/${parcelId}/inheritance`);
    return response.data;
  }
}

export default new LandService();
