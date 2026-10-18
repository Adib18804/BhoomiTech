import api from '../utils/api';

export interface Division {
  id: number;
  name_en: string;
  name_bn: string;
  code: string;
}

export interface District {
  id: number;
  division_id?: number | null;
  name_en: string;
  name_bn: string;
  code: string;
}

export interface Upazila {
  id: number;
  district_id: number;
  name_en: string;
  name_bn: string;
  code: string;
}

export interface Mouza {
  id: number;
  upazila_id: number;
  name_en: string;
  name_bn: string;
  jl_no?: string;
  code: string;
}

class LocationService {
  async getDivisions(): Promise<Division[]> {
    const response = await api.get('/locations/divisions');
    return response.data;
  }

  async getDistricts(divisionId?: number): Promise<District[]> {
    const url = divisionId
      ? `/locations/districts?division_id=${divisionId}`
      : '/locations/districts';
    const response = await api.get(url);
    return response.data;
  }

  async getUpazilas(districtId?: number): Promise<Upazila[]> {
    const url = districtId ? `/locations/upazilas?district_id=${districtId}` : '/locations/upazilas';
    const response = await api.get(url);
    return response.data;
  }

  async getMouzas(upazilaId?: number): Promise<Mouza[]> {
    const url = upazilaId ? `/locations/mouzas?upazila_id=${upazilaId}` : '/locations/mouzas';
    const response = await api.get(url);
    return response.data;
  }
}

export default new LocationService();
