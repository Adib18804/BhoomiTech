import api from '../utils/api';

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

class DemoService {
  /** All active demo scenarios (DEMO / DEVELOPMENT MODE - synthetic data). */
  async listScenarios(): Promise<{ demo_mode: boolean; scenarios: DemoScenario[] }> {
    const response = await api.get('/demo/scenarios');
    return response.data;
  }

  /** One scenario incl. its seller claim for demo form pre-fill. */
  async getScenario(scenarioId: string): Promise<DemoScenarioDetail> {
    const response = await api.get(`/demo/scenarios/${scenarioId}`);
    return response.data;
  }
}

export default new DemoService();
