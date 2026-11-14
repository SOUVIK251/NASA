export interface Experiment {
  id: string;
  name: string;
  investigation: string;
  platform: string;
  objective: string;
  fuel_or_material: string;
  gravity_condition: string;
  research_areas: string[];
  variables_studied: string[];
  source_note?: string;
  status: string;
  facility?: string;
  flight_dates?: string;
  findings?: Finding[];
  measurements?: Measurement[];
  measurement_count?: number;
  paper_count?: number;
  papers?: Paper[];
}

export interface RankingComponent {
  score: number;
  max: number;
  rationale: string;
}

export interface RankingBreakdown {
  total_score: number;
  rank_tier: string;
  components: {
    evidence_availability: RankingComponent;
    cross_investigation_support: RankingComponent;
    fire_safety_criticality: RankingComponent;
    parameter_breadth: RankingComponent;
    quantitative_maturity: RankingComponent;
  };
  formula: string;
}

export interface Finding {
  id: string;
  experiment_id: string;
  title: string;
  explanation: string;
  research_area: string;
  variables: string[];
  experimental_conditions: Record<string, any>;
  evidence_source: string;
  nasa_source_id?: string;
  fire_safety_relevance: string;
  mission_implications: string[];
  supporting_experiment_count: number;
  ranking_score: number;
  ranking_breakdown: RankingBreakdown;
  experiment?: {
    name: string;
    investigation: string;
    platform: string;
    fuel_or_material: string;
  };
}

export interface Measurement {
  id: string;
  experiment_id: string;
  test_id: string;
  run_label: string;
  fuel_material: string;
  sample_geometry?: string;
  oxygen_pct?: number;
  pressure_atm?: number;
  flow_velocity_cms?: number;
  temperature_c?: number;
  burn_rate?: number;
  flame_spread_rate_mms?: number;
  extinction_time_s?: number;
  droplet_diameter_mm?: number;
  special_observations?: string;
  data_source_type: string;
  citation: string;
  experiment_name?: string;
  investigation?: string;
  platform?: string;
}

export interface Paper {
  id: string;
  experiment_id?: string;
  title: string;
  authors: string;
  year: number;
  investigation: string;
  source_type: string;
  abstract: string;
  url: string;
  sourceUrl?: string;
  doi?: string;
  key_topics?: string[];
  notes?: string;
}

export interface FireSafetyTopic {
  id: string;
  title: string;
  icon: string;
  scientific_principle: string;
  what_nasa_studied: string;
  what_research_found: string;
  key_experiments: string[];
  fire_safety_relevance: string;
  spacecraft_design_rules: string[];
  lunar_mars_contrast: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'ELEVATED';
}

export interface OverviewData {
  stats: {
    experiments_count: number;
    papers_count: number;
    findings_count: number;
    measurements_count: number;
    investigations_count: number;
    investigations_list: string[];
  };
  research_areas: { name: string; experiment_count: number }[];
  top_findings: (Finding & { experiment_name: string; investigation: string; platform: string })[];
  platform_distribution: { platform: string; count: number }[];
  key_variables: string[];
  safety_factors: { id: string; title: string; risk_level: string; relevance: string }[];
}

export interface UnderstandBreakdown {
  what_experiment_shows?: string;
  fuel_behavior?: string;
  oxygen_transport?: string;
  gravity_effects?: string;
  measurements_indication?: string;
  fire_safety_relevance?: string;
}

export interface EarthVsIssComparison {
  buoyancy_difference?: string;
  transport_mechanism_difference?: string;
  flame_geometry_difference?: string;
  measured_results_difference?: string;
  spacecraft_implications?: string;
  moon_mars_extrapolation_disclaimer?: string;
}

export interface MeasurementProvenance {
  verified_measured?: string[];
  calculated_interpolated?: string[];
  model_estimated?: string[];
  unavailable_or_unmeasured?: string[];
}

export interface SimulatorContextData {
  selected_experiment?: string;
  investigation_name?: string;
  experiment_id?: string;
  dataset_id?: string;
  gravity_environment?: string;
  gravity_m_s2?: number;
  fuel_or_material?: string;
  fuel_phase?: string;
  oxygen_pct?: number;
  airflow_velocity_cm_s?: number;
  pressure_kPa_or_atm?: string;
  temperature_K_or_C?: string;
  current_playback_time?: number;
  current_phase?: string;
  measurements?: Record<string, any>;
  measured_keys?: string[];
  illustrative_keys?: string[];
  unavailable_parameters?: string[];
  model_outputs?: Record<string, any>;
  data_quality?: string;
  data_attribution?: string;
  data_provenance?: string;
  scientific_limitations?: string[];
  compare_mode?: boolean;
  earth_vs_iss?: Record<string, any>;
}

