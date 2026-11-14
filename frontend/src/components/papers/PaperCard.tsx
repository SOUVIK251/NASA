import React from 'react';
import { Paper } from '../../types';
import { Calendar, ArrowRight, ExternalLink } from 'lucide-react';

export function getTruthfulSourceBadge(sourceType: string, url?: string): { label: string; colorClass: string } {
  const st = (sourceType || '').toLowerCase();
  const u = (url || '').toLowerCase();

  if (st.includes('technical memorandum') || st.includes('technical report') || st.includes('nasa/tm') || u.includes('ntrs.nasa.gov')) {
    return {
      label: 'NASA Technical Report',
      colorClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50'
    };
  }
  if (st.includes('psi') || u.includes('physical-sciences-informatics')) {
    return {
      label: 'NASA PSI Record',
      colorClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50'
    };
  }
  if (st.includes('nasa') || u.includes('nasa.gov')) {
    return {
      label: 'NASA Source',
      colorClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700/50'
    };
  }
  if (st.includes('journal') || st.includes('nature') || st.includes('combustion and flame') || st.includes('aiaa') || st.includes('microgravity science')) {
    return {
      label: 'Published Paper',
      colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
    };
  }
  return {
    label: 'Original Source',
    colorClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700/50'
  };
}

interface PaperCardProps {
  paper: Paper;
  onSelect: (paperId: string) => void;
  isDark?: boolean;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onSelect, isDark = true }) => {
  const badgeInfo = getTruthfulSourceBadge(paper.source_type, paper.sourceUrl || paper.url);
  const targetUrl = paper.sourceUrl || paper.url;
  const hasVerifiedSource = !!(targetUrl && targetUrl.trim() && targetUrl !== '#');

  return (
    <div
      onClick={() => onSelect(paper.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(paper.id);
        }
      }}
      data-testid={`paper-card-${paper.id}`}
      className={`sci-card p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:border-sky-500/70 hover:shadow-lg ${
        isDark ? 'bg-slate-900/80 hover:bg-slate-900' : 'bg-white hover:bg-slate-50 shadow-sm'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="sci-badge bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono text-[10px]">
              {paper.investigation}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeInfo.colorClass}`}>
              {badgeInfo.label}
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              ID: {paper.id}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{paper.year}</span>
          </div>
        </div>

        {/* Paper Title */}
        <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-1.5 leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
          {paper.title}
        </h3>

        {/* Authors */}
        <p className="text-xs text-sky-700 dark:text-sky-400 font-mono mb-2">
          {paper.authors}
        </p>

        {/* Abstract Snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans line-clamp-3">
          {paper.abstract}
        </p>
      </div>

      {/* Footer Details & Action */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <span className="text-slate-400 text-[10px] truncate max-w-xs">
          {paper.doi ? `DOI: ${paper.doi}` : 'NASA Document Archive'}
        </span>

        <div className="flex items-center space-x-2">
          {hasVerifiedSource && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 text-xs font-bold font-mono flex items-center space-x-1.5 transition-colors cursor-pointer hover:border-sky-400"
              title="Open verified source document in new tab"
              data-testid={`open-source-link-${paper.id}`}
            >
              <span>Open Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(paper.id);
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold font-mono flex items-center space-x-1 hover:bg-sky-100 dark:hover:bg-sky-900/80 transition-colors cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
