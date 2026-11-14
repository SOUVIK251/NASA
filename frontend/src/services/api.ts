import {
  OverviewData, Finding, Experiment, Measurement, Paper, FireSafetyTopic, AIQueryResult,
  FireBehaviourOverview, CombustionBehaviourData, FlamePropagationData,
  FuelMaterialData, OxygenAirflowData, ExtinctionData, FireSafetyInsightsData,
  ResearchQuestionAnalysisResult
} from '../types';

export const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || '/api';

export function buildApiUrl(path: string): URL {
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(`${cleanBase}${cleanPath}`);
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const cleanBase = API_BASE.startsWith('/') ? API_BASE : `/${API_BASE}`;
  return new URL(`${window.location.origin}${cleanBase}${cleanPath}`);
}

export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFindings(params?: {
  search?: string;
  investigation?: string;
  research_area?: string;
  variable?: string;
  min_score?: number;
  sort_by?: string;
}): Promise<{ count: number; findings: Finding[] }> {
  const url = buildApiUrl('/findings');
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, String(val));
      }
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFindingDetail(id: string): Promise<{
  finding: Finding;
  supporting_measurements: Measurement[];
  supporting_paper?: Paper;
}> {
  const res = await fetch(`${API_BASE}/findings/${id}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchExperiments(): Promise<Experiment[]> {
  const res = await fetch(`${API_BASE}/explore/experiments`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchExperimentDetail(id: string): Promise<Experiment> {
  const res = await fetch(`${API_BASE}/explore/experiments/${id}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchMeasurements(params?: {
  experiment_id?: string;
  material?: string;
  min_o2?: number;
  max_o2?: number;
  min_velocity?: number;
  max_velocity?: number;
}): Promise<{ count: number; measurements: Measurement[] }> {
  const url = buildApiUrl('/explore/measurements');
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.append(key, String(val));
      }
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function compareExperiments(expIds: string[]): Promise<{
  compared_count: number;
  experiments: Experiment[];
}> {
  const url = buildApiUrl('/explore/compare');
  expIds.forEach((id) => url.searchParams.append('exp_ids', id));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function queryAIAnalyst(
  query: string,
  mode: 'online' | 'local' = 'online',
  simulatorContext?: any,
  action?: string,
  explanationLevel: 'beginner' | 'advanced' = 'beginner'
): Promise<AIQueryResult> {
  const res = await fetch(`${API_BASE}/ai/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      mode,
      simulator_context: simulatorContext,
      action,
      explanation_level: explanationLevel
    }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function explainSimulatorExperiment(
  action: string,
  simulatorContext: any,
  query?: string,
  mode: 'online' | 'local' = 'online',
  explanationLevel: 'beginner' | 'advanced' = 'beginner'
): Promise<AIQueryResult> {
  const res = await fetch(`${API_BASE}/ai/simulator-explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      simulator_context: simulatorContext,
      query,
      mode,
      explanation_level: explanationLevel
    }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchAIStatus(): Promise<{
  status: string;
  provider: string;
  active_model: string;
  key_masked: string;
  key_configured: boolean;
  latency_ms?: number;
  last_check?: string;
}> {
  const res = await fetch(`${API_BASE}/ai/status`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function pingAI(): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/ping`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFireSafetyTopics(): Promise<FireSafetyTopic[]> {
  const res = await fetch(`${API_BASE}/fire-safety`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchSources(): Promise<Paper[]> {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data: Paper[] = await res.json();
  return data.map(p => ({
    ...p,
    sourceUrl: p.sourceUrl || p.url
  }));
}

export async function fetchPaperById(id: string): Promise<Paper> {
  const res = await fetch(`${API_BASE}/sources/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Research paper unavailable');
    }
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  const paper: Paper = await res.json();
  return {
    ...paper,
    sourceUrl: paper.sourceUrl || paper.url
  };
}

export async function fetchSystemStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

// ─── Simulator API ──────────────────────────────────────────

export interface SimulatorInput {
  gravity_environment: string;
  custom_gravity_m_s2?: number;
  oxygen_pct: number;
  airflow_velocity_cm_s: number;
  pressure_kPa: number;
  initial_temperature_K: number;
  fuel_type: string;
}

export async function fetchSimulatorInfo(): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/info`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function runSimulation(params: SimulatorInput): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function saveSimulatorScenario(name: string, params: SimulatorInput): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/scenarios/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, params }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchSimulatorScenarios(): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/scenarios`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function compareSimulatorScenarios(scenarioIds: string[]): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_ids: scenarioIds }),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchResearchContext(gravityEnv: string): Promise<any> {
  const res = await fetch(`${API_BASE}/simulator/research-context/${gravityEnv}`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

// ─── Machine Learning Combustion Inference API ─────────────

export interface DropletMLInput {
  initial_diameter_mm: number;
  oxygen_pct: number;
  pressure_atm: number;
  time_s: number;
  gravity_m_s2?: number;
}

export interface DropletMLOutput {
  time_s: number;
  D0_mm: number;
  predicted_D_mm: number;
  predicted_D2_mm2: number;
  predicted_burn_rate_K_mm2_s: number;
  predicted_phase: string;
  regime_code: number;
  is_cool_flame: boolean;
  is_extinguished: boolean;
  cool_flame_transition_time_s: number;
  predicted_extinction_time_s: number;
  baseline_single_stage_D_mm: number;
  uncertainty_sigma_mm: number;
  is_out_of_distribution: boolean;
  ood_warnings: string[];
  provenance: string;
  model_version: string;
}

export interface DropletTimeseriesMLOutput {
  inputs: {
    D0_mm: number;
    oxygen_pct: number;
    pressure_atm: number;
    gravity_ms2: number;
  };
  extinction_time_s: number;
  cool_flame_transition_time_s: number;
  is_out_of_distribution: boolean;
  ood_warnings: string[];
  model_version: string;
  datapoints: Array<{
    time_s: number;
    D_mm: number;
    D2_mm2: number;
    phase: string;
    burn_rate_K: number;
    baseline_D_mm: number;
    upper_bound_mm: number;
    lower_bound_mm: number;
  }>;
}

export async function predictDropletML(params: DropletMLInput): Promise<DropletMLOutput> {
  const res = await fetch(`${API_BASE}/ml/predict-droplet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function predictDropletTimeseriesML(params: {
  initial_diameter_mm: number;
  oxygen_pct: number;
  pressure_atm: number;
  gravity_m_s2?: number;
  num_points?: number;
}): Promise<DropletTimeseriesMLOutput> {
  const res = await fetch(`${API_BASE}/ml/predict-timeseries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchMLModelInfo(): Promise<any> {
  const res = await fetch(`${API_BASE}/ml/model-info`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

// ─── Fire Behaviour Analysis API Endpoints ─────────────────────────────────────

export async function fetchFireBehaviourOverview(): Promise<FireBehaviourOverview> {
  const res = await fetch(`${API_BASE}/fire-behaviour/overview`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchCombustionBehaviour(): Promise<CombustionBehaviourData> {
  const res = await fetch(`${API_BASE}/fire-behaviour/combustion-behaviour`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFlamePropagation(): Promise<FlamePropagationData> {
  const res = await fetch(`${API_BASE}/fire-behaviour/flame-propagation`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFuelMaterialBehaviour(): Promise<FuelMaterialData> {
  const res = await fetch(`${API_BASE}/fire-behaviour/fuel-material`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchOxygenAirflowAnalysis(): Promise<OxygenAirflowData> {
  const res = await fetch(`${API_BASE}/fire-behaviour/oxygen-airflow`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFlameExtinctionAnalysis(): Promise<ExtinctionData> {
  const res = await fetch(`${API_BASE}/fire-behaviour/extinction`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function fetchFireSafetyInsights(): Promise<FireSafetyInsightsData> {
  const res = await fetch(`${API_BASE}/fire-behaviour/fire-safety-insights`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export async function analyzeResearchQuestion(payload: {
  question_id?: string;
  custom_query?: string;
}): Promise<ResearchQuestionAnalysisResult> {
  const res = await fetch(`${API_BASE}/fire-behaviour/research-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