export interface AIQueryResult {
  query: string;
  status: 'EVIDENCE_CONFIRMED' | 'INSUFFICIENT_EVIDENCE' | string;
  answer: string;
  nasa_documented_findings: { title: string; explanation: string; source: string }[];
  ai_interpretation: string;
  potential_mission_relevance: string[];
  evidence_sources: { title: string; authors: string; year: number; source_type: string; url: string }[];
  related_experiments: { id: string; name: string; investigation: string; platform: string; fuel_or_material: string }[];
  confidence_score: number;
  retrieved_chunks_count: number;
  mode?: 'ONLINE_GEMINI' | 'LOCAL_HYBRID' | string;
  is_online?: boolean;
  ai_provider?: string;
  model_used?: string;
  action_taken?: string;
  understand_breakdown?: UnderstandBreakdown;
  advanced_scientific_explanation?: string;
  earth_vs_iss_comparison?: EarthVsIssComparison;
  measurement_provenance?: MeasurementProvenance;
  data_limitations_and_gaps?: string;
  simulator_context?: SimulatorContextData;
}

export type ProvenanceType =
  | 'NASA_MEASURED'          // MEASURED_TABLE: scalar from cited report table
  | 'DIGITIZED_FROM_PUBLICATION' // independently traced from scanned figure
  | 'APPROXIMATED_CURVE'    // hand-constructed to match published constants
  | 'CALCULATED'             // algebraically derived (e.g. D²=D_mm²)
  | 'MODEL_PREDICTION'       // reduced-order physics engine or PIML output
  | 'DERIVED_INTERPOLATED'   // linearly interpolated between recorded timestamps
  | 'ILLUSTRATIVE'           // visualization estimate; no sensor data
  | 'MODELED_SCENARIO'       // Grashof-scaled exploratory scenario (Moon/Mars)
  | 'UNAVAILABLE';           // not recorded or not applicable


export type FlameState =
  | 'IGNITION'
  | 'SUSTAINED'
  | 'GROWING'
  | 'SPREADING'
  | 'WEAKENING'
  | 'QUENCHING'
  | 'EXTINGUISHED';

export interface FlameStateDetail {
  state: FlameState;
  label: string;
  reasons: string[];
  color: string;
}

// ─── Fire Behaviour Analysis Module Types ──────────────────────────────────────

export type ScientificDataClassification =
  | 'VERIFIED_MEASURED'
  | 'PROCESSED_MEASURED'
  | 'PUBLISHED_FINDING'
  | 'CALCULATED'
  | 'MODEL_PREDICTION'
  | 'SYNTHETIC_OR_PLACEHOLDER'
  | 'UNVERIFIED'
  | 'UNAVAILABLE';

export interface FireBehaviourOverview {
  module_title: string;
  objective: string;
  scientific_framework: string;
  statistics: {
    core_spacecraft_investigations: number;
    indexed_flight_experiments: number;
    flight_measurements: number;
    peer_reviewed_and_tm_papers: number;
    manifest_datasets: number;
  };
  investigations: {
    id: string;
    psi_id: string;
    name: string;
    focus: string;
    platform: string;
  }[];
  sections: {
    id: string;
    title: string;
    description: string;
    investigations: string[];
    data_classification: ScientificDataClassification;
  }[];
}

export interface CombustionBehaviourData {
  section: string;
  comparisons: {
    property: string;
    earth_1g: string;
    microgravity_0g: string;
    physical_mechanism: string;
    supporting_experiments: string[];
    data_classification: ScientificDataClassification;
  }[];
  experimental_records: {
    experiment_id: string;
    experiment_name: string;
    investigation: string;
    platform: string;
    experimental_conditions: Record<string, any>;
    measurements_and_units: Record<string, any>;
    actual_observed_result: string;
    source_reference: string;
    source_url: string;
    data_availability: string;
    limitations: string;
    data_classification: ScientificDataClassification;
    is_illustrative_separated: boolean;
    illustrative_note?: string;
  }[];
}

