import React from 'react';
import { ScientificDataClassification } from '../../types';
import {
  CheckCircle2,
  FileCheck2,
  BookOpen,
  Calculator,
  Cpu,
  AlertTriangle,
  HelpCircle,
  EyeOff
} from 'lucide-react';

interface DataClassificationBadgeProps {
  classification: ScientificDataClassification | string;
  size?: 'xs' | 'sm' | 'md';
  showDescription?: boolean;
  className?: string;
}

export const CLASSIFICATION_CONFIG: Record<
  string,
  {
    label: string;
    shortLabel: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  VERIFIED_MEASURED: {
    label: 'VERIFIED MEASURED',
    shortLabel: 'MEASURED',
    bg: 'bg-emerald-950/70',
    text: 'text-emerald-300',
    border: 'border-emerald-500/50',
    icon: CheckCircle2,
    description: 'Direct sensor measurement extracted from official NASA flight technical reports or flight instrumentation.'
  },
  PROCESSED_MEASURED: {
    label: 'PROCESSED MEASURED',
    shortLabel: 'PROCESSED',
    bg: 'bg-sky-950/70',
    text: 'text-sky-300',
    border: 'border-sky-500/50',
    icon: FileCheck2,
    description: 'Digitized from published peer-reviewed figures or processed through calibrated optical edge-detection algorithms.'
  },
  PUBLISHED_FINDING: {
    label: 'PUBLISHED FINDING',
    shortLabel: 'PUBLISHED',
    bg: 'bg-indigo-950/70',
    text: 'text-indigo-300',
    border: 'border-indigo-500/50',
    icon: BookOpen,
    description: 'Peer-reviewed scientific finding formally published in NASA technical literature or scientific journals.'
  },
  CALCULATED: {
    label: 'CALCULATED',
    shortLabel: 'CALCULATED',
    bg: 'bg-purple-950/70',
    text: 'text-purple-300',
    border: 'border-purple-500/50',
    icon: Calculator,
    description: 'Derived algebraically from verified measurements (e.g. D² = D², spread rate from delta position / delta time).'
  },
  MODEL_PREDICTION: {
    label: 'MODEL PREDICTION',
    shortLabel: 'MODEL',
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-500/50',
    icon: Cpu,
    description: 'Output of analytical physics equations (Grashof, Burke-Schumann, Spalding) or ML model. Not a direct sensor measurement.'
  },
  SYNTHETIC_OR_PLACEHOLDER: {
    label: 'SYNTHETIC / PLACEHOLDER',
    shortLabel: 'SYNTHETIC',
    bg: 'bg-rose-950/70',
    text: 'text-rose-300',
    border: 'border-rose-500/50',
    icon: AlertTriangle,
    description: 'Synthetically generated for testing or illustrative visual display only. Not a valid scientific measurement.'
  },
  UNVERIFIED: {
    label: 'UNVERIFIED',
    shortLabel: 'UNVERIFIED',
    bg: 'bg-slate-900/80',
    text: 'text-slate-400',
    border: 'border-slate-700/60',
    icon: HelpCircle,
    description: 'Reported value lacking formal primary calibration records or corroborating telemetry.'
  },
  UNAVAILABLE: {
    label: 'DATA UNAVAILABLE',
    shortLabel: 'UNAVAILABLE',
    bg: 'bg-zinc-950/80',
    text: 'text-zinc-500',
    border: 'border-zinc-800/80',
    icon: EyeOff,
    description: 'Parameter was not measured or recorded during this flight investigation. Never fabricated.'
  }
};

export const DataClassificationBadge: React.FC<DataClassificationBadgeProps> = ({
  classification,
  size = 'sm',
  showDescription = false,
  className = ''
}) => {
  const normKey = (classification || 'UNVERIFIED').toUpperCase();
  const config = CLASSIFICATION_CONFIG[normKey] || CLASSIFICATION_CONFIG['UNVERIFIED'];
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2'
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  }[size];

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        title={config.description}
        className={`inline-flex items-center font-mono font-bold tracking-wider rounded-md border shadow-sm transition-all ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className={`${iconSizes} shrink-0`} />
        <span>{config.label}</span>
      </span>
      {showDescription && (
        <span className="text-[10px] text-slate-400 mt-1 max-w-xs font-sans leading-tight">
          {config.description}
        </span>
      )}
    </div>
  );
};
