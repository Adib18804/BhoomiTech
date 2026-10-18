import api from '../utils/api';

export interface AdminJurisdiction {
  role: string;
  is_global: boolean;
  assigned_upazila: {
    id: number;
    name_en: string;
    name_bn: string | null;
    district_name: string | null;
  } | null;
}

export interface ScopedUpazila {
  id: number;
  name_en: string;
  name_bn: string | null;
  district_id: number;
  code: string | null;
}

export interface ScopedMouza {
  id: number;
  upazila_id: number;
  name_en: string;
  name_bn: string | null;
  jl_no: string | null;
  code: string | null;
}

export interface AdminStats {
  scope: { upazila_id: number | null; is_global: boolean };
  totals: {
    mouzas: number;
    khatian_records: number;
    dag_records: number;
    parcels: number;
    pending_updates: number;
    verification_cases: number;
  };
  risk_distribution: Record<string, number>;
}

export interface AdminParcel {
  parcel_id: string;
  khatian_no: string;
  survey_type: string;
  dag_no: string;
  area_decimal: number | null;
  land_class: string | null;
  chouhaddi: {
    north: string | null;
    south: string | null;
    east: string | null;
    west: string | null;
  };
}

export interface ChouhaddiUpdatePayload {
  north?: string | null;
  south?: string | null;
  east?: string | null;
  west?: string | null;
}

class AdminService {
  async getJurisdiction(): Promise<AdminJurisdiction> {
    const response = await api.get('/admin/jurisdiction');
    return response.data;
  }

  async getStats(upazilaId?: number): Promise<AdminStats> {
    const response = await api.get('/admin/stats', {
      params: upazilaId ? { upazila_id: upazilaId } : {},
    });
    return response.data;
  }

  async listUpazilas(): Promise<ScopedUpazila[]> {
    const response = await api.get('/admin/upazilas');
    return response.data;
  }

  async listMouzas(upazilaId?: number): Promise<ScopedMouza[]> {
    const response = await api.get('/admin/mouzas', {
      params: upazilaId ? { upazila_id: upazilaId } : {},
    });
    return response.data;
  }

  async listParcels(mouzaId: number): Promise<AdminParcel[]> {
    const response = await api.get('/admin/parcels', { params: { mouza_id: mouzaId } });
    return response.data;
  }

  async updateChouhaddi(parcelId: string, payload: ChouhaddiUpdatePayload): Promise<AdminParcel['chouhaddi']> {
    const response = await api.put(`/admin/parcels/${parcelId}/chouhaddi`, payload);
    return response.data.chouhaddi;
  }
}

export default new AdminService();