export interface FlamePropagationData {
  section: string;
  saffire_time_series: {
    time_s: number;
    flame_pos_cm: number;
    flame_length_cm: number;
    spread_rate_cm_s: number;
    peak_temp_K?: number;
    flame_power_W?: number;
  }[];
  bass_time_series: {
    time_s: number;
    flame_pos_mm: number;
    flame_length_mm: number;
    spread_rate_cm_s: number;
  }[];
  flex_time_series: {
    time_s: number;
    D_mm: number;
    D2_mm2: number;
    burn_rate_K_mm2_s: number;
    phase?: string;
  }[];
  comparative_spread_rates: {
    test_id: string;
    material: string;
    investigation: string;
    airflow_velocity_cms: number;
    airflow_direction: string;
    oxygen_pct: number;
    pressure_atm: number;
    measured_spread_rate_mms: number;
    flame_length_mm?: number;
    heat_release_w?: number | null;
    data_classification: ScientificDataClassification;
    source: string;
  }[];
  geometry_warning: {
    title: string;
    description: string;
    rule: string;
  };
  optical_notes: {
    camera_systems: string[];
    extracted_measurements: string[];
    limitations: string;
  };
}

export interface FuelMaterialData {
  section: string;
  materials: {
    id: string;
    name: string;
    phase: string;
    composition: string;
    tested_geometries: string;
    ignition_conditions: string;
    pyrolysis_and_burning: string;
    thermal_classification: string;
    extinction_behavior: string;
    supporting_experiments: string[];
    data_classification: ScientificDataClassification;
    citation: string;
  }[];
  material_safety_disclaimer: string;
}

export interface OxygenAirflowData {
  section: string;
  oxygen_variation_data: {
    investigation: string;
    material: string;
    oxygen_pct: number;
    flow_velocity_cms: number;
    measured_spread_rate_cms?: number;
    spread_rate_mms?: number;
    extinction_observed?: boolean;
    hot_flame_duration_s?: number;
    cool_flame_observed?: boolean;
    data_classification: ScientificDataClassification;
    source: string;
  }[];
  airflow_variation_data: {
    investigation: string;
    material: string;
    flow_velocity_cms: number;
    flow_type: string;
    spread_or_burn_rate: string;
    behavior_summary: string;
    data_classification: ScientificDataClassification;
  }[];
  exploration_atmosphere_comparison: {
    standard_iss_cabin: Record<string, any>;
    exploration_atmosphere_artemis: Record<string, any>;
    scientific_insight: string;
    data_classification: ScientificDataClassification;
    citation: string;
  };
  missing_measurements: {
    variable: string;
    status: ScientificDataClassification;
    reason: string;
  }[];
}

export interface ExtinctionData {
  section: string;
  extinction_mechanisms: {
    regime: string;
    primary_investigation: string;
    observed_physics: string;
    quantitative_evidence: string;
    data_classification: ScientificDataClassification;
    citation: string;
  }[];
  suppression_rule_warning: string;
}

export interface FireSafetyInsightsData {
  section: string;
  insights: {
    id: string;
    question: string;
    conclusion: string;
    supporting_experiment: string;
    source_links: { title: string; url: string }[];
    experimental_conditions: string;
    limitations: string;
    measured_vs_interpreted: {
      measured_facts: string;
      engineering_interpretation: string;
    };
    data_classification: ScientificDataClassification;
  }[];
  disclaimer: string;
}

export interface ResearchQuestionAnalysisResult {
  question: string;
  evidence_supported_explanation: string;
  relevant_experiments: {
    id: string;
    name: string;
    platform: string;
    fuel: string;
    flow?: string;
  }[];
  retrieved_findings: {
    title: string;
    explanation: string;
    source: string;
  }[];
  available_measurements: {
    experiment: string;
    parameter: string;
    value: number | string;
    unit: string;
    classification: ScientificDataClassification;
    source: string;
  }[];
  cross_experiment_comparison: {
    contrast: string;
    finding: string;
  }[];
  scientific_limitations_and_gaps: string[];
  source_references: {
    title: string;
    authors?: string;
    year?: number;
    source_type?: string;
    url: string;
  }[];
  data_integrity_status: ScientificDataClassification;
}


