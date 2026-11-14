import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Flame,
  FlaskConical,
  Wind,
  Layers,
  BarChart2,
  ShieldAlert,
  Moon,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Search,
  Zap,
  Globe,
  Radio,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { SimulatorContextData, AIQueryResult } from '../../types';
import { queryAIAnalyst, explainSimulatorExperiment } from '../../services/api';

interface SimulatorAIAnalystPanelProps {
  simulatorContext: SimulatorContextData;
  isDark: boolean;
  onOpenFullAnalyst?: () => void;
  defaultAction?: string;
}

export const SimulatorAIAnalystPanel: React.FC<SimulatorAIAnalystPanelProps> = ({
  simulatorContext,
  isDark,
  onOpenFullAnalyst,
  defaultAction = 'understand_happening'
}) => {
  const [activeAction, setActiveAction] = useState<string>(defaultAction);
  const [explanationLevel, setExplanationLevel] = useState<'beginner' | 'advanced'>('beginner');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AIQueryResult | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [aiMode, setAiMode] = useState<'online' | 'local'>('online');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // 7 Contextual Actions
  const actions = [
    { id: 'understand_happening', label: 'Understand What Is Happening', icon: Sparkles, color: 'text-sky-500' },
    { id: 'explain_flame', label: 'Explain This Flame', icon: Flame, color: 'text-amber-500' },
    { id: 'explain_experiment', label: 'Explain This Experiment', icon: FlaskConical, color: 'text-emerald-500' },
    { id: 'compare_earth_microgravity', label: 'Compare Earth vs Microgravity', icon: Layers, color: 'text-cyan-500' },
    { id: 'explain_physics', label: 'Explain the Physics', icon: Cpu, color: 'text-purple-500' },
    { id: 'analyse_measurements', label: 'Analyse Current Measurements', icon: BarChart2, color: 'text-blue-500' },
    { id: 'explain_fire_safety', label: 'Explain Fire Safety Implications', icon: ShieldAlert, color: 'text-red-500' },
    { id: 'connect_moon_mars', label: 'Connect Findings to Moon & Mars', icon: Moon, color: 'text-indigo-500' }
  ];

  // Auto-run explanation when an action button is selected or first loaded
  const executeAction = async (actionId: string, customText?: string) => {
    setActiveAction(actionId);
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await explainSimulatorExperiment(
        actionId,
        simulatorContext,
        customText,
        aiMode,
        explanationLevel
      );
      setResult(res);
    } catch (err: any) {
      console.error('Simulator AI error:', err);
      // Fallback to local mode seamlessly if online failed
      try {
        const localRes = await explainSimulatorExperiment(
          actionId,
          simulatorContext,
          customText,
          'local',
          explanationLevel
        );
        setResult(localRes);
      } catch (localErr: any) {
        setErrorMsg('Simulator AI analysis failed. Local grounded knowledge base is standing by.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;
    executeAction(activeAction, customQuestion.trim());
  };

  // Run initial explanation on mount or experiment change if no result yet
  useEffect(() => {
    if (!result) {
      executeAction('understand_happening');
    }
  }, [simulatorContext.selected_experiment]);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* ── Header Bar ── */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-sky-500/5 via-transparent to-purple-500/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                AI MICROGRAVITY RESEARCH ASSISTANT
              </span>
              <span className="inline-flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>CONNECTED TO 3D SIMULATOR</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              UNDERSTAND WHAT IS HAPPENING
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Explanation Level Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
            <button
              onClick={() => setExplanationLevel('beginner')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                explanationLevel === 'beginner'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Beginner
            </button>
            <button
              onClick={() => setExplanationLevel('advanced')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                explanationLevel === 'advanced'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Advanced Science
            </button>
          </div>

          {/* Online / Local Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
            <button
              onClick={() => setAiMode('online')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center space-x-1 ${
                aiMode === 'online'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Real-time Gemini Generative Synthesis"
            >
              <Zap className="w-3 h-3" />
              <span>Online</span>
            </button>
            <button
              onClick={() => setAiMode('local')}
              className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center space-x-1 ${
                aiMode === 'local'
                  ? 'bg-slate-700 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Local NASA Knowledge Base"
            >
              <Globe className="w-3 h-3" />
              <span>Local</span>
            </button>
          </div>

          {onOpenFullAnalyst && (
            <button
              onClick={onOpenFullAnalyst}
              className="px-3 py-1.5 rounded-lg bg-sky-600/10 hover:bg-sky-600/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Full Analyst Tab</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle section"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Active Telemetry Context Tag Strip */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 py-1 border-b border-slate-100 dark:border-slate-800/80">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold border border-slate-200 dark:border-slate-700">
              {simulatorContext.selected_experiment || 'Physics Sandbox'}
            </span>
            <span>•</span>
            <span>{simulatorContext.fuel_or_material || 'Hydrocarbon'}</span>
            <span>•</span>
            <span>{simulatorContext.gravity_environment || 'ISS Microgravity'}</span>
            {simulatorContext.current_playback_time !== undefined && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  t = {simulatorContext.current_playback_time.toFixed(2)}s
                </span>
              </>
            )}
            {simulatorContext.current_phase && (
              <>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {String(simulatorContext.current_phase).replace(/_/g, ' ')}
                </span>
              </>
            )}
            <span className="ml-auto text-[9px] text-slate-400">
              Provenance: {simulatorContext.data_quality || 'DIGITIZED_NASA_FLIGHT'}
            </span>
          </div>

          {/* ── 7 Contextual Action Buttons ── */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Contextual AI Actions (Click to Run Analysis):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {actions.map((act) => {
                const Icon = act.icon;
                const isSelected = activeAction === act.id;
                return (
                  <button
                    key={act.id}
                    onClick={() => executeAction(act.id)}
                    disabled={loading}
                    className={`p-2.5 rounded-xl border text-left text-xs font-mono font-semibold transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500 text-sky-600 dark:text-sky-300 shadow-sm'
                        : isDark
                        ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${act.color}`} />
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                      )}
                    </div>
                    <span className="line-clamp-2 text-[11px] leading-tight">{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Quick Custom Question Input ── */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Ask the AI Analyst about this flame, sensor telemetry, or fire safety...`}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className={`w-full text-xs font-mono pl-9 pr-3 py-2.5 rounded-xl border outline-none ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-sky-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-sm"
            >
              {loading ? (
                <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ASK AI</span>
                </>
              )}
            </button>
          </form>

          {/* ── AI Response Section ── */}
          {loading ? (
            <div className="p-8 text-center space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/5">
              <div className="animate-spin w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
              <div className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                CORRELATING NASA FLIGHT TELEMETRY & GENERATING SCIENTIFIC DEDUCTION...
              </div>
              <p className="text-[11px] font-mono text-slate-400 max-w-md mx-auto">
                Grounding against NASA Physical Sciences Informatics (PSI), Combustion Integrated Rack data, and peer-reviewed flight reports.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4 pt-1">
              {/* Executive Answer Card */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      EXECUTIVE SYNTHESIS • {result.is_online ? 'ONLINE GEMINI' : 'LOCAL NASA RAG'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                      CONFIDENCE: {result.confidence_score.toFixed(1)}%
                    </span>
                  </div>
                  {result.model_used && (
                    <span className="text-[10px] font-mono text-slate-400">
                      Model: {result.model_used}
                    </span>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-sans leading-relaxed whitespace-pre-line">
                  {result.answer}
                </div>
              </div>

              {/* ── 6-POINT STRUCTURED BREAKDOWN: UNDERSTAND WHAT IS HAPPENING ── */}
              {result.understand_breakdown && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>6-POINT OBSERVATIONAL & SAFETY BREAKDOWN</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {result.understand_breakdown.what_experiment_shows && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold text-sky-600 dark:text-sky-400">
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>1. What the Experiment is Showing</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {result.understand_breakdown.what_experiment_shows}
                        </p>
                      </div>
                    )}

                    {result.understand_breakdown.fuel_behavior && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold text-amber-600 dark:text-amber-400">
                          <Flame className="w-3.5 h-3.5" />
                          <span>2. What the Fuel is Doing</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {result.understand_breakdown.fuel_behavior}
                        </p>
                      </div>
                    )}

                    {result.understand_breakdown.oxygen_transport && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold text-cyan-600 dark:text-cyan-400">
                          <Wind className="w-3.5 h-3.5" />
                          <span>3. How Oxygen Reaches the Reaction Zone</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {result.understand_breakdown.oxygen_transport}
                        </p>
                      </div>
                    )}

                    {result.understand_breakdown.gravity_effects && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold text-purple-600 dark:text-purple-400">
                          <Layers className="w-3.5 h-3.5" />
                          <span>4. How Gravity Affects the Process</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {result.understand_breakdown.gravity_effects}
                        </p>
                      </div>
                    )}

                    {result.understand_breakdown.measurements_indication && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold text-blue-600 dark:text-blue-400">
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>5. What the Measurements Indicate</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {result.understand_breakdown.measurements_indication}
                        </p>
                      </div>
                    )}

                    {result.understand_breakdown.fire_safety_relevance && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center space-x-1.5 font-bold text-red-600 dark:text-red-400">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>6. Spacecraft Fire Safety Significance</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {result.understand_breakdown.fire_safety_relevance}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Advanced Scientific Explanation (Optional Toggle Content) ── */}
              {explanationLevel === 'advanced' && result.advanced_scientific_explanation && (
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>ADVANCED SCIENTIFIC & CHEMICAL KINETICS FORMULATION</span>
                  </div>
                  <p className="text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {result.advanced_scientific_explanation}
                  </p>
                </div>
              )}

              {/* ── Earth vs ISS Comparison Card (if present) ── */}
              {result.earth_vs_iss_comparison && result.earth_vs_iss_comparison.buoyancy_difference && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>EARTH (1g) VS ISS (0g) COMPARISON AUDIT</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-black/30 border border-slate-700/50">
                      <span className="text-slate-400 block font-bold">Buoyancy Differential:</span>
                      <span className="text-slate-200">{result.earth_vs_iss_comparison.buoyancy_difference}</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 border border-slate-700/50">
                      <span className="text-slate-400 block font-bold">Transport Shifts:</span>
                      <span className="text-slate-200">{result.earth_vs_iss_comparison.transport_mechanism_difference}</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 border border-slate-700/50">
                      <span className="text-slate-400 block font-bold">Flame Geometry (Spherical vs Trailing):</span>
                      <span className="text-slate-200">{result.earth_vs_iss_comparison.flame_geometry_difference}</span>
                    </div>
                    <div className="p-2 rounded bg-black/30 border border-slate-700/50">
                      <span className="text-slate-400 block font-bold">Spacecraft Life Safety:</span>
                      <span className="text-slate-200">{result.earth_vs_iss_comparison.spacecraft_implications}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Measurement Provenance Audit ── */}
              {result.measurement_provenance && (
                <div className="p-3 rounded-xl border border-slate-700/60 bg-slate-900/40 space-y-2 text-[10px] font-mono">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-300 uppercase tracking-wider">
                    <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>DATA PROVENANCE & RELIABILITY AUDIT</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-emerald-400 font-bold block">✓ Direct / Cited Measurements:</span>
                      <ul className="list-disc list-inside text-slate-300 text-[10px] space-y-0.5">
                        {result.measurement_provenance.verified_measured?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-sky-400 font-bold block">≈ Calculated / Interpolated:</span>
                      <ul className="list-disc list-inside text-slate-300 text-[10px] space-y-0.5">
                        {result.measurement_provenance.calculated_interpolated?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    {result.measurement_provenance.unavailable_or_unmeasured && result.measurement_provenance.unavailable_or_unmeasured.length > 0 && (
                      <div className="col-span-1 sm:col-span-2 pt-1 border-t border-slate-800">
                        <span className="text-amber-400 font-bold block">⚠ Unmeasured / Unavailable in this Run (Not Fabricated):</span>
                        <ul className="list-disc list-inside text-slate-400 text-[10px] space-y-0.5">
                          {result.measurement_provenance.unavailable_or_unmeasured?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Genuine NASA Research Citations ── */}
              {result.evidence_sources && result.evidence_sources.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>GENUINE NASA RESEARCH CITATIONS</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.evidence_sources.map((src, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-2 ${
                          isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {src.title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {src.authors} ({src.year}) • {src.source_type}
                          </div>
                        </div>
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:text-sky-400 p-1 shrink-0"
                            title="Open verified NASA source link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-slate-400">
              Select one of the contextual actions above to analyze this experiment with NASA AI.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
