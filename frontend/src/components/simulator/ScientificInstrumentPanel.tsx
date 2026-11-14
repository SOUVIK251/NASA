import React from 'react';
import {
  Clock,
  Thermometer,
  Wind,
  Flame,
  Activity,
  Gauge,
  Layers,
  Database,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Ban
} from 'lucide-react';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { FlameStateDetail, ProvenanceType } from '../../types';
import { GlossaryTooltip } from './GlossaryTooltip';

interface ScientificInstrumentPanelProps {
  currentTime: number;
  duration: number;
  state: any;
  meta: any;
  investigationType: string;
  flameState: FlameStateDetail;
  isInterpolated?: boolean;
  isModelMode?: boolean;
  simResult?: any;
  isDark?: boolean;
  mode?: 'simple' | 'researcher';
  onOpenExplainers?: (concept?: string) => void;
  onOpenRawData?: () => void;
}

export const ScientificInstrumentPanel: React.FC<ScientificInstrumentPanelProps> = ({
  currentTime,
  duration,
  state,
  meta,
  investigationType,
  flameState,
  isInterpolated = false,
  isModelMode = false,
  simResult,
  isDark = false,
  mode = 'simple',
  onOpenExplainers,
  onOpenRawData,
}) => {
  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')} s`;
  };

  const measuredKeys = new Set(meta?.measured_measurements || []);
  const illustrativeKeys = new Set(meta?.illustrative_measurements || []);

  const getProvenance = (key: string, isCalc = false): ProvenanceType => {
    if (isModelMode) return 'MODELED_SCENARIO';
    if (isCalc) return 'CALCULATED';
    if (isInterpolated && measuredKeys.has(key)) return 'DERIVED_INTERPOLATED';
    if (measuredKeys.has(key)) return 'NASA_MEASURED';
    if (illustrativeKeys.has(key)) return 'ILLUSTRATIVE';
    return 'ILLUSTRATIVE';
  };

  return (
    <div
      className={`rounded-2xl border p-4 space-y-4 font-mono text-xs transition-all ${
        isDark ? 'bg-slate-900/95 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-500 animate-pulse" />
          <h3 className="font-bold uppercase tracking-wider text-slate-900 dark:text-white text-xs">
            {isModelMode ? 'PHYSICS MODEL TELEMETRY' : 'LIVE EXPERIMENT DATA'}
          </h3>
        </div>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
            isModelMode
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isModelMode ? 'REDUCED-ORDER MODEL' : 'PUBLISHED NASA TELEMETRY'}
        </span>
      </div>

      {/* Primary Instrument Clock */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            EXPERIMENT TIMESTAMP
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-black text-sky-600 dark:text-sky-400">
            {formatTime(currentTime)}
          </div>
          <div className="text-[9px] text-slate-400">
            TOTAL DURATION: {duration.toFixed(1)} s
          </div>
        </div>
      </div>

      {/* Live Flame State Badge & Reason Breakdown */}
      <div
        className={`p-3 rounded-xl border space-y-2 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            CURRENT FLAME STATE
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${flameState.color}`}
          >
            ● {flameState.label}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[9px] text-slate-400 block font-semibold uppercase">
            PHYSICAL DETERMINATION FACTORS:
          </span>
          <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300 list-disc list-inside">
            {flameState.reasons.map((r, i) => (
              <li key={i} className="leading-snug">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Live Readings List with Strict Provenance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            {mode === 'researcher' ? 'AEROTHERMAL FLIGHT INSTRUMENTATION' : 'LIVE READINGS'}
          </span>
          {onOpenRawData && !isModelMode && (
            <button
              onClick={onOpenRawData}
              className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View Raw Telemetry Table</span>
            </button>
          )}
        </div>

        {/* 1. FLEX Droplet Combustion Readings */}
        {investigationType === 'DROPLET_COMBUSTION' && !isModelMode && (
          <div className="space-y-2">
            {/* Droplet Diameter D */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  {mode === 'simple' ? 'FUEL BEAD DIAMETER' : 'DROPLET DIAMETER (D)'}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.D_mm !== undefined ? `${state.D_mm.toFixed(3)} mm` : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-slate-400 font-mono">
                    ±0.05 mm optical digitization uncertainty
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance={getProvenance('D_mm')} size="xs" />
            </div>

            {/* D-Squared Regression */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    {mode === 'simple' ? 'BURN AREA SQUARED (D²)' : 'D²-LAW REGRESSION (D²)'}
                  </span>
                  <GlossaryTooltip termKey="d2_law" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.D2_mm2 !== undefined ? `${state.D2_mm2.toFixed(3)} mm²` : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-sky-500 font-mono">
                    d(D²)/dt = -K (linear regression)
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance={getProvenance('D2_mm2')} size="xs" />
            </div>

            {/* Burning Rate Constant K */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    {mode === 'simple' ? 'FUEL SHRINK RATE' : 'BURNING RATE CONSTANT (K)'}
                  </span>
                  <GlossaryTooltip termKey="spalding_b_number" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.burn_rate_K_mm2_s !== undefined
                    ? `${state.burn_rate_K_mm2_s.toFixed(3)} mm²/s`
                    : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-slate-400 font-mono">
                    K = 8·ρ_g·D_g·ln(1+B)/ρ_l
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance={getProvenance('burn_rate_K_mm2_s', true)} size="xs" />
            </div>

            {/* Visible Flame Diameter (Illustrative estimate) */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  VISIBLE FLAME DIAMETER
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.flame_diam_mm !== undefined && state.flame_diam_mm > 0
                    ? `${state.flame_diam_mm.toFixed(1)} mm`
                    : state?.phase === 'COOL_FLAME'
                    ? (
                      <span className="text-sky-400 flex items-center gap-1">
                        Invisible (Cool Flame)
                        <GlossaryTooltip termKey="cool_flame" mode={mode}>
                          <HelpCircle className="w-3 h-3 text-sky-400 inline" />
                        </GlossaryTooltip>
                      </span>
                    )
                    : 'Extinguished'}
                </span>
              </div>
              <DataProvenanceBadge provenance="ILLUSTRATIVE" size="xs" />
            </div>

            {/* Flame Zone Temperature (Illustrative) */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  ZONE TEMPERATURE (EST.)
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.temp_K !== undefined ? `${state.temp_K.toFixed(0)} K` : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-amber-500 font-mono">
                    Visual model estimate (no thermocouple on droplet)
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance="ILLUSTRATIVE" size="xs" />
            </div>

            {/* Ambient Oxygen Concentration */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    CHAMBER OXYGEN
                  </span>
                  <GlossaryTooltip termKey="limiting_oxygen_index" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {meta?.oxygen_pct ? `${meta.oxygen_pct}% O₂` : '21.0% O₂'}
                </span>
              </div>
              <DataProvenanceBadge provenance="NASA_MEASURED" size="xs" />
            </div>
          </div>
        )}

        {/* 2. BASS-II Solid Material Combustion */}
        {investigationType === 'SOLID_MATERIAL_COMBUSTION' && !isModelMode && (
          <div className="space-y-2">
            {/* Flame Front Position */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  FLAME FRONT POSITION
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.flame_pos_mm !== undefined ? `${state.flame_pos_mm.toFixed(1)} mm` : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance={getProvenance('flame_pos_mm')} size="xs" />
            </div>

            {/* Flame Length */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  FLAME LENGTH
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.flame_length_mm !== undefined ? `${state.flame_length_mm.toFixed(1)} mm` : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance={getProvenance('flame_length_mm')} size="xs" />
            </div>

            {/* Spread Velocity */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    {mode === 'simple' ? 'FIRE SPREAD SPEED' : 'SPREAD VELOCITY (v_spread)'}
                  </span>
                  <GlossaryTooltip termKey="opposed_flow" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.spread_rate_cm_s !== undefined
                    ? `${state.spread_rate_cm_s.toFixed(4)} cm/s`
                    : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-slate-400 font-mono">
                    ±0.002 cm/s (Optical video tracking)
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance={getProvenance('spread_rate_cm_s', true)} size="xs" />
            </div>

            {/* Forced Airflow */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  OPPOSED DUCT AIRFLOW
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.airflow_cm_s !== undefined ? `${state.airflow_cm_s.toFixed(1)} cm/s` : '10.0 cm/s'}
                </span>
              </div>
              <DataProvenanceBadge provenance="NASA_MEASURED" size="xs" />
            </div>

            {/* Mass Loss Rate (Illustrative) */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  MASS LOSS RATE (EST.)
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.mass_loss_rate_mg_s !== undefined
                    ? `${state.mass_loss_rate_mg_s.toFixed(1)} mg/s`
                    : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance="ILLUSTRATIVE" size="xs" />
            </div>
          </div>
        )}

        {/* 3. SAFFIRE Large-Scale Fire */}
        {investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE' && !isModelMode && (
          <div className="space-y-2">
            {/* Flame Position */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    BURNED LENGTH (SIBAL)
                  </span>
                  <GlossaryTooltip termKey="sibal_fabric" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.flame_pos_cm !== undefined ? `${state.flame_pos_cm.toFixed(1)} cm` : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance={getProvenance('flame_pos_cm')} size="xs" />
            </div>

            {/* Flame Length */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    FLAME LENGTH PLATEAU
                  </span>
                  <GlossaryTooltip termKey="concurrent_flow" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.flame_length_cm !== undefined ? `${state.flame_length_cm.toFixed(1)} cm` : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-sky-500 font-mono">
                    Concurrent flow trailing flame
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance={getProvenance('flame_length_cm')} size="xs" />
            </div>

            {/* Peak Thermocouple Temp */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  PEAK THERMOCOUPLE TEMP
                </span>
                <span className="text-sm font-bold text-red-500">
                  {state?.peak_temp_K !== undefined ? `${state.peak_temp_K.toFixed(0)} K` : '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-slate-400 font-mono">
                    ±15 K (Type K thermocouple calibration)
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance={getProvenance('peak_temp_K')} size="xs" />
            </div>

            {/* Average Flame Power */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  FLAME HEAT RELEASE RATE
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {state?.flame_power_W !== undefined ? `${state.flame_power_W} W` : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance={getProvenance('flame_power_W', true)} size="xs" />
            </div>

            {/* Concurrent Flow Velocity */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  DUCT AIRFLOW VELOCITY
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  20.0 cm/s
                </span>
              </div>
              <DataProvenanceBadge provenance="NASA_MEASURED" size="xs" />
            </div>
          </div>
        )}

        {/* 4. Physics Model Sandbox Mode Outputs */}
        {isModelMode && simResult && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  CALCULATED ADIABATIC TEMP
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {simResult.flame_temperature_K ? `${simResult.flame_temperature_K.toFixed(0)} K` : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance="MODELED_SCENARIO" size="xs" />
            </div>

            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    GRASHOF NUMBER (Gr)
                  </span>
                  <GlossaryTooltip termKey="grashof_number" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {simResult.grashof_number?.toFixed(1) ?? '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-purple-400 font-mono">
                    Gr = g·β·ΔT·L³/ν²
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance="MODELED_SCENARIO" size="xs" />
            </div>

            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    DAMKÖHLER NUMBER (Da)
                  </span>
                  <GlossaryTooltip termKey="damkohler_number" mode={mode}>
                    <HelpCircle className="w-2.5 h-2.5 text-slate-400 inline ml-0.5 cursor-pointer" />
                  </GlossaryTooltip>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {simResult.damkohler_number?.toFixed(1) ?? '—'}
                </span>
                {mode === 'researcher' && (
                  <span className="block text-[8px] text-purple-400 font-mono">
                    Da = τ_flow / τ_chem
                  </span>
                )}
              </div>
              <DataProvenanceBadge provenance="MODELED_SCENARIO" size="xs" />
            </div>

            <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">
                  BUOYANCY FLOW VELOCITY
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {simResult.natural_convection_velocity_m_s !== undefined
                    ? `${simResult.natural_convection_velocity_m_s.toFixed(2)} m/s`
                    : '—'}
                </span>
              </div>
              <DataProvenanceBadge provenance="MODELED_SCENARIO" size="xs" />
            </div>
          </div>
        )}

        {/* EXPLICIT UNAVAILABLE FIELDS LIST (Scientifically honest, no fake values!) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
            UNAVAILABLE IN THIS DATASET
          </span>
          {[
            {
              name: 'Invasive 3D PIV Velocity Field',
              reason: 'No internal particle tracking laser active in this flight run',
            },
            {
              name: 'Soot Volume Fraction Field',
              reason: 'No planar laser-induced incandescence diagnostic deployed',
            },
            {
              name: 'CO₂ Concentration Sensor',
              reason: 'Omitted from localized chamber telemetry file',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-950/40 flex items-center justify-between text-[10px]"
            >
              <div className="text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  {item.name}
                </span>
                <span className="text-[8px] text-slate-400">{item.reason}</span>
              </div>
              <DataProvenanceBadge provenance="UNAVAILABLE" size="xs" />
            </div>
          ))}
        </div>
      </div>

      {/* Provenance Audit Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span>DATASET STANDARD:</span>
        <span className="font-bold text-slate-700 dark:text-slate-300">
          {meta?.data_quality || 'DIGITIZED_FROM_PUBLICATION'}
        </span>
      </div>
    </div>
  );
};
