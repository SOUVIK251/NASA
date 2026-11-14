import React from 'react';
import { Paper } from '../../types';
import { getTruthfulSourceBadge } from './PaperCard';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  FileText,
  Database,
  Tag,
  AlertCircle,
  FlaskConical,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface PaperDetailsProps {
  paper: Paper;
  onBack: () => void;
  isDark?: boolean;
}

export const PaperDetails: React.FC<PaperDetailsProps> = ({ paper, onBack, isDark = true }) => {
  const targetUrl = paper.sourceUrl || paper.url;
  const hasVerifiedSource = !!(targetUrl && targetUrl.trim() && targetUrl !== '#' && targetUrl.startsWith('http'));
  const badgeInfo = getTruthfulSourceBadge(paper.source_type, targetUrl);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* 1. Back Navigation Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
            isDark
              ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
          }`}
          data-testid="return-to-papers-btn"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Return to Research Papers</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400">
          STABLE IDENTIFIER: <strong className="text-sky-400">{paper.id}</strong>
        </span>
      </div>

      {/* 2. Main Paper Details Card */}
      <div className={`sci-card p-6 md:p-8 space-y-6 border ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        {/* Header Metadata Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sci-badge bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-mono text-xs font-bold">
              {paper.investigation}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${badgeInfo.colorClass}`}>
              {badgeInfo.label}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              ID: {paper.id}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Publication Year: {paper.year}</span>
          </div>
        </div>

        {/* Paper Title & Authors */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {paper.title}
          </h1>
          <p className="text-sm text-sky-700 dark:text-sky-400 font-mono font-medium">
            {paper.authors}
          </p>
        </div>

        {/* Publication Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Document Class</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{paper.source_type}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">NASA Investigation</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{paper.investigation}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Flight Experiment ID</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{paper.experiment_id || 'Cross-Disciplinary'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">DOI / Document Identifier</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 break-all">{paper.doi || 'NASA Document Archive'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Repository Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 inline" />
              <span>Verified NASA Record</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Publication Year</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{paper.year}</span>
          </div>
        </div>

        {/* Abstract / Scientific Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-sky-500" />
            <span>Abstract & Research Summary</span>
          </h2>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 leading-relaxed font-sans text-sm text-slate-700 dark:text-slate-300">
            {paper.abstract}
          </div>
        </div>

        {/* Key Topics / Keywords (if available) */}
        {paper.key_topics && paper.key_topics.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-500" />
              <span>Key Topics & Keywords</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {paper.key_topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* NASA Research Notes (if available) */}
        {paper.notes && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
            <span className="font-mono font-bold text-[10px] uppercase block tracking-wider text-amber-600 dark:text-amber-400">
              NASA Research Relevance
            </span>
            <p className="font-sans leading-relaxed">{paper.notes}</p>
          </div>
        )}

        {/* 3. Primary Source Link Action Box */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
              Original Research Documentation
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {hasVerifiedSource
                ? 'Access the original peer-reviewed publication or NASA NTRS document in a new tab.'
                : 'Direct digital link is unavailable for this archival record.'}
            </span>
          </div>

          <div>
            {hasVerifiedSource ? (
              <a
                href={paper.sourceUrl || paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg hover:shadow-sky-500/20 cursor-pointer min-h-[40px]"
                data-testid="open-original-source-link"
              >
                <span>↗ Open Original Source</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            ) : (
              <span
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-mono border border-slate-700 min-h-[40px]"
                data-testid="source-link-unavailable-badge"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Source link unavailable</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
