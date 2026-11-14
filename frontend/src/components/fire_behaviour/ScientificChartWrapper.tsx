import React from 'react';
import { ScientificDataClassification } from '../../types';
import { DataClassificationBadge } from './DataClassificationBadge';
import { ExternalLink, Info, Activity } from 'lucide-react';

interface ScientificChartWrapperProps {
  title: string;
  subtitle?: string;
  xAxisLabel: string;
  xAxisUnit: string;
  yAxisLabel: string;
  yAxisUnit: string;
  experimentSource: string;
  sourceUrl?: string;
  classification: ScientificDataClassification;
  notes?: string;
  children: React.ReactNode;
  height?: number;
  className?: string;
  onLaunchSimulator?: () => void;
}

export const ScientificChartWrapper: React.FC<ScientificChartWrapperProps> = ({
  title,
  subtitle,
  xAxisLabel,
  xAxisUnit,
  yAxisLabel,
  yAxisUnit,
  experimentSource,
  sourceUrl,
  classification,
  notes,
  children,
  height = 320,
  className = '',
  onLaunchSimulator
}) => {
  return (
    <div className={`sci-card p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl flex flex-col justify-between ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <DataClassificationBadge classification={classification} size="sm" />
          {onLaunchSimulator && (
            <button
              onClick={onLaunchSimulator}
              className="text-[10px] font-mono px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded flex items-center space-x-1 cursor-pointer transition-colors"
              title="Open this experiment in the 3D Combustion Simulator"
            >
              <Activity className="w-3 h-3" />
              <span>3D SIMULATOR</span>
            </button>
          )}
        </div>
      </div>

      {/* Axis Units Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 py-2 px-1">
        <div>
          <span className="text-slate-500">Y-AXIS: </span>
          <span className="text-slate-300 font-semibold">{yAxisLabel}</span>
          <span className="text-sky-400 ml-1">[{yAxisUnit}]</span>
        </div>
        <div>
          <span className="text-slate-500">X-AXIS: </span>
          <span className="text-slate-300 font-semibold">{xAxisLabel}</span>
          <span className="text-sky-400 ml-1">[{xAxisUnit}]</span>
        </div>
      </div>

      {/* Main Chart Canvas / Plot Container */}
      <div style={{ height: `${height}px` }} className="w-full my-2">
        {children}
      </div>

      {/* Chart Footer with Source Attribution and Technical Notes */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <span className="text-slate-500">SOURCE:</span>
          <span className="text-slate-200 font-semibold">{experimentSource}</span>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 ml-1 inline-flex items-center"
              title="View NASA citation / DOI"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {notes && (
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 max-w-md">
            <Info className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate" title={notes}>{notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
