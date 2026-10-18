import api from '../utils/api';
import authService from './authService';

export interface DemoScenario {
  scenario_id: string;
  letter: string;
  name_en: string;
  name_bn: string | null;
  description_en: string;
  description_bn: string | null;
  scenario_type: string;
  district_name: string;
  upazila_name: string;
  mouza_name: string;
  survey_type: string;
  khatian_no: string;
  dag_no: string;
  parcel_id: string | null;
  display_order: number;
}

export interface DemoScenarioDetail extends DemoScenario {
  demo_mode: boolean;
  seller_claim: {
    claimed_owner_name: string;
    claimed_share_decimal: number;
    claimed_sale_area_decimal: number;
  };
}

// ---------------------------------------------------------------------------
// Hardcoded mock scenarios — mirrors backend seed_data.py / SCENARIO_IDENTIFIERS
// Returned only when authService.isDemoMode() is true (no backend reachable).
// ---------------------------------------------------------------------------
const MOCK_SCENARIOS: DemoScenario[] = [
  {
    scenario_id: 'SCENARIO_A', letter: 'A',
    name_en: 'Low Concern - Clean Record', name_bn: 'স্বল্প উদ্বেগ - পরিষ্কার রেকর্ড',
    description_en: 'All records match, no issues found',
    description_bn: 'সব রেকর্ড মিলেছে, কোন সমস্যা পাওয়া যায়নি',
    scenario_type: 'LOW_CONCERN',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '121', parcel_id: 'BT-PARCEL-000001',
    display_order: 1,
  },
  {
    scenario_id: 'SCENARIO_B', letter: 'B',
    name_en: 'Ownership Mismatch', name_bn: 'মালিকানা অমিল',
    description_en: 'Seller name does not match recorded owner',
    description_bn: 'বিক্রেতার নাম রেকর্ডকৃত মালিকের সাথে মিলছে না',
    scenario_type: 'OWNERSHIP_MISMATCH',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '122', parcel_id: 'BT-PARCEL-000002',
    display_order: 2,
  },
  {
    scenario_id: 'SCENARIO_C', letter: 'C',
    name_en: 'Mutation Pending', name_bn: 'মিউটেশন মুলতুবি',
    description_en: 'Mutation application pending approval',
    description_bn: 'মিউটেশন আবেদন অনুমোদনের অপেক্ষায়',
    scenario_type: 'MUTATION_PENDING',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '123', parcel_id: 'BT-PARCEL-000003',
    display_order: 3,
  },
  {
    scenario_id: 'SCENARIO_D', letter: 'D',
    name_en: 'Area/Share Conflict', name_bn: 'এলাকা/শেয়ার দ্বন্দ্ব',
    description_en: 'Seller claims full area while recorded share is 50%',
    description_bn: 'বিক্রেতা সম্পূর্ণ এলাকা দাবি করেন যেখানে রেকর্ডকৃত শেয়ার ৫০%',
    scenario_type: 'AREA_SHARE_CONFLICT',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '124', parcel_id: 'BT-PARCEL-000004',
    display_order: 4,
  },
  {
    scenario_id: 'SCENARIO_E', letter: 'E',
    name_en: 'Case Signal', name_bn: 'মামলা সংকেত',
    description_en: 'Pending legal case found',
    description_bn: 'মুলতুবি আইনি মামলা পাওয়া গেছে',
    scenario_type: 'CASE_SIGNAL',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '125', parcel_id: 'BT-PARCEL-000005',
    display_order: 5,
  },
  {
    scenario_id: 'SCENARIO_F', letter: 'F',
    name_en: 'Transaction Overlap', name_bn: 'লেনদেন ওভারল্যাপ',
    description_en: 'Multiple transactions exceed total area',
    description_bn: 'একাধিক লেনদেন মোট এলাকা অতিক্রম করেছে',
    scenario_type: 'TRANSACTION_OVERLAP',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '126', parcel_id: 'BT-PARCEL-000006',
    display_order: 6,
  },
  {
    scenario_id: 'SCENARIO_G', letter: 'G',
    name_en: 'Acquisition Signal', name_bn: 'অধিগ্রহণ সংকেত',
    description_en: 'Land under acquisition process',
    description_bn: 'জমি অধিগ্রহণ প্রক্রিয়াধীন',
    scenario_type: 'ACQUISITION_SIGNAL',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '127', parcel_id: 'BT-PARCEL-000007',
    display_order: 7,
  },
  {
    scenario_id: 'SCENARIO_H', letter: 'H',
    name_en: 'Government/Khas Signal', name_bn: 'সরকারি/খাস সংকেত',
    description_en: 'Government interest or khas land status',
    description_bn: 'সরকারি স্বার্থ বা খাস জমির অবস্থা',
    scenario_type: 'GOVERNMENT_KHAS_SIGNAL',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '342', dag_no: '128', parcel_id: 'BT-PARCEL-000008',
    display_order: 8,
  },
  {
    scenario_id: 'SCENARIO_I', letter: 'I',
    name_en: 'Historical Record Transition', name_bn: 'ঐতিহাসিক রেকর্ড পরিবর্তন',
    description_en: 'Historical chain with an area inconsistency',
    description_bn: 'এলাকার অসঙ্গতিসহ ঐতিহাসিক রেকর্ড চেইন',
    scenario_type: 'HISTORICAL_TRANSITION',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '343', dag_no: '129', parcel_id: 'BT-PARCEL-000009',
    display_order: 9,
  },
  {
    scenario_id: 'SCENARIO_J', letter: 'J',
    name_en: 'Multiple Risk Signals', name_bn: 'একাধিক ঝুঁকি সংকেত',
    description_en: 'Pending case and pending mutation simultaneously',
    description_bn: 'একইসাথে মুলতুবি মামলা ও মিউটেশন',
    scenario_type: 'MULTIPLE_RISKS',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '343', dag_no: '130', parcel_id: 'BT-PARCEL-000010',
    display_order: 10,
  },
  {
    scenario_id: 'SCENARIO_K', letter: 'K',
    name_en: 'Insufficient Data', name_bn: 'অপর্যাপ্ত তথ্য',
    description_en: 'Missing critical records prevent complete verification',
    description_bn: 'গুরুত্বপূর্ণ রেকর্ড অনুপস্থিত সম্পূর্ণ যাচাইকরণ প্রতিরোধ করে',
    scenario_type: 'INSUFFICIENT_DATA',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '343', dag_no: '131', parcel_id: 'BT-PARCEL-000011',
    display_order: 11,
  },
  {
    scenario_id: 'SCENARIO_L', letter: 'L',
    name_en: 'Critical Combined Signals', name_bn: 'গুরুতর সম্মিলিত সংকেত',
    description_en: 'Case + Acquisition + Ownership mismatch',
    description_bn: 'মামলা + অধিগ্রহণ + মালিকানা অমিল',
    scenario_type: 'CRITICAL_COMBINED',
    district_name: 'Dhaka', upazila_name: 'Savar', mouza_name: 'Demo Mouza',
    survey_type: 'RS', khatian_no: '343', dag_no: '132', parcel_id: 'BT-PARCEL-000012',
    display_order: 12,
  },
];

