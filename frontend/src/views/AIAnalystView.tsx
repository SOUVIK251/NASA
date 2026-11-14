import React, { useState, useEffect } from 'react';
import { AIQueryResult, SimulatorContextData } from '../types';
import { queryAIAnalyst, fetchAIStatus } from '../services/api';
import {
  subscribeSimulatorContext,
  clearSimulatorContext
} from '../services/simulatorContextStore';
import {
  Cpu,
  Search,
  Sparkles,
  ShieldAlert,
  BookOpen,
  FlaskConical,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Compass,
  Zap,
  Globe,
  Radio,
  Layers,
  Flame,
  Wind,
  Moon,
  BarChart2,
  X,
  ArrowRight,
  Database
} from 'lucide-react';

interface AIAnalystViewProps {
  onNavigate?: (module: string, param?: string) => void;
}

export const AIAnalystView: React.FC<AIAnalystViewProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AIQueryResult | null>(null);
  const [aiMode, setAiMode] = useState<'online' | 'local'>('online');
  const [explanationLevel, setExplanationLevel] = useState<'beginner' | 'advanced'>('beginner');
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [simContext, setSimContext] = useState<SimulatorContextData | null>(null);

  // General recommended prompts
  const generalQuestions = [
    'Why are flames spherical in microgravity?',
    'What factors affected flame extinction in FLEX?',
    'How does 34% oxygen affect flame spread in Artemis habitats?',
    'Compare BASS and SAFFIRE fire dynamics.',
    'Why are standard ionization smoke detectors ineffective in microgravity?',
    'How do cool flames persist invisibly after droplet extinction?',
    'Can a candle flame burn without ventilation in zero-g?',
    'Which solid materials exhibit the lowest flammability limits in space?'
  ];

  // 7 Contextual Actions for active 3D simulator context
  const contextualActions = [
    { id: 'explain_flame', label: 'Explain This Flame', icon: Flame, query: 'Explain the flame structure and behavior currently active in the 3D simulation.' },
    { id: 'explain_experiment', label: 'Explain This Experiment', icon: FlaskConical, query: 'Explain the NASA research investigation and test setup loaded in the simulator.' },
    { id: 'compare_earth_microgravity', label: 'Compare Earth vs Microgravity', icon: Layers, query: 'Compare Earth 1g vs Microgravity 0g combustion differences, transport mechanisms, and flame geometry.' },
    { id: 'explain_physics', label: 'Explain the Physics', icon: Cpu, query: 'Explain the governing aerothermal physics, Burke-Schumann diffusion, and dimensionless numbers.' },
    { id: 'analyse_measurements', label: 'Analyse Current Measurements', icon: BarChart2, query: 'Analyse current sensor telemetry and distinguish direct measurements from calculated and illustrative values.' },
    { id: 'explain_fire_safety', label: 'Explain Fire Safety Implications', icon: ShieldAlert, query: 'Explain spacecraft fire safety, low-speed flow hazards, and detection/suppression implications.' },
    { id: 'connect_moon_mars', label: 'Connect to Moon & Mars Missions', icon: Moon, query: 'Connect findings to Artemis Moon and Mars missions, noting partial-gravity research gaps.' }
  ];

  useEffect(() => {
    checkStatus();
    const unsubscribe = subscribeSimulatorContext((ctx) => {
      setSimContext(ctx);
    });
    return () => unsubscribe();
  }, []);

  const checkStatus = async () => {
    try {
      const s = await fetchAIStatus();
      setAiStatus(s);
    } catch (err) {
      console.error('Failed to fetch AI status:', err);
    }
  };

  const handleQuery = async (queryText: string, action?: string) => {
    if (!queryText.trim() || loading) return;
    setQuery(queryText);
    setLoading(true);
    try {
      const res = await queryAIAnalyst(
        queryText,
        aiMode,
        simContext || undefined,
        action,
        explanationLevel
      );
      setResult(res);
      checkStatus();
    } catch (err) {
      console.error('Failed to query AI analyst:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      {/* Module Title Banner */}
      <div className="sci-card p-4 md:p-5 bg-white dark:bg-[#0f172a] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>NASA AI MICROGRAVITY COMBUSTION RESEARCH ASSISTANT</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>AI STATE : ACTIVE</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800">
              ZERO-HALLUCINATION NASA GROUNDED
            </span>
          </div>
        </div>

        <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Scientific Research Assistant & 3D Simulation Analyst
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Authoritative research synthesis grounded in published NASA spaceflight combustion data and peer-reviewed technical reports (Saffire, FLEX, BASS, SoFIE, ACME).
          Seamlessly connected to the active 3D simulator to explain flame physics, sensor measurements, and human space exploration fire safety.
        </p>

        {/* Live Connectivity Strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Research AI Synthesis Engine • Live Uplink Active ({aiStatus?.active_model || 'Gemini'})</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Explanation Level Toggle */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setExplanationLevel('beginner')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  explanationLevel === 'beginner'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Beginner
              </button>
              <button
                type="button"
                onClick={() => setExplanationLevel('advanced')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  explanationLevel === 'advanced'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Advanced Science
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setAiMode('online')}
                className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center space-x-1 ${
                  aiMode === 'online'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => setAiMode('local')}
                className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all flex items-center space-x-1 ${
                  aiMode === 'local'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Local Archive</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active 3D Simulator Context Bridge Banner ── */}
      {simContext && (
        <div className="sci-card p-3.5 bg-gradient-to-r from-sky-500/10 via-slate-900/60 to-purple-500/10 border-sky-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/40">
              <FlaskConical className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase font-bold text-sky-400">
                  LINKED 3D SIMULATOR TELEMETRY
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LIVE CONTEXT
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-x-2">
                <span>{simContext.selected_experiment}</span>
                <span>•</span>
                <span className="text-slate-400">{simContext.fuel_or_material}</span>
                <span>•</span>
                <span className="text-slate-400">{simContext.gravity_environment}</span>
                {simContext.current_playback_time !== undefined && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">t = {simContext.current_playback_time.toFixed(2)}s</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/40 text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>View in 3D Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => clearSimulatorContext()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              title="Detach simulator context (Switch to general mode)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Query Bar */}
      <div className="sci-card p-3 bg-white dark:bg-[#0f172a] space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                simContext
                  ? `Ask about ${simContext.selected_experiment || 'the current flame'} (e.g. 'What is the fuel doing at this timestamp?')...`
                  : "Ask any microgravity combustion question (e.g. 'Why are flames spherical in microgravity?')..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs font-mono pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-semibold font-mono flex items-center space-x-1.5 transition-colors min-h-[44px] shrink-0 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>ANALYZE</span>
              </>
            )}
          </button>
        </form>

        {/* ── Contextual Actions or General Preset Prompt Chips ── */}
        <div>
          {simContext ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-sky-600 dark:text-sky-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Contextual Actions for Current 3D Experiment (Click to Run):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contextualActions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleQuery(act.query, act.id)}
                      className="px-2.5 py-1 rounded text-[11px] font-mono bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 transition-colors text-left cursor-pointer flex items-center space-x-1.5"
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 mb-1.5 flex items-center space-x-1">
                <HelpCircle className="w-3 h-3" />
                <span>Recommended Research Prompts (Click to Run):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {generalQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuery(q)}
                    className="px-2.5 py-1 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/70 text-slate-700 dark:text-slate-300 hover:text-sky-800 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 transition-colors text-left cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RAG Results Display */}
      {loading ? (
        <div className="sci-card p-12 text-center space-y-3 bg-white dark:bg-[#0f172a]">
          <div className="animate-spin w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {aiMode === 'online'
              ? 'ENGAGING ONLINE AI & CORRELATING NASA PSI CORPUS...'
              : 'EXECUTING NASA LOCAL RAG RETRIEVAL...'}
          </div>
          <p className="text-[11px] font-mono text-slate-400 max-w-md mx-auto">
            Retrieving NASA flight datasets (Saffire, FLEX, BASS, SoFIE), scoring cross-investigation relevance, and synthesizing evidence-grounded scientific deduction.
          </p>
        </div>
      ) : result ? (
        <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-5 animate-in fade-in">
          {/* Top Status & Confidence Banner */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  result.status === 'EVIDENCE_CONFIRMED'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {result.status}
              </span>

              {result.is_online ? (
                <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/40 font-bold">
                  <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                  <span>ONLINE AI</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  <span>LOCAL DATABASE</span>
                </span>
              )}

              {result.action_taken && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold uppercase">
                  Action: {result.action_taken.replace(/_/g, ' ')}
                </span>
              )}

              <span className="text-xs font-mono text-slate-500">
                Corroborated across {result.retrieved_chunks_count} NASA evidence records
              </span>
            </div>

            {result.confidence_score > 0 && (
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-500">Scientific Confidence:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {result.confidence_score.toFixed(1)}%
                </span>
                <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded"
                    style={{ width: `${result.confidence_score}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Primary Scientific Answer */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase font-bold text-sky-600 dark:text-sky-400 tracking-wider">
              ANSWER ({result.is_online ? 'LIVE AI SYNTHESIS • NASA PSI GROUNDED' : 'SYNTHESIZED FROM NASA PSI TELEMETRY'})
            </div>
            <div className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans font-medium whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {result.answer}
            </div>
          </div>

          {/* ── 2. UNDERSTAND WHAT IS HAPPENING (6-Point Breakdown) ── */}
          {result.understand_breakdown && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>UNDERSTAND WHAT IS HAPPENING (6-POINT BREAKDOWN)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.understand_breakdown.what_experiment_shows && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
                    <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center space-x-1.5">
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>1. What the Experiment is Showing</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {result.understand_breakdown.what_experiment_shows}
                    </div>
                  </div>
                )}

                {result.understand_breakdown.fuel_behavior && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      <span>2. What the Fuel is Doing</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {result.understand_breakdown.fuel_behavior}
                    </div>
                  </div>
                )}

                {result.understand_breakdown.oxygen_transport && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center space-x-1.5">
                      <Wind className="w-3.5 h-3.5" />
                      <span>3. How Oxygen Reaches the Reaction Zone</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {result.understand_breakdown.oxygen_transport}
                    </div>
                  </div>
                )}

                {result.understand_breakdown.gravity_effects && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
                    <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>4. How Gravity Affects the Combustion Process</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {result.understand_breakdown.gravity_effects}
                    </div>
                  </div>
                )}

                {result.understand_breakdown.measurements_indication && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
                    <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>5. What the Measurements Indicate</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {result.understand_breakdown.measurements_indication}
                    </div>
                  </div>
                )}

                {result.understand_breakdown.fire_safety_relevance && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1">
                    <div className="font-bold text-red-600 dark:text-red-400 flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>6. Spacecraft Fire Safety Implications</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {result.understand_breakdown.fire_safety_relevance}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 3. Optional Advanced Scientific Explanation ── */}
          {result.advanced_scientific_explanation && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>ADVANCED SCIENTIFIC & CHEMICAL KINETICS FORMULATION</span>
              </div>
              <p className="font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {result.advanced_scientific_explanation}
              </p>
            </div>
          )}

          {/* ── 4. Earth vs ISS Comparison Card ── */}
          {result.earth_vs_iss_comparison && result.earth_vs_iss_comparison.buoyancy_difference && (
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>EARTH (1g) VS ISS (0g) COMPARISON AUDIT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-white/60 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-bold">Buoyancy Differential:</span>
                  <span className="text-slate-800 dark:text-slate-200">{result.earth_vs_iss_comparison.buoyancy_difference}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/60 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-bold">Transport Shifts:</span>
                  <span className="text-slate-800 dark:text-slate-200">{result.earth_vs_iss_comparison.transport_mechanism_difference}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/60 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-bold">Flame Geometry (Spherical vs Trailing):</span>
                  <span className="text-slate-800 dark:text-slate-200">{result.earth_vs_iss_comparison.flame_geometry_difference}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/60 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-bold">Spacecraft Life Safety:</span>
                  <span className="text-slate-800 dark:text-slate-200">{result.earth_vs_iss_comparison.spacecraft_implications}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. Measurement Provenance Audit ── */}
          {result.measurement_provenance && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-[10px] font-mono">
              <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
                <span>DATA PROVENANCE & RELIABILITY AUDIT</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">✓ Direct / Cited Measurements:</span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-[10px] space-y-0.5">
                    {result.measurement_provenance.verified_measured?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-sky-600 dark:text-sky-400 font-bold block">≈ Calculated / Interpolated:</span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 text-[10px] space-y-0.5">
                    {result.measurement_provenance.calculated_interpolated?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                {result.measurement_provenance.unavailable_or_unmeasured && result.measurement_provenance.unavailable_or_unmeasured.length > 0 && (
                  <div className="col-span-1 sm:col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-amber-600 dark:text-amber-400 font-bold block">⚠ Unmeasured / Unavailable in this Run (Not Fabricated):</span>
                    <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-[10px] space-y-0.5">
                      {result.measurement_provenance.unavailable_or_unmeasured?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. NASA Documented Findings (Exact Quotes) */}
          {result.nasa_documented_findings && result.nasa_documented_findings.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>NASA DOCUMENTED FINDINGS</span>
              </div>
              <div className="space-y-2">
                {result.nasa_documented_findings.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200">{f.title}</div>
                    <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {f.explanation}
                    </div>
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 pt-1">
                      Evidence: {f.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. AI Interpretation (Clearly demarcated) */}
          <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border-l-4 border-sky-500 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-1">
            <div className="text-[10px] font-mono font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
              SCIENTIFIC ANALYSIS & AEROTHERMAL DEDUCTION
            </div>
            <p>{result.ai_interpretation}</p>
          </div>

          {/* 8. Potential Future Mission Relevance */}
          {result.potential_mission_relevance && result.potential_mission_relevance.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>POTENTIAL FUTURE MISSION RELEVANCE (ARTEMIS / LUNAR GATEWAY / MARS)</span>
              </div>
              <div className="space-y-1.5">
                {result.potential_mission_relevance.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2"
                  >
                    <span className="font-mono text-amber-600 font-bold">{idx + 1}.</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Related Experiments & Source Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {/* Related Experiments */}
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1.5 flex items-center space-x-1">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>RELATED NASA EXPERIMENTS</span>
              </div>
              <div className="space-y-1.5">
                {result.related_experiments && result.related_experiments.length > 0 ? (
                  result.related_experiments.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    >
                      <div className="font-bold text-sky-700 dark:text-sky-300">{exp.name}</div>
                      <div className="text-[10px] text-slate-500">{exp.platform} • {exp.investigation}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] font-mono text-slate-500 italic p-2">
                    Multi-investigation microgravity combustion principles.
                  </div>
                )}
              </div>
            </div>

            {/* Source Documents */}
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400 mb-1.5 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>SUPPORTING PUBLICATIONS & REPORTS</span>
              </div>
              <div className="space-y-1.5">
                {result.evidence_sources && result.evidence_sources.length > 0 ? (
                  result.evidence_sources.map((paper, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs font-mono flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {paper.title}
                        </div>
                        <div className="text-[10px] text-slate-500">{paper.authors} ({paper.year})</div>
                      </div>
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-600 dark:text-sky-400 hover:text-sky-500 p-1 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] font-mono text-slate-500 italic p-2">
                    NASA Glenn Research Center Combustion Integrated Rack archives.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sci-card p-12 text-center space-y-3 bg-white dark:bg-[#0f172a]">
          <Compass className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Awaiting Research Query
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-mono">
            {simContext
              ? `Connected to ${simContext.selected_experiment}. Click any contextual action above or type a specific question about this simulation.`
              : 'Type any combustion or spaceflight question, or click one of the recommended prompts above. The AI synthesis engine will synthesize evidence-grounded answers in online state.'}
          </p>
        </div>
      )}
    </div>
  );
};
