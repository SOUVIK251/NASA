import React, { useState, useEffect } from 'react';
import {
  FireBehaviourOverview,
  CombustionBehaviourData,
  FlamePropagationData,
  FuelMaterialData,
  OxygenAirflowData,
  ExtinctionData,
  FireSafetyInsightsData,
  ResearchQuestionAnalysisResult,
  ScientificDataClassification
} from '../types';
import {
  fetchFireBehaviourOverview,
  fetchCombustionBehaviour,
  fetchFlamePropagation,
  fetchFuelMaterialBehaviour,
  fetchOxygenAirflowAnalysis,
  fetchFlameExtinctionAnalysis,
  fetchFireSafetyInsights,
  analyzeResearchQuestion
} from '../services/api';
import { DataClassificationBadge } from '../components/fire_behaviour/DataClassificationBadge';
import { ScientificChartWrapper } from '../components/fire_behaviour/ScientificChartWrapper';
import {
  Flame,
  Wind,
  ShieldAlert,
  Activity,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Satellite,
  Compass,
  FileText,
  Thermometer,
  Zap,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';

interface FireBehaviourAnalysisViewProps {
  onNavigate: (module: string, param?: string) => void;
  initialSection?: string;
}

type SectionKey =
  | 'COMBUSTION_BEHAVIOUR'
  | 'FLAME_PROPAGATION'
  | 'FUEL_MATERIAL'
  | 'OXYGEN_AIRFLOW'
  | 'FLAME_EXTINCTION'
  | 'FIRE_SAFETY_INSIGHTS'
  | 'RESEARCH_QUESTIONS';

export const FireBehaviourAnalysisView: React.FC<FireBehaviourAnalysisViewProps> = ({
  onNavigate,
  initialSection
}) => {
  const [activeSection, setActiveSection] = useState<SectionKey>('COMBUSTION_BEHAVIOUR');

  // Loading & Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<FireBehaviourOverview | null>(null);
  const [combustionData, setCombustionData] = useState<CombustionBehaviourData | null>(null);
  const [propagationData, setPropagationData] = useState<FlamePropagationData | null>(null);
  const [fuelData, setFuelData] = useState<FuelMaterialData | null>(null);
  const [oxygenData, setOxygenData] = useState<OxygenAirflowData | null>(null);
  const [extinctionData, setExtinctionData] = useState<ExtinctionData | null>(null);
  const [insightsData, setInsightsData] = useState<FireSafetyInsightsData | null>(null);

  // Material selection in Section C
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('PMMA');

  // Exploratory scenario sliders in Section D
  const [scenarioO2, setScenarioO2] = useState<number>(21.0);
  const [scenarioVelocity, setScenarioVelocity] = useState<number>(10.0);
  const [scenarioGravity, setScenarioGravity] = useState<string>('0g'); // '0g', '0.16g', '0.38g', '1g'

  // Interactive Question Analysis state (Section G)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('Q1');
  const [customQueryInput, setCustomQueryInput] = useState<string>('');
  const [questionResult, setQuestionResult] = useState<ResearchQuestionAnalysisResult | null>(null);
  const [questionLoading, setQuestionLoading] = useState<boolean>(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, cb, pr, fl, ox, ex, ins] = await Promise.all([
        fetchFireBehaviourOverview(),
        fetchCombustionBehaviour(),
        fetchFlamePropagation(),
        fetchFuelMaterialBehaviour(),
        fetchOxygenAirflowAnalysis(),
        fetchFlameExtinctionAnalysis(),
        fetchFireSafetyInsights()
      ]);

      setOverview(ov);
      setCombustionData(cb);
      setPropagationData(pr);
      setFuelData(fl);
      setOxygenData(ox);
      setExtinctionData(ex);
      setInsightsData(ins);

      // Run initial question analysis for Q1
      runQuestionAnalysis('Q1');
    } catch (err: any) {
      console.error('Failed to load fire behaviour analysis data:', err);
      setError(err?.message || 'Failed to connect to fire behaviour API.');
    } finally {
      setLoading(false);
    }
  };

  const runQuestionAnalysis = async (qid?: string, customText?: string) => {
    setQuestionLoading(true);
    setQuestionError(null);
    try {
      const payload: { question_id?: string; custom_query?: string } = {};
      if (customText && customText.trim()) {
        payload.custom_query = customText.trim();
      } else if (qid) {
        payload.question_id = qid;
      } else {
        payload.question_id = selectedQuestionId;
      }

      const res = await analyzeResearchQuestion(payload);
      setQuestionResult(res);
    } catch (err: any) {
      console.error('Failed to analyze research question:', err);
      setQuestionError(err?.message || 'Error evaluating research question.');
    } finally {
      setQuestionLoading(false);
    }
  };

  const navSections = [
    { id: 'COMBUSTION_BEHAVIOUR', label: 'A. Combustion Behaviour', icon: Flame },
    { id: 'FLAME_PROPAGATION', label: 'B. Flame Propagation', icon: Activity },
    { id: 'FUEL_MATERIAL', label: 'C. Fuel & Materials', icon: Layers },
    { id: 'OXYGEN_AIRFLOW', label: 'D. Oxygen & Airflow', icon: Wind },
    { id: 'FLAME_EXTINCTION', label: 'E. Extinction Analysis', icon: Thermometer },
    { id: 'FIRE_SAFETY_INSIGHTS', label: 'F. Fire-Safety Insights', icon: ShieldAlert },
    { id: 'RESEARCH_QUESTIONS', label: 'G. Question Analysis', icon: Search }
  ];

  // Helper for exploratory Grashof model in Section D
  const calculatedScenario = React.useMemo(() => {
    // Simplified scaling for exploratory insight:
    // Spread rate is proportional to oxygen fraction^1.2 and airflow velocity^0.5
    const gRatio = scenarioGravity === '0g' ? 0.001 : scenarioGravity === '0.16g' ? 0.16 : scenarioGravity === '0.38g' ? 0.38 : 1.0;
    const baseRate = 0.79; // mm/s for PMMA at 21% O2, 10 cm/s in 0g
    const o2Factor = Math.pow(scenarioO2 / 21.0, 1.25);
    const flowFactor = Math.pow((scenarioVelocity + (gRatio > 0.05 ? 35 * Math.sqrt(gRatio) : 0)) / 10.0, 0.45);
    const estimatedSpread = Number((baseRate * o2Factor * flowFactor).toFixed(2));
    const grashofEstimate = Math.round(gRatio * 9.81 * 0.01 * 0.01 * 0.01 * 1e8);

    return {
      estimatedSpread,
      grashofEstimate,
      regime: gRatio < 0.01 ? 'Forced Convection / Molecular Diffusion' : 'Mixed Convection (Buoyancy + Forced Flow)'
    };
  }, [scenarioO2, scenarioVelocity, scenarioGravity]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* ─── MODULE HEADER ────────────────────────────────────────────── */}
      <div className="sci-card p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-sky-500/10 via-amber-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-sky-400 uppercase tracking-widest mb-1">
              <Satellite className="w-4 h-4 text-sky-400" />
              <span>NASA PHYSICAL SCIENCES INFORMATICS (PSI) • RESEARCH MODULE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Spacecraft Fire Behaviour Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Quantitative investigation of microgravity combustion physics, material flammability limits,
              and evidence-based fire-safety analysis using BASS-II, FLEX, and SAFFIRE spaceflight experimental datasets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>FLIGHT DATA LOADED</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-sky-950/70 text-sky-300 border border-sky-500/40 font-bold">
              PEER-REVIEWED CORPUS
            </span>
          </div>
        </div>

        {/* Section Navigation Strip */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
          {navSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as SectionKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── LOADING & ERROR STATES ────────────────────────────────────── */}
      {loading ? (
        <div className="sci-card p-12 text-center text-slate-400 space-y-3">
          <Activity className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-sm font-mono tracking-wider">
            Loading NASA microgravity combustion telemetry and flight records...
          </p>
        </div>
      ) : error ? (
        <div className="sci-card p-8 text-center bg-red-950/30 border border-red-500/40 rounded-xl space-y-4">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Connection Error</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadAllData}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════
              SECTION A: COMBUSTION BEHAVIOUR
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'COMBUSTION_BEHAVIOUR' && combustionData && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="sci-card p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold">
                    <span>SECTION A</span>
                    <span>•</span>
                    <span>FUNDAMENTAL MICROGRAVITY COMBUSTION PHYSICS</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    How Combustion Changes in Microgravity vs Earth
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    In normal gravity (1g), combustion produces hot buoyant gases that rise rapidly (~1 to 2 m/s),
                    stretching the flame into a narrow plume and drawing in fresh ambient air. In microgravity (0g),
                    buoyancy is virtually absent ($Gr \to 0$); flames expand into wide, spherical diffusion zones
                    where molecular transport and radiative heat loss dominate.
                  </p>
                </div>
                <DataClassificationBadge classification="PUBLISHED_FINDING" size="sm" />
              </div>

              {/* Physical Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {combustionData.comparisons.map((c, i) => (
                  <div
                    key={i}
                    className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-sky-300">{c.property}</h3>
                        <DataClassificationBadge classification={c.data_classification} size="xs" />
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">
                            Earth (1g Buoyant)
                          </span>
                          <span className="text-slate-300 mt-0.5 block leading-relaxed">{c.earth_1g}</span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/20">
                          <span className="text-[10px] font-mono text-sky-400 font-bold block uppercase">
                            Microgravity (0g Diffusion)
                          </span>
                          <span className="text-slate-200 mt-0.5 block leading-relaxed">{c.microgravity_0g}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-snug">
                      <span className="text-slate-500 font-mono font-bold">PHYSICAL MECHANISM: </span>
                      {c.physical_mechanism}
                    </div>
                  </div>
                ))}
              </div>

              {/* Verified Flight Experimental Records */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                    Verified NASA Flight Experimental Records
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Direct flight datasets from CIR & Cygnus
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {combustionData.experimental_records.map((rec) => (
                    <div
                      key={rec.experiment_id}
                      className="sci-card p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Record Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                              {rec.investigation}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                              {rec.experiment_name}
                            </h4>
                          </div>
                          <DataClassificationBadge classification={rec.data_classification} size="xs" />
                        </div>

                        {/* Experimental Conditions */}
                        <div className="p-2.5 bg-slate-950/90 rounded-lg border border-slate-800/80 text-[11px] font-mono space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                            Experimental Conditions
                          </span>
                          {Object.entries(rec.experimental_conditions).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-slate-300">
                              <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                              <span className="font-semibold">{String(v)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Measurements Table */}
                        <div className="space-y-1 text-xs">
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                            Key Measurements & Values
                          </span>
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono">
                            {Object.entries(rec.measurements_and_units).map(([param, val]) => (
                              <div key={param} className="flex justify-between items-baseline gap-2">
                                <span className="text-slate-400 text-[10px]">{param.replace(/_/g, ' ')}:</span>
                                <span className="text-sky-300 font-semibold text-right">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actual Observed Result */}
                        <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/30 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-slate-400 font-bold block mb-1">Observed Flight Result:</span>
                          {rec.actual_observed_result}
                        </div>

                        {/* Illustrative Note */}
                        {rec.is_illustrative_separated && rec.illustrative_note && (
                          <div className="text-[10px] text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-500/30 flex items-start space-x-1.5">
                            <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <span>{rec.illustrative_note}</span>
                          </div>
                        )}
                      </div>

                      {/* Record Footer */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">CITATION:</span>
                          <a
                            href={rec.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 inline-flex items-center space-x-1"
                          >
                            <span>NASA NTRS / DOI</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <button
                          onClick={() => onNavigate('simulator', rec.experiment_id)}
                          className="w-full py-1.5 px-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>LAUNCH IN 3D SIMULATOR</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION B: FLAME PROPAGATION ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'FLAME_PROPAGATION' && propagationData && (
            <div className="space-y-6">
              {/* Introduction & Geometry Warning */}
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>{propagationData.geometry_warning.title}</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                  {propagationData.geometry_warning.description}
                </p>
                <div className="text-[11px] font-mono text-amber-300 font-semibold">
                  MANDATORY RULE: {propagationData.geometry_warning.rule}
                </div>
              </div>

              {/* Time-Series Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: SAFFIRE-I Flame Front Position & Length */}
                <ScientificChartWrapper
                  title="SAFFIRE-I Large-Scale Flame Front & Length vs Time"
                  subtitle="SIBAL fabric (40.6 x 94 cm sheet) under 20 cm/s concurrent duct flow"
                  xAxisLabel="Time"
                  xAxisUnit="seconds"
                  yAxisLabel="Flame Front Position / Length"
                  yAxisUnit="cm"
                  experimentSource="SAFFIRE-I (NASA NTRS 20170008805 Table I)"
                  sourceUrl="https://ntrs.nasa.gov/citations/20170008805"
                  classification="PROCESSED_MEASURED"
                  notes="Steady spread rate = 0.18 cm/s (1.8 mm/s); flame length stabilized at 4.0 cm."
                  onLaunchSimulator={() => onNavigate('simulator', 'EXP-SAFFIRE')}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={propagationData.saffire_time_series} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                      <XAxis dataKey="time_s" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 90]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        formatter={(val: any, name: any) => [
                          `${Number(val).toFixed(2)} cm`,
                          name === 'flame_pos_cm' ? 'Flame Front Pos' : 'Flame Length'
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="flame_pos_cm"
                        name="Flame Front Position (cm)"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="flame_length_cm"
                        name="Flame Length (cm)"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ScientificChartWrapper>

                {/* Chart 2: BASS-II PMMA Rod Flame Spread */}
                <ScientificChartWrapper
                  title="BASS-II PMMA Solid Rod Flame Position vs Time"
                  subtitle="6.35 mm diameter cast PMMA rod under 10 cm/s concurrent flow"
                  xAxisLabel="Time"
                  xAxisUnit="seconds"
                  yAxisLabel="Flame Position"
                  yAxisUnit="mm"
                  experimentSource="BASS-II Test O1 (NASA/TM-20210011385 Table A.5)"
                  sourceUrl="https://ntrs.nasa.gov/citations/20210011385"
                  classification="PROCESSED_MEASURED"
                  notes="Steady concurrent spread rate = 0.079 cm/s (0.79 mm/s); flame length plateau = 12.3 mm."
                  onLaunchSimulator={() => onNavigate('simulator', 'BASS2-PMMA-T01')}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={propagationData.bass_time_series} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                      <XAxis dataKey="time_s" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 90]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        formatter={(val: any, name: any) => [
                          `${Number(val).toFixed(2)} mm`,
                          name === 'flame_pos_mm' ? 'Flame Front Pos' : 'Flame Length'
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="flame_pos_mm"
                        name="Flame Position (mm)"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="flame_length_mm"
                        name="Flame Length (mm)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ScientificChartWrapper>
              </div>

              {/* Comparative Flight Test Spread Rates Table */}
              <div className="sci-card p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide font-mono uppercase">
                      Comparative Measured Flame Spread Rates
                    </h3>
                    <p className="text-xs text-slate-400">
                      Standardized flight records from SAFFIRE and BASS-II investigations
                    </p>
                  </div>
                  <DataClassificationBadge classification="VERIFIED_MEASURED" size="sm" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Test ID</th>
                        <th className="py-2.5 px-3">Sample Material</th>
                        <th className="py-2.5 px-3">Investigation</th>
                        <th className="py-2.5 px-3">Airflow</th>
                        <th className="py-2.5 px-3">O₂ %</th>
                        <th className="py-2.5 px-3 text-right">Spread Rate (mm/s)</th>
                        <th className="py-2.5 px-3 text-right">Flame Length (mm)</th>
                        <th className="py-2.5 px-3">Data Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {propagationData.comparative_spread_rates.map((row) => (
                        <tr key={row.test_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-sky-400">{row.test_id}</td>
                          <td className="py-2.5 px-3 text-slate-200">{row.material}</td>
                          <td className="py-2.5 px-3 text-slate-400">{row.investigation}</td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {row.airflow_velocity_cms} cm/s ({row.airflow_direction})
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{row.oxygen_pct}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                            {row.measured_spread_rate_mms.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {row.flame_length_mm !== undefined && row.flame_length_mm !== null
                              ? row.flame_length_mm.toFixed(1)
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <DataClassificationBadge classification={row.data_classification} size="xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Optical Camera Telemetry Notes */}
              <div className="sci-card p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                <span className="font-mono text-sky-400 font-bold uppercase block text-[11px]">
                  NASA Flight Optical Diagnostics & Camera Hardware
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {propagationData.optical_notes.camera_systems.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
                <div className="pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Diagnostics Caveat: </span>
                  {propagationData.optical_notes.limitations}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION C: FUEL AND MATERIAL BEHAVIOUR
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'FUEL_MATERIAL' && fuelData && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="sci-card p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold">
                    <span>SECTION C</span>
                    <span>•</span>
                    <span>MATERIAL PROPERTIES & PYROLYSIS MECHANISMS</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Fuel and Material Flammability in Spacecraft Environments
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Material flammability depends heavily on sample geometry and thermal thickness. Thermally thin
                    fabrics (SIBAL) heat through instantly and spread flames rapidly, while thick polymers (PMMA rods)
                    suffer from internal conductive heat sink effects. Aramid polymers (Nomex) form protective char layers
                    that self-extinguish in microgravity.
                  </p>
                </div>
                <DataClassificationBadge classification="VERIFIED_MEASURED" size="sm" />
              </div>

              {/* Material Selection Tabs */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {fuelData.materials.map((m) => {
                  const isSelected = selectedMaterialId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMaterialId(m.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                          : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{m.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Active Material Card */}
              {(() => {
                const activeMat =
                  fuelData.materials.find((m) => m.id === selectedMaterialId) || fuelData.materials[0];
                return (
                  <div className="sci-card p-6 bg-slate-900/90 border border-slate-800 rounded-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-400 uppercase font-bold">
                          <span>{activeMat.phase}</span>
                          <span>•</span>
                          <span>{activeMat.thermal_classification}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-0.5">{activeMat.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Composition: {activeMat.composition}
                        </p>
                      </div>

                      <DataClassificationBadge classification={activeMat.data_classification} size="sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                            Tested Geometries in NASA Facilities
                          </span>
                          <span className="text-slate-200">{activeMat.tested_geometries}</span>
                        </div>

                        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                            Ignition Energy & Mechanism
                          </span>
                          <span className="text-slate-200">{activeMat.ignition_conditions}</span>
                        </div>

                        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                            Pyrolysis & Combustion Behavior
                          </span>
                          <span className="text-slate-200 leading-relaxed">{activeMat.pyrolysis_and_burning}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                            Extinction & Flammability Limits
                          </span>
                          <span className="text-slate-200 leading-relaxed">{activeMat.extinction_behavior}</span>
                        </div>

                        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                            Supporting NASA Flight Experiments
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {activeMat.supporting_experiments.map((exp, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 font-mono text-[10px] border border-sky-500/30"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-bold block">
                            Verified Citation
                          </span>
                          <span className="text-slate-300 font-mono text-[11px]">{activeMat.citation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Material Safety Disclaimer */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-start space-x-3">
                <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{fuelData.material_safety_disclaimer}</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION D: OXYGEN AND AIRFLOW ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'OXYGEN_AIRFLOW' && oxygenData && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="sci-card p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold">
                    <span>SECTION D</span>
                    <span>•</span>
                    <span>ATMOSPHERIC CONCENTRATION & FORCED VENTILATION</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Oxygen Availability and Airflow Dynamics
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Without natural buoyancy, airflow velocity and oxygen concentration are the dual controlling factors
                    dictating microgravity flame growth. Gentle forced airflow (5-10 cm/s) supplies oxidizer to sustain
                    combustion at oxygen levels down to 14.6% O2, while exploration atmospheres (34% O2 at 0.56 atm)
                    significantly accelerate flame spread.
                  </p>
                </div>
                <DataClassificationBadge classification="VERIFIED_MEASURED" size="sm" />
              </div>

              {/* Exploration Atmosphere Callout Card */}
              <div className="sci-card p-5 bg-slate-900/90 border border-sky-500/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-sky-400" />
                    <span>EXPLORATION ATMOSPHERE DISCOVERY (SAFFIRE-IV)</span>
                  </span>
                  <DataClassificationBadge
                    classification={oxygenData.exploration_atmosphere_comparison.data_classification}
                    size="xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
                    <span className="text-slate-400 font-bold block">Standard ISS Atmosphere (101.3 kPa, 21% O₂)</span>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Pressure:</span>
                      <span>101.3 kPa (1.00 atm)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Oxygen Mole Fraction:</span>
                      <span>21.0% O₂</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>SIBAL Flame Spread Rate:</span>
                      <span>1.80 mm/s</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Heat Release Rate:</span>
                      <span>1200 W</span>
                    </div>
                  </div>

                  <div className="p-3 bg-sky-950/30 rounded-lg border border-sky-500/30 space-y-1.5 text-xs font-mono">
                    <span className="text-sky-300 font-bold block">Artemis Exploration Atmosphere (56.5 kPa, 34% O₂)</span>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Pressure:</span>
                      <span>56.5 kPa (0.56 atm)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Oxygen Mole Fraction:</span>
                      <span>34.0% O₂</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>SIBAL Flame Spread Rate:</span>
                      <span>2.40 mm/s (+33% FASTER)</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Heat Release Rate:</span>
                      <span>1400 W (+17% HIGHER)</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                  {oxygenData.exploration_atmosphere_comparison.scientific_insight}
                </p>
              </div>

              {/* Parametric Measured Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Table 1: Oxygen Variation */}
                <div className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-white uppercase">
                      Oxygen % Influence on Spread & Extinction
                    </h3>
                    <DataClassificationBadge classification="VERIFIED_MEASURED" size="xs" />
                  </div>

                  <div className="space-y-2">
                    {oxygenData.oxygen_variation_data.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <span className="text-sky-400 font-bold block">{item.material}</span>
                          <span className="text-[10px] text-slate-400">{item.investigation} • {item.flow_velocity_cms} cm/s flow</span>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400 font-bold block">{item.oxygen_pct}% O₂</span>
                          <span className="text-[11px] text-emerald-400">
                            {item.spread_rate_mms ? `${item.spread_rate_mms} mm/s` : `${item.hot_flame_duration_s}s burn`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table 2: Airflow Variation */}
                <div className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-white uppercase">
                      Airflow Velocity Influence on Spread
                    </h3>
                    <DataClassificationBadge classification="VERIFIED_MEASURED" size="xs" />
                  </div>

                  <div className="space-y-2">
                    {oxygenData.airflow_variation_data.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <span className="text-sky-400 font-bold block">{item.flow_velocity_cms} cm/s Velocity</span>
                          <span className="text-[10px] text-slate-400">{item.material} • {item.flow_type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold block">{item.spread_or_burn_rate}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[140px] block" title={item.behavior_summary}>
                            {item.behavior_summary}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Missing Measurements Registry */}
              <div className="sci-card p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase block">
                  Documented Flight Measurement Gaps
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {oxygenData.missing_measurements.map((m, i) => (
                    <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-slate-300 font-semibold">{m.variable}</span>
                        <DataClassificationBadge classification={m.status} size="xs" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{m.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exploratory Scenario Explorer */}
              <div className="sci-card p-5 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-amber-400 uppercase font-bold">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>THEORETICAL EXPLORATORY SCENARIO SIMULATOR</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      Explore Hypothetical Atmosphere & Gravity Regimes
                    </h3>
                  </div>
                  <DataClassificationBadge classification="MODEL_PREDICTION" size="sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 flex justify-between">
                      <span>Oxygen Concentration:</span>
                      <span className="text-sky-400 font-bold">{scenarioO2.toFixed(1)}%</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={35}
                      step={0.5}
                      value={scenarioO2}
                      onChange={(e) => setScenarioO2(parseFloat(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>10% (Hypoxic)</span>
                      <span>21% (Standard)</span>
                      <span>35% (Artemis EA)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 flex justify-between">
                      <span>Forced Airflow Velocity:</span>
                      <span className="text-sky-400 font-bold">{scenarioVelocity.toFixed(1)} cm/s</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={1}
                      value={scenarioVelocity}
                      onChange={(e) => setScenarioVelocity(parseFloat(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>0 (Quiescent)</span>
                      <span>10 (BASS-II)</span>
                      <span>30 (Cabin Duct)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-300 flex justify-between">
                      <span>Gravity Environment:</span>
                      <span className="text-sky-400 font-bold uppercase">{scenarioGravity}</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1 pt-0.5">
                      {['0g', '0.16g', '0.38g', '1g'].map((g) => (
                        <button
                          key={g}
                          onClick={() => setScenarioGravity(g)}
                          className={`py-1.5 text-xs font-mono font-bold rounded cursor-pointer transition-colors ${
                            scenarioGravity === g
                              ? 'bg-sky-500 text-slate-950'
                              : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scenario Model Output Banner */}
                <div className="p-3 bg-slate-950/90 rounded-lg border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block uppercase">
                      Reduced-Order Model Prediction (PMMA Rod Reference)
                    </span>
                    <span className="text-slate-300">
                      Transport Regime: <span className="text-white font-semibold">{calculatedScenario.regime}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block">EST. SPREAD RATE</span>
                      <span className="text-sm font-bold text-amber-400">
                        ~{calculatedScenario.estimatedSpread} mm/s
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">GRASHOF NO.</span>
                      <span className="text-sm font-bold text-slate-300">
                        {calculatedScenario.grashofEstimate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION E: FLAME EXTINCTION ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'FLAME_EXTINCTION' && extinctionData && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="sci-card p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold">
                    <span>SECTION E</span>
                    <span>•</span>
                    <span>EXTINCTION REGIMES & COOL FLAME SUPPRESSION</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Microgravity Flame Extinction & Fire Suppression Limits
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Flame extinction in microgravity exhibits mechanisms fundamentally distinct from Earth. Without
                    buoyant convection, radiative heat loss from soot and combustion products can quench hot flames,
                    triggering secondary low-temperature cool flames that persist invisibly.
                  </p>
                </div>
                <DataClassificationBadge classification="VERIFIED_MEASURED" size="sm" />
              </div>

              {/* Extinction Mechanisms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {extinctionData.extinction_mechanisms.map((mech, i) => (
                  <div
                    key={i}
                    className="sci-card p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30 font-bold">
                            {mech.primary_investigation}
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5">{mech.regime}</h3>
                        </div>
                        <DataClassificationBadge classification={mech.data_classification} size="xs" />
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {mech.observed_physics}
                      </p>

                      <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                        <span className="text-[10px] text-amber-400 uppercase font-bold block">
                          Verified Flight Telemetry
                        </span>
                        <span className="text-slate-200">{mech.quantitative_evidence}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                      <span className="text-slate-500">CITATION: </span>
                      <span className="text-slate-300">{mech.citation}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suppression Rule Warning */}
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 font-mono font-bold text-amber-400 uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>SCIENTIFIC INTEGRITY LIMITATION</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed font-sans">
                  {extinctionData.suppression_rule_warning}
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION F: SPACECRAFT FIRE-SAFETY INSIGHTS
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'FIRE_SAFETY_INSIGHTS' && insightsData && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="sci-card p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold">
                    <span>SECTION F</span>
                    <span>•</span>
                    <span>EVIDENCE-BASED EXPLORATION GUIDELINES</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Spacecraft Fire-Safety Insights & Mission Relevance
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Translating empirical NASA microgravity combustion discoveries into operational fire-safety
                    principles for ISS, Lunar Gateway, Artemis Base Camp, and Mars transit habitats.
                  </p>
                </div>
                <DataClassificationBadge classification="PUBLISHED_FINDING" size="sm" />
              </div>

              {/* Insights List */}
              <div className="space-y-5">
                {insightsData.insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="sci-card p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-xs font-bold border border-sky-500/30">
                          {ins.id}
                        </span>
                        <h3 className="text-sm font-bold text-white">{ins.question}</h3>
                      </div>
                      <DataClassificationBadge classification={ins.data_classification} size="sm" />
                    </div>

                    {/* Conclusion & Supporting Experiment */}
                    <div className="p-3 bg-sky-950/30 rounded-lg border border-sky-500/20 space-y-1">
                      <span className="text-[10px] font-mono text-sky-400 font-bold uppercase block">
                        Scientific Conclusion
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{ins.conclusion}</p>
                    </div>

                    {/* Measured Facts vs Engineering Interpretation (Strict Separation) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-950/90 rounded-lg border border-emerald-500/30 space-y-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                          Verified Experimental Measurements
                        </span>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {ins.measured_vs_interpreted.measured_facts}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950/90 rounded-lg border border-purple-500/30 space-y-1">
                        <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">
                          Operational Engineering Interpretation
                        </span>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {ins.measured_vs_interpreted.engineering_interpretation}
                        </p>
                      </div>
                    </div>

                    {/* Conditions & Limitations Footer */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono text-slate-400">
                      <div>
                        <span className="text-slate-500">CONDITIONS: </span>
                        <span>{ins.experimental_conditions}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {ins.source_links.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 inline-flex items-center space-x-1"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 flex items-start space-x-3">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{insightsData.disclaimer}</p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SECTION G: INTERACTIVE RESEARCH QUESTION ANALYSIS
          ═══════════════════════════════════════════════════════════════ */}
          {activeSection === 'RESEARCH_QUESTIONS' && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="sci-card p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 font-bold">
                    <span>SECTION G</span>
                    <span>•</span>
                    <span>EVIDENCE RETRIEVAL & SYNTHESIS SYSTEM</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">
                    Interactive Research Question Analysis
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Select a curated scientific research question or enter a custom query. The system searches
                    the indexed NASA Physical Sciences Informatics (PSI) corpus, retrieves verified flight telemetry,
                    compares experiments, and provides source-backed explanations with documented limitations.
                  </p>
                </div>
                <DataClassificationBadge classification="PUBLISHED_FINDING" size="sm" />
              </div>

              {/* Curated Questions Selector */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold block px-1">
                  Curated Research Questions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    { id: 'Q1', q: 'How does airflow influence flame propagation in microgravity?' },
                    { id: 'Q2', q: 'Why is cabin ventilation critical to spacecraft fire safety?' },
                    { id: 'Q3', q: 'What does droplet research reveal about cool flames and extinction?' },
                    { id: 'Q4', q: 'How do material thickness and geometry alter solid fuel flammability?' },
                    { id: 'Q5', q: 'What evidence is missing before applying findings to Moon and Mars?' },
                    { id: 'Q6', q: 'How do exploration atmospheres affect spacecraft fire risk?' }
                  ].map((item) => {
                    const isSelected = selectedQuestionId === item.id && !customQueryInput;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedQuestionId(item.id);
                          setCustomQueryInput('');
                          runQuestionAnalysis(item.id);
                        }}
                        className={`p-3 text-left rounded-xl text-xs font-sans transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 text-white border-sky-500/50 shadow-md'
                            : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-sky-400 font-bold block mb-1">
                          QUESTION {item.id}
                        </span>
                        <span className="font-medium">{item.q}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Query Search Box */}
              <div className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold block">
                  Or Ask a Custom Spacecraft Combustion Research Question
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={customQueryInput}
                      onChange={(e) => setCustomQueryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customQueryInput.trim()) {
                          runQuestionAnalysis(undefined, customQueryInput);
                        }
                      }}
                      placeholder="e.g. How does oxygen concentration alter radiative extinction diameter?"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950 rounded-lg border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (customQueryInput.trim()) {
                        runQuestionAnalysis(undefined, customQueryInput);
                      }
                    }}
                    disabled={questionLoading || !customQueryInput.trim()}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-mono flex items-center justify-center space-x-1.5"
                  >
                    {questionLoading ? (
                      <>
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        <span>ANALYZING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>RUN ANALYSIS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Question Analysis Result Display */}
              {questionLoading ? (
                <div className="sci-card p-10 text-center space-y-3">
                  <Activity className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
                  <p className="text-xs font-mono text-slate-400">
                    Retrieving matching flight records and synthesizing evidence...
                  </p>
                </div>
              ) : questionError ? (
                <div className="sci-card p-6 bg-red-950/30 border border-red-500/40 rounded-xl text-xs text-red-300">
                  {questionError}
                </div>
              ) : questionResult ? (
                <div className="space-y-5">
                  {/* Result Header */}
                  <div className="sci-card p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
                          RESEARCH QUESTION
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">{questionResult.question}</h3>
                      </div>
                      <DataClassificationBadge
                        classification={questionResult.data_integrity_status}
                        size="sm"
                      />
                    </div>

                    {/* Evidence-Supported Explanation */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono text-sky-400 font-bold uppercase block">
                        Evidence-Supported Scientific Explanation
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                        {questionResult.evidence_supported_explanation}
                      </p>
                    </div>
                  </div>

                  {/* Supporting Measurements & Experiments Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Relevant Flight Experiments */}
                    <div className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                      <span className="text-xs font-mono font-bold text-white uppercase block">
                        Relevant Flight Experiments
                      </span>
                      <div className="space-y-2">
                        {questionResult.relevant_experiments.map((exp) => (
                          <div
                            key={exp.id}
                            className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono space-y-1"
                          >
                            <div className="flex justify-between items-baseline">
                              <span className="text-sky-400 font-bold">{exp.name}</span>
                              <span className="text-[10px] text-slate-500">{exp.platform}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Fuel: <span className="text-slate-300">{exp.fuel}</span>
                            </div>
                            {exp.flow && (
                              <div className="text-[10px] text-slate-500">Flow: {exp.flow}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verified Numerical Measurements */}
                    <div className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                      <span className="text-xs font-mono font-bold text-white uppercase block">
                        Supporting Numerical Measurements
                      </span>
                      <div className="space-y-2">
                        {questionResult.available_measurements.length > 0 ? (
                          questionResult.available_measurements.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono flex items-center justify-between"
                            >
                              <div>
                                <span className="text-slate-300 font-semibold block">{m.parameter}</span>
                                <span className="text-[10px] text-slate-500">{m.experiment} • {m.source}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-emerald-400 font-bold block">
                                  {m.value} {m.unit}
                                </span>
                                <DataClassificationBadge classification={m.classification} size="xs" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-slate-950/40 rounded-lg text-xs font-mono text-slate-500 text-center">
                            No discrete numeric measurements indexed for this specific query.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comparisons & Limitations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Comparative Evidence */}
                    <div className="sci-card p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                      <span className="text-xs font-mono font-bold text-sky-400 uppercase block">
                        Cross-Experiment Evidence Comparison
                      </span>
                      {questionResult.cross_experiment_comparison.map((comp, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1 font-sans">
                          <span className="font-mono text-slate-300 font-semibold text-[11px] block">
                            {comp.contrast}
                          </span>
                          <p className="text-slate-400 leading-relaxed text-xs">{comp.finding}</p>
                        </div>
                      ))}
                    </div>

                    {/* Scientific Limitations & Unanswered Questions */}
                    <div className="sci-card p-4 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase block">
                        Limitations & Unanswered Questions
                      </span>
                      <ul className="list-disc list-inside space-y-1.5 text-slate-300 font-sans leading-relaxed">
                        {questionResult.scientific_limitations_and_gaps.map((g, idx) => (
                          <li key={idx}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Source References */}
                  {questionResult.source_references && questionResult.source_references.length > 0 && (
                    <div className="sci-card p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
                      <span className="text-[11px] text-slate-400 uppercase font-bold block">
                        Supporting NASA Literature & NTRS Sources
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {questionResult.source_references.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 inline-flex items-center space-x-1.5 transition-colors"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};
