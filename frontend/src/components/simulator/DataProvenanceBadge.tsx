import React from 'react';
import {
  CheckCircle2,
  Cpu,
  Layers,
  Eye,
  AlertTriangle,
  Ban,
  HelpCircle,
  Satellite
} from 'lucide-react';
import { ProvenanceType } from '../../types';

interface DataProvenanceBadgeProps {
  provenance: ProvenanceType;
  customLabel?: string;
  size?: 'xs' | 'sm' | 'md';
  showTooltip?: boolean;
}

export const PROVENANCE_INFO: Record<
  ProvenanceType,
  {
    label: string;
    description: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  NASA_MEASURED: {
    label: 'MEASURED (TABLE)',
    description: 'Scalar value taken directly from a cited NASA technical report table (e.g., NASA/TP–2015-216046 Table IX). No transformation beyond unit conversion. Applies to summary-scalar CSVs only.',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-500/30 dark:border-emerald-500/40',
    icon: CheckCircle2,
  },
  DIGITIZED_FROM_PUBLICATION: {
    label: 'DIGITIZED',
    description: 'Value manually traced or extracted from a figure or table in a peer-reviewed publication. Subject to digitization error (~2–5% of range). Only valid when independent digitization from a scanned figure has been performed.',
    bgClass: 'bg-teal-500/10 dark:bg-teal-950/40',
    textClass: 'text-teal-700 dark:text-teal-300',
    borderClass: 'border-teal-500/30 dark:border-teal-500/40',
    icon: Satellite,
  },
  APPROXIMATED_CURVE: {
    label: 'APPROXIMATED CURVE',
    description: 'Time-series curve hand-constructed to be consistent with published burning-rate constants and phase transitions. Reflects the D²-law analytical model, NOT raw sensor scatter. See manifest.json and DATA_NEEDED.md.',
    bgClass: 'bg-orange-500/10 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-500/30 dark:border-orange-500/40',
    icon: AlertTriangle,
  },
  CALCULATED: {
    label: 'CALCULATED',
    description: 'Mathematically derived from other columns using established combustion relations (e.g., D²=D_mm², τ=t/D₀², normalized D²).',
    bgClass: 'bg-blue-500/10 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-500/30 dark:border-blue-500/40',
    icon: Cpu,
  },
  MODEL_PREDICTION: {
    label: 'MODEL PREDICTION',
    description: 'Output of the reduced-order physics engine (Grashof, Spalding B-number, Damköhler) or the PIML regression model. Not a measurement. Uncertainty ≥ 30%.',
    bgClass: 'bg-violet-500/10 dark:bg-violet-950/40',
    textClass: 'text-violet-700 dark:text-violet-300',
    borderClass: 'border-violet-500/30 dark:border-violet-500/40',
    icon: Cpu,
  },
  DERIVED_INTERPOLATED: {
    label: 'DERIVED / INTERPOLATED',
    description: 'Linearly interpolated state between adjacent recorded timestamps. Marked explicitly to prevent treating interpolations as raw telemetry.',
    bgClass: 'bg-sky-500/10 dark:bg-sky-950/40',
    textClass: 'text-sky-700 dark:text-sky-300',
    borderClass: 'border-sky-500/30 dark:border-sky-500/40',
    icon: Layers,
  },
  ILLUSTRATIVE: {
    label: 'ILLUSTRATIVE',
    description: 'Estimated solely for 3D visualization. No sensor data exists for this parameter (e.g., flame_diam_mm, temp_K in FLEX time-series). Toggle to hide.',
    bgClass: 'bg-amber-500/10 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    borderClass: 'border-amber-500/30 dark:border-amber-500/40',
    icon: Eye,
  },
  MODELED_SCENARIO: {
    label: 'MODELED SCENARIO',
    description: 'Computed from Grashof scaling for a gravity environment (Moon/Mars) where no flight combustion data exists. NOT validated against experiment. Exploratory only.',
    bgClass: 'bg-purple-500/10 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-500/30 dark:border-purple-500/40',
    icon: Cpu,
  },
  UNAVAILABLE: {
    label: 'NOT AVAILABLE',
    description: 'This parameter was not recorded, not digitized, or not applicable in this experiment configuration.',
    bgClass: 'bg-slate-500/10 dark:bg-slate-800/40',
    textClass: 'text-slate-500 dark:text-slate-400',
    borderClass: 'border-slate-300 dark:border-slate-700',
    icon: Ban,
  },
};


export const DataProvenanceBadge: React.FC<DataProvenanceBadgeProps> = ({
  provenance,
  customLabel,
  size = 'sm',
  showTooltip = true,
}) => {
  const info = PROVENANCE_INFO[provenance] || PROVENANCE_INFO.UNAVAILABLE;
  const Icon = info.icon;

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-bold rounded-md border tracking-wider uppercase shrink-0 select-none ${sizeClasses} ${info.bgClass} ${info.textClass} ${info.borderClass}`}
      title={showTooltip ? info.description : undefined}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{customLabel || info.label}</span>
    </span>
  );
};
