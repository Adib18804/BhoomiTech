import api from '../utils/api';

export interface LegalUpdate {
  id: number;
  title_en: string;
  title_bn?: string | null;
  summary_en: string;
  summary_bn?: string | null;
  category: string;
  publication_date?: string | null;
  effective_date?: string | null;
  official_source_name?: string | null;
  official_source_url?: string | null;
  language: string;
  status: string;
  upazila_id?: number | null;
  created_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LegalUpdatePayload {
  title_en: string;
  title_bn?: string | null;
  summary_en: string;
  summary_bn?: string | null;
  category: string;
  publication_date?: string | null;
  effective_date?: string | null;
  official_source_name?: string | null;
  official_source_url?: string | null;
  language?: string;
  status?: string;
  upazila_id?: number | null;
}

class ContentService {
  /** Published Land & Registration updates (public, informational). */
  async listPublished(category?: string, limit = 20): Promise<LegalUpdate[]> {
    const params: Record<string, string | number> = { limit };
    if (category) params.category = category;
    const response = await api.get('/content/legal-updates', { params });
    return response.data;
  }

  async getPublished(id: number): Promise<LegalUpdate> {
    const response = await api.get(`/content/legal-updates/${id}`);
    return response.data;
  }

  /** All updates (any status) visible to the acting administrator. */
  async listManage(): Promise<LegalUpdate[]> {
    const response = await api.get('/content/manage/legal-updates');
    return response.data;
  }

  async create(payload: LegalUpdatePayload): Promise<LegalUpdate> {
    const response = await api.post('/content/manage/legal-updates', payload);
    return response.data;
  }

  async update(id: number, payload: Partial<LegalUpdatePayload>): Promise<LegalUpdate> {
    const response = await api.put(`/content/manage/legal-updates/${id}`, payload);
    return response.data;
  }

  async remove(id: number): Promise<void> {
    await api.delete(`/content/manage/legal-updates/${id}`);
  }
}

export default new ContentService();
