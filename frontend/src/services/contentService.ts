import api from '../utils/api';
import authService from './authService';

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

// ---------------------------------------------------------------------------
// Hardcoded demo legal updates — returned only when isDemoMode() is true.
// Prevents "Could not load land and registration updates" on LegalUpdatesPage
// and the LegalUpdateTicker when there is no live backend.
// ---------------------------------------------------------------------------
const DEMO_LEGAL_UPDATES: LegalUpdate[] = [
  {
    id: 1,
    title_en: 'e-Mutation Process Digitisation',
    title_bn: 'ই-মিউটেশন প্রক্রিয়া ডিজিটাইজেশন',
    summary_en:
      'The Ministry of Land has launched a fully online e-Mutation portal. Citizens can now submit name-transfer (mutation) applications without visiting the land office in person. Applications are processed within 28 working days and status updates are sent via SMS.',
    summary_bn:
      'ভূমি মন্ত্রণালয় সম্পূর্ণ অনলাইন ই-মিউটেশন পোর্টাল চালু করেছে। নাগরিকরা এখন ভূমি অফিসে সশরীরে না গিয়ে নামজারি (মিউটেশন) আবেদন অনলাইনে জমা দিতে পারবেন। ২৮ কার্যদিবসের মধ্যে আবেদন নিষ্পত্তি করা হয় এবং এসএমএসের মাধ্যমে আপডেট পাঠানো হয়।',
    category: 'Mutation',
    publication_date: '2026-10-01',
    effective_date: '2026-10-15',
    official_source_name: 'Ministry of Land, Bangladesh',
    official_source_url: 'https://minland.gov.bd',
    language: 'en',
    status: 'published',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 2,
    title_en: 'Digital Land Records Modernisation',
    title_bn: 'ডিজিটাল ভূমি রেকর্ড আধুনিকীকরণ',
    summary_en:
      'Under the Digital Bangladesh initiative, all district-level land records (khatian and dag maps) are being digitised and made available through the national land portal (land.gov.bd). Citizens can now verify parcel details and download certified copies of records online.',
    summary_bn:
      'ডিজিটাল বাংলাদেশ উদ্যোগের আওতায়, সমস্ত জেলা পর্যায়ের ভূমি রেকর্ড (খতিয়ান ও দাগ মানচিত্র) ডিজিটাইজ করা হচ্ছে এবং জাতীয় ভূমি পোর্টালের (land.gov.bd) মাধ্যমে সহজলভ্য করা হচ্ছে।',
    category: 'Land Records',
    publication_date: '2026-09-15',
    effective_date: '2026-09-15',
    official_source_name: 'land.gov.bd',
    official_source_url: 'https://land.gov.bd',
    language: 'en',
    status: 'published',
    created_at: '2026-09-15T00:00:00Z',
    updated_at: '2026-09-15T00:00:00Z',
  },
  {
    id: 3,
    title_en: 'Revised Land Registration Fees',
    title_bn: 'সংশোধিত ভূমি নিবন্ধন ফি',
    summary_en:
      'The Ministry of Finance and the Ministry of Law have jointly revised land registration stamp duty and registration fees effective from the fiscal year 2026-27. The new schedule aims to reduce the cost of formal property transfers and encourage compliance.',
    summary_bn:
      'অর্থ মন্ত্রণালয় এবং আইন মন্ত্রণালয় যৌথভাবে ২০২৬-২৭ অর্থবছর থেকে কার্যকর ভূমি নিবন্ধন স্ট্যাম্প শুল্ক ও নিবন্ধন ফি সংশোধন করেছে।',
    category: 'Registration',
    publication_date: '2026-07-01',
    effective_date: '2026-07-01',
    official_source_name: 'Ministry of Finance, Bangladesh',
    official_source_url: null,
    language: 'en',
    status: 'published',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
  },
];

class ContentService {
  /**
   * Published Land & Registration updates (public, informational).
   * In Demo Mode (no live backend), returns hardcoded demo updates so
   * LegalUpdatesPage and LegalUpdateTicker render without errors.
   * Real sessions always call the API.
   */
  async listPublished(category?: string, limit = 20): Promise<LegalUpdate[]> {
    if (authService.isDemoMode()) {
      const filtered = category
        ? DEMO_LEGAL_UPDATES.filter((u) => u.category === category)
        : DEMO_LEGAL_UPDATES;
      return filtered.slice(0, limit);
    }
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
