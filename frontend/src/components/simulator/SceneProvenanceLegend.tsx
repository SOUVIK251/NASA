import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  Cpu,
  Layers,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProvenanceType } from '../../types';

interface SceneProvenanceLegendProps {
  hideIllustrative: boolean;
  onToggleHideIllustrative: (hide: boolean) => void;
  investigationType?: string;
  isDark?: boolean;
}

export const SceneProvenanceLegend: React.FC<SceneProvenanceLegendProps> = ({
  hideIllustrative,
  onToggleHideIllustrative,
  investigationType = 'DROPLET_COMBUSTION',
  isDark = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden font-sans text-xs ${
        isDark
          ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 shadow-xl backdrop-blur-md'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-md backdrop-blur-md'
      }`}
    >
      {/* Header with Hide Illustrative Toggle */}
      <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-sky-500/10 text-sky-500">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-[11px] tracking-wider uppercase text-slate-900 dark:text-white">
            Visual Layer Legend
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Hide Illustrative Button */}
          <button
            onClick={() => onToggleHideIllustrative(!hideIllustrative)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              hideIllustrative
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
            title="Toggle visibility of purely decorative or unmeasured 3D visual elements"
          >
            {hideIllustrative ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{hideIllustrative ? 'Illustrative Hidden' : 'Hide Illustrative'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={isExpanded ? 'Collapse Legend' : 'Expand Legend'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Legend Rows */}
      {isExpanded && (
        <div className="p-2.5 sm:p-3 space-y-2">
          {/* Active Filter Notice */}
          {hideIllustrative && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-1.5 font-sans leading-snug">
              <EyeOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                <strong>Data-Only Mode Active:</strong> Purely illustrative rendering elements (flame envelope estimates, decorative smoke) are hidden.
              </span>
            </div>
          )}

          {/* Color-Blind Safe Provenance Layers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* 1. Measured (Table) - Solid Border */}
            <div className="flex items-start gap-2 p-1.5 rounded-lg border-2 border-solid border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 block">
                  Measured (Report Table)
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight block">
                  {investigationType === 'SOLID_MATERIAL_COMBUSTION'
                    ? 'Spread rate (0.079 cm/s), sample dimensions'
                    : investigationType === 'LARGE_SCALE_SPACECRAFT_FIRE'
                    ? 'Burn duration (420 s), flame length (40 mm)'
                    : 'Initial diameter D₀, extinction time, LOI limits'}
                </span>
              </div>
            </div>

            {/* 2. Approximated Curve - Long-Dashed Border */}
            <div className="flex items-start gap-2 p-1.5 rounded-lg border-2 border-dashed border-orange-500 bg-orange-500/5 dark:bg-orange-950/20">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-orange-700 dark:text-orange-300 block">
                  Approximated Curve
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight block">
                  {investigationType === 'SOLID_MATERIAL_COMBUSTION'
                    ? 'Flame position vs time (steady spread rate fit)'
                    : 'D(t) diameter shrinkage curve (matches published K)'}
                </span>
              </div>
            </div>

            {/* 3. Calculated - Dotted Border */}
            <div className="flex items-start gap-2 p-1.5 rounded-lg border-2 border-dotted border-blue-500 bg-blue-500/5 dark:bg-blue-950/20">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300 block">
                  Calculated (Algebraic)
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight block">
                  D²(t) = D², Normalized τ, burning rate finite diffs
                </span>
              </div>
            </div>

            {/* 4. Model Prediction - Double Border */}
            <div className="flex items-start gap-2 p-1.5 rounded-lg border-2 border-double border-purple-500 bg-purple-500/5 dark:bg-purple-950/20">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 block">
                  Model Prediction
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight block">
                  PIML trajectory, Grashof envelope scaling
                </span>
              </div>
            </div>

            {/* 5. Illustrative - Hatched / Dimmed */}
            <div
              className={`flex items-start gap-2 p-1.5 rounded-lg border-2 border-dashed border-amber-400 bg-amber-400/10 transition-opacity ${
                hideIllustrative ? 'opacity-40 line-through' : 'opacity-100'
              }`}
            >
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 block">
                  Illustrative (Rendering)
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight block">
                  Flame diameter ratio estimate (~3.4×), ambient glow
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
