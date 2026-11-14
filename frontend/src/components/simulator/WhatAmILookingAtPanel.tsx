import React, { useState } from 'react';
import {
  HelpCircle,
  FlaskConical,
  Flame,
  Wind,
  Gauge,
  Compass,
  Building2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { ProvenanceType } from '../../types';
import { GlossaryTooltip } from './GlossaryTooltip';

export interface WhatAmILookingAtData {
  experimentName: string;
  investigationType: string;
  fuel: string;
  gravity: string;
  gravityM_s2?: number;
  oxygenPct: number;
  pressure: string;
  airflow: string;
  facility: string;
  provenanceTier: ProvenanceType;
  plainLanguageSummary: string;
  fireSafetySignificance: string;
  researcherNote?: string;
  isModeled?: boolean;
}

interface WhatAmILookingAtPanelProps {
  data: WhatAmILookingAtData;
  mode: 'simple' | 'researcher';
  isDark?: boolean;
  onOpenTour?: () => void;
  onOpenExplainers?: (concept?: string) => void;
}

export const WhatAmILookingAtPanel: React.FC<WhatAmILookingAtPanelProps> = ({
  data,
  mode,
  isDark = false,
  onOpenTour,
  onOpenExplainers,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 shadow-xl'
          : 'bg-white border-slate-200/90 shadow-md'
      }`}
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400">
                WHAT AM I LOOKING AT?
              </span>
              <DataProvenanceBadge provenance={data.provenanceTier} size="xs" />
              {data.isModeled && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                  EXPLORATORY MODEL
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {data.experimentName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
              title="Launch 60-Second Guided Tour"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">60s Tour</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-4">
          {/* Primary One-Sentence Plain Language Summary */}
          <div className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-950/30 border border-sky-500/20">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>In Plain Language (What & Why):</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {data.plainLanguageSummary}
            </p>
          </div>

          {/* Key Physical Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 font-mono text-xs">
            {/* Fuel / Material */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                Fuel / Material
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block mt-0.5" title={data.fuel}>
                {data.fuel}
              </span>
            </div>

            {/* Gravity */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                <GlossaryTooltip termKey="grashof_number" mode={mode}>
                  Gravity
                </GlossaryTooltip>
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block mt-0.5">
                {data.gravity}
              </span>
            </div>

            {/* Oxygen % */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                <GlossaryTooltip termKey="limiting_oxygen_index" mode={mode}>
                  Oxygen (O₂)
                </GlossaryTooltip>
              </span>
              <span className="font-semibold text-sky-600 dark:text-sky-400 block mt-0.5">
                {data.oxygenPct.toFixed(1)}% O₂
              </span>
            </div>

            {/* Pressure */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                Pressure
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
                {data.pressure}
              </span>
            </div>

            {/* Airflow */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                <GlossaryTooltip termKey="concurrent_flow" mode={mode}>
                  Airflow
                </GlossaryTooltip>
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">
                {data.airflow}
              </span>
            </div>

            {/* Facility */}
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                <GlossaryTooltip termKey="cir_mdca" mode={mode}>
                  Facility
                </GlossaryTooltip>
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block mt-0.5" title={data.facility}>
                {data.facility}
              </span>
            </div>
          </div>

          {/* Fire Safety Relevance Callout */}
          <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-sans">
              <strong>Spacecraft Fire Safety Implication: </strong>
              {data.fireSafetySignificance}
            </div>
          </div>

          {/* Technical Researcher Note (shown in researcher mode) */}
          {mode === 'researcher' && data.researcherNote && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>[RESEARCHER AEROTHERMAL NOTES]</span>
              </div>
              <p className="leading-relaxed">{data.researcherNote}</p>
            </div>
          )}

          {/* Quick Concept Explainer Links */}
          {onOpenExplainers && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
              <span className="text-slate-400 font-semibold">EXPLORE CORE CONCEPTS:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onOpenExplainers('d2_law')}
                  className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:underline border border-sky-200 dark:border-sky-800"
                >
                  D²-Law Demo
                </button>
                <button
                  onClick={() => onOpenExplainers('cool_flame')}
                  className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:underline border border-blue-200 dark:border-blue-800"
                >
                  Cool Flames Demo
                </button>
                <button
                  onClick={() => onOpenExplainers('buoyancy')}
                  className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:underline border border-purple-200 dark:border-purple-800"
                >
                  Why Flames Are Round
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
