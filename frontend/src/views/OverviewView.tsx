import React from 'react';
import { OverviewData } from '../types';
import {
  FlaskConical,
  FileText,
  BookOpen,
  Activity,
  Layers,
  Flame,
  ArrowRight,
  ShieldAlert,
  Satellite,
  Compass,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface OverviewViewProps {
  data: OverviewData | null;
  loading: boolean;
  onNavigate: (module: string, param?: string) => void;
  onSelectFinding: (id: string) => void;
  onRetry?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  data,
  loading,
  onNavigate,
  onSelectFinding,
  onRetry,
}) => {
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800/80 rounded-lg w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/80 rounded-xl border border-slate-700/60"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-800/80 rounded-xl border border-slate-700/60"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="sci-card p-10 text-center font-mono space-y-4 bg-slate-900/60 border border-slate-800">
        <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-white">NASA Telemetry Offline</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
          The workstation could not connect to the FastAPI backend service on port 8000.
          Verify the backend is active using <code className="text-sky-300">launch_dev.bat</code> or <code className="text-sky-300">py run_workstation.py</code>.
        </p>
        {onRetry && (
          <div className="pt-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  const { stats, research_areas, top_findings, platform_distribution, key_variables, safety_factors } = data;

  return (
    <div className="space-y-8">
      {/* 1. RESEARCH SNAPSHOT (Stat Metric Panels) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Research Corpus Telemetry & Quantitative Index</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {stats.investigations_count} Spaceflight Investigations Indexed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('explore')}
            className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-700/70 shadow-2xl hover:border-sky-500/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase">EXPERIMENTS</span>
              <FlaskConical className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {stats.experiments_count}
            </div>
            <div className="text-xs text-slate-300 mt-2 truncate">
              {stats.investigations_list.join(', ')}
            </div>
          </div>

          <div
            onClick={() => onNavigate('findings')}
            className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-700/70 shadow-2xl hover:border-sky-500/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase">RANKED FINDINGS</span>
              <FileText className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {stats.findings_count}
            </div>
            <div className="text-xs text-slate-300 mt-2">
              Transparent 5-factor scientific ranking
            </div>
          </div>

          <div
            onClick={() => onNavigate('sources')}
            className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-700/70 shadow-2xl hover:border-sky-500/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase">PEER-REVIEWED SOURCES</span>
              <BookOpen className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {stats.papers_count}
            </div>
            <div className="text-xs text-slate-300 mt-2">
              NASA PSI & NTRS publications
            </div>
          </div>

          <div
            onClick={() => onNavigate('explore')}
            className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-700/70 shadow-2xl hover:border-sky-500/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono font-semibold uppercase">SENSOR RUNS</span>
              <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {stats.measurements_count}
            </div>
            <div className="text-xs text-slate-300 mt-2">
              Quantitative published sensors
            </div>
          </div>
        </div>
      </div>

      {/* 2. RESEARCH DOMAIN DISTRIBUTION */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-6 border border-slate-700/70 shadow-2xl">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-sky-400 mb-4 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Core Microgravity Combustion Research Domains</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {research_areas.map((area, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('findings', area.name)}
              className="bg-slate-950/70 hover:bg-slate-800/80 p-4 rounded-xl border border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer group"
            >
              <div className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                {area.name}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                {area.experiment_count} Associated Experiments
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TOP RANKED SCIENTIFIC FINDINGS */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-6 border border-slate-700/70 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>High-Priority Spaceflight Discoveries (Ranked by Evidence & Safety)</span>
          </h3>
          <button
            onClick={() => onNavigate('findings')}
            className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <span>View All ({stats.findings_count})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {top_findings.slice(0, 4).map((f) => (
            <div
              key={f.id}
              onClick={() => onNavigate('findings', f.title)}
              className="bg-slate-950/70 hover:bg-slate-800/70 p-4 rounded-xl border border-slate-800/90 hover:border-sky-500/60 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                    <span className="text-xs font-mono font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40">
                      Score: {f.ranking_score}/100
                    </span>
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {f.investigation}
                    </span>
                    <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {f.platform}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    {f.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                    {f.explanation}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PLATFORMS & SAFETY FACTORS (Two-column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Microgravity Testing Platforms */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-6 border border-slate-700/70 shadow-2xl">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-sky-400 mb-4 flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-sky-400" />
            <span>Flight Research Platforms</span>
          </h3>
          <div className="space-y-3">
            {platform_distribution.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-xs"
              >
                <span className="text-slate-200 font-semibold">{p.platform}</span>
                <span className="bg-sky-500/10 text-sky-300 px-2.5 py-0.5 rounded border border-sky-500/30 font-bold">
                  {p.count} Experiments
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacecraft Fire Safety Factors */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-6 border border-slate-700/70 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Critical Spacecraft Design Rules</span>
            </h3>
            <button
              onClick={() => onNavigate('fire-safety')}
              className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center space-x-1"
            >
              <span>Explore Safety</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {safety_factors.map((sf, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate('fire-safety')}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-400/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {sf.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      sf.risk_level === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {sf.risk_level}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {sf.relevance}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
