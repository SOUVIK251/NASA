import React from 'react';
import { Sparkles, Eye, Lightbulb, Compass, Info } from 'lucide-react';
import { computeWhatIsHappening } from './FlameStateEngine';
import { FlameStateDetail } from '../../types';

interface WhatIsHappeningPanelProps {
  investigationType: string;
  state: any;
  meta: any;
  flameState: FlameStateDetail;
  isModelMode?: boolean;
  simResult?: any;
  isDark?: boolean;
}

export const WhatIsHappeningPanel: React.FC<WhatIsHappeningPanelProps> = ({
  investigationType,
  state,
  meta,
  flameState,
  isModelMode = false,
  simResult,
  isDark = false,
}) => {
  const explanation = computeWhatIsHappening(
    investigationType,
    state,
    meta,
    flameState,
    isModelMode,
    simResult
  );

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 font-mono transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            WHAT IS HAPPENING?
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">
          DYNAMIC PHYSICAL INTERPRETATION
        </span>
      </div>

      {/* Primary Dynamic Summary */}
      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed font-medium">
        {explanation.summary}
      </p>

      {/* Observed vs Interpretation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Observed Telemetry Points */}
        <div
          className={`p-3 rounded-xl border space-y-1.5 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">
            <Eye className="w-3.5 h-3.5" />
            <span>Observed in Dataset:</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            {explanation.observed.map((obs, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <span className="text-sky-500 shrink-0 font-bold">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Scientific Interpretation */}
        <div
          className={`p-3 rounded-xl border space-y-1.5 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Aerothermal Interpretation:</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            {explanation.interpretation}
          </p>
        </div>
      </div>
    </div>
  );
};
