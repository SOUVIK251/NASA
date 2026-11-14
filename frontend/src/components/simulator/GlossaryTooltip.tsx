import React, { useState } from 'react';
import { HelpCircle, ExternalLink, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { GLOSSARY_TERMS } from './glossaryData';

interface GlossaryTooltipProps {
  termKey: string;
  displayName?: string;
  mode?: 'simple' | 'researcher';
  children?: React.ReactNode;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({
  termKey,
  displayName,
  mode = 'simple',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const entry = GLOSSARY_TERMS[termKey];

  if (!entry) {
    return <span>{children || displayName || termKey}</span>;
  }

  const label = children || displayName || entry.term;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="underline decoration-dotted decoration-sky-400 dark:decoration-sky-500 underline-offset-4 cursor-help font-inherit text-inherit hover:text-sky-600 dark:hover:text-sky-300 transition-colors inline-flex items-center gap-0.5"
        aria-label={`Glossary term: ${entry.term}`}
      >
        <span>{label}</span>
        <HelpCircle className="w-3 h-3 text-sky-500/70 inline-block opacity-75 shrink-0" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 max-w-[90vw] p-3.5 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl text-left text-xs pointer-events-none sm:pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-2">
            <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px] flex items-center gap-1.5 truncate">
              <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>{entry.term}</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shrink-0 uppercase">
              {mode === 'simple' ? 'Simple' : 'Researcher'}
            </span>
          </div>

          {/* Explanation Body */}
          <div className="py-2 space-y-2 text-slate-700 dark:text-slate-300">
            {mode === 'simple' ? (
              <p className="text-xs leading-relaxed font-sans">
                {entry.simpleExplanation}
              </p>
            ) : (
              <p className="text-xs leading-relaxed font-sans">
                {entry.technicalDefinition}
              </p>
            )}

            {entry.formula && mode === 'researcher' && (
              <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-950 font-mono text-[10px] text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-slate-800">
                <code>{entry.formula}</code>
              </div>
            )}

            {/* Fire Safety Relevance */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5 text-[10px] text-amber-700 dark:text-amber-300 leading-snug">
              <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Why it matters:</strong> {entry.safetyRelevance}
              </span>
            </div>

            {/* Citation */}
            {entry.citation && (
              <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                Ref: {entry.citation}
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
};