// Synthetic seller claims per scenario (mirrors seed_data.py _scenario_claims).
const MOCK_SELLER_CLAIMS: Record<string, { claimed_owner_name: string; claimed_share_decimal: number; claimed_sale_area_decimal: number }> = {
  SCENARIO_A: { claimed_owner_name: 'Md. Karim Ahmed',  claimed_share_decimal: 30, claimed_sale_area_decimal: 25 },
  SCENARIO_B: { claimed_owner_name: 'Incorrect Name',   claimed_share_decimal: 30, claimed_sale_area_decimal: 25 },
  SCENARIO_C: { claimed_owner_name: 'Abdul Jabbar',     claimed_share_decimal: 35, claimed_sale_area_decimal: 30 },
  SCENARIO_D: { claimed_owner_name: 'Rahima Khatun',    claimed_share_decimal: 40, claimed_sale_area_decimal: 40 },
  SCENARIO_E: { claimed_owner_name: 'Ayesha Siddika',   claimed_share_decimal: 45, claimed_sale_area_decimal: 40 },
  SCENARIO_F: { claimed_owner_name: 'Habibur Rahman',   claimed_share_decimal: 50, claimed_sale_area_decimal: 50 },
  SCENARIO_G: { claimed_owner_name: 'Salma Khatun',     claimed_share_decimal: 55, claimed_sale_area_decimal: 50 },
  SCENARIO_H: { claimed_owner_name: 'Md. Jamal Uddin',  claimed_share_decimal: 60, claimed_sale_area_decimal: 55 },
  SCENARIO_I: { claimed_owner_name: 'Nasima Begum',     claimed_share_decimal: 65, claimed_sale_area_decimal: 60 },
  SCENARIO_J: { claimed_owner_name: 'Md. Karim Ahmed',  claimed_share_decimal: 70, claimed_sale_area_decimal: 65 },
  SCENARIO_K: { claimed_owner_name: 'Unknown Claimant', claimed_share_decimal: 75, claimed_sale_area_decimal: 70 },
  SCENARIO_L: { claimed_owner_name: 'Fatema Begum',     claimed_share_decimal: 80, claimed_sale_area_decimal: 75 },
};

class DemoService {
  /**
   * All active demo scenarios (DEMO / DEVELOPMENT MODE - synthetic data).
   * When in Demo Mode (no live backend), returns hardcoded frontend fixtures
   * instantly without touching the network. Real sessions always call the API.
   */
  async listScenarios(): Promise<{ demo_mode: boolean; scenarios: DemoScenario[] }> {
    if (authService.isDemoMode()) {
      return { demo_mode: true, scenarios: MOCK_SCENARIOS };
    }
    const response = await api.get('/demo/scenarios');
    return response.data;
  }

  /**
   * One scenario incl. its seller claim for demo form pre-fill.
   * When in Demo Mode, returns the matching hardcoded scenario without a
   * network call. Real sessions always call the API.
   */
  async getScenario(scenarioId: string): Promise<DemoScenarioDetail> {
    if (authService.isDemoMode()) {
      const scenario = MOCK_SCENARIOS.find((s) => s.scenario_id === scenarioId);
      if (!scenario) {
        throw new Error(`Demo scenario not found: ${scenarioId}`);
      }
      return {
        ...scenario,
        demo_mode: true,
        seller_claim: MOCK_SELLER_CLAIMS[scenarioId] ?? {
          claimed_owner_name: '',
          claimed_share_decimal: 0,
          claimed_sale_area_decimal: 0,
        },
      };
    }
    const response = await api.get(`/demo/scenarios/${scenarioId}`);
    return response.data;
  }
}

export default new DemoService();
