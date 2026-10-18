import api from '../utils/api';

export interface ManagedUser {
  id: number;
  email: string;
  full_name: string;
  role: 'citizen' | 'admin' | 'super_admin' | string;
  is_active: boolean;
  is_verified: boolean;
  preferred_language: string;
  created_at: string;
  last_login_at: string | null;
  is_locked: boolean;
}

export interface ManagedUserList {
  totals: Record<string, number>;
  users: ManagedUser[];
}

export interface AuditLogEntry {
  id: number;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  action_description: string;
  actor_email: string | null;
  success: string | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string | null;
  value_type: string;
  category: string;
  description_en: string | null;
  description_bn: string | null;
  is_public: boolean;
  is_editable: boolean;
  updated_at: string | null;
}

export interface SystemStats {
  totals: {
    total_citizens: number;
    total_admins: number;
    total_super_admins: number;
    total_districts: number;
    total_upazilas: number;
    total_mouzas: number;
    total_khatians: number;
    total_dags: number;
    total_parcels: number;
    total_verification_cases: number;
    total_legal_updates: number;
    high_attention: number;
    critical_signals: number;
  };
  risk_distribution: Record<string, number>;
  cases_by_jurisdiction: { upazila: string; count: number }[];
  data_completeness: Record<string, number>;
  recent_activity: {
    action_type: string;
    action_description: string;
    success: string | null;
    created_at: string;
  }[];
}

export interface LocationDivision {
  id: number;
  name_en: string;
  name_bn: string | null;
  code: string | null;
}

export interface LocationDistrict {
  id: number;
  division_id: number | null;
  name_en: string;
  name_bn: string | null;
  code: string | null;
}

export interface LocationUpazila {
  id: number;
  district_id: number;
  name_en: string;
  name_bn: string | null;
  code: string | null;
}

export interface LocationMouza {
  id: number;
  upazila_id: number;
  name_en: string;
  name_bn: string | null;
  jl_no: string | null;
  code: string | null;
}

class SuperAdminService {
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get('/superadmin/stats');
    return response.data;
  }

  async listDivisions(): Promise<LocationDivision[]> {
    const response = await api.get('/superadmin/locations/divisions');
    return response.data;
  }

  async listDistricts(divisionId?: number): Promise<LocationDistrict[]> {
    const response = await api.get('/superadmin/locations/districts', {
      params: divisionId ? { division_id: divisionId } : {},
    });
    return response.data;
  }

  async createDistrict(payload: {
    division_id?: number | null;
    name_en: string;
    name_bn?: string;
    code: string;
  }): Promise<LocationDistrict> {
    const response = await api.post('/superadmin/locations/districts', payload);
    return response.data;
  }

  async updateDistrict(
    districtId: number,
    payload: { division_id?: number | null; name_en?: string; name_bn?: string; code?: string },
  ): Promise<LocationDistrict> {
    const response = await api.put(`/superadmin/locations/districts/${districtId}`, payload);
    return response.data;
  }

  async deleteDistrict(districtId: number): Promise<void> {
    await api.delete(`/superadmin/locations/districts/${districtId}`);
  }

  async listUpazilas(districtId?: number): Promise<LocationUpazila[]> {
    const response = await api.get('/superadmin/locations/upazilas', {
      params: districtId ? { district_id: districtId } : {},
    });
    return response.data;
  }

  async listMouzas(upazilaId?: number): Promise<LocationMouza[]> {
    const response = await api.get('/superadmin/locations/mouzas', {
      params: upazilaId ? { upazila_id: upazilaId } : {},
    });
    return response.data;
  }

  async listUsers(role?: string, q?: string): Promise<ManagedUserList> {
    const params: Record<string, string> = {};
    if (role) params.role = role;
    if (q) params.q = q;
    const response = await api.get('/superadmin/users', { params });
    return response.data;
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<ManagedUser> {
    const response = await api.put(`/superadmin/users/${userId}/status`, {
      is_active: isActive,
    });
    return response.data;
  }

  async updateUserRole(userId: number, role: string): Promise<ManagedUser> {
    const response = await api.put(`/superadmin/users/${userId}/role`, { role });
    return response.data;
  }

  async listAuditLogs(limit = 15): Promise<AuditLogEntry[]> {
    const response = await api.get('/superadmin/audit-logs', { params: { limit } });
    return response.data;
  }

  async listSettings(): Promise<SystemSetting[]> {
    const response = await api.get('/superadmin/settings');
    return response.data;
  }

  async updateSetting(key: string, value: string): Promise<{ key: string; value: string }> {
    const response = await api.put(`/superadmin/settings/${key}`, { value });
    return response.data;
  }
}

export default new SuperAdminService();
