import React, { useState, useEffect } from 'react';
import { Finding, Measurement, Paper } from '../types';
import { fetchFindings, fetchFindingDetail } from '../services/api';
import {
  FileText,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  Flame,
  ShieldAlert,
  ArrowUpDown,
  BookOpen,
  Activity,
  Layers
} from 'lucide-react';

interface FindingsViewProps {
  initialSearch?: string;
  onNavigateExperiment?: (expId: string) => void;
}

export const FindingsView: React.FC<FindingsViewProps> = ({
  initialSearch = '',
  onNavigateExperiment,
}) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedInvestigation, setSelectedInvestigation] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedVariable, setSelectedVariable] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('ranking_desc');
  const [minScore, setMinScore] = useState<number>(0);

  // Inspector modal state
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{
    finding: Finding;
    supporting_measurements: Measurement[];
    supporting_paper?: Paper;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    loadFindings();
  }, [search, selectedInvestigation, selectedArea, selectedVariable, sortBy, minScore]);

  const loadFindings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFindings({
        search: search || undefined,
        investigation: selectedInvestigation !== 'ALL' ? selectedInvestigation : undefined,
        research_area: selectedArea !== 'ALL' ? selectedArea : undefined,
        variable: selectedVariable !== 'ALL' ? selectedVariable : undefined,
        min_score: minScore > 0 ? minScore : undefined,
        sort_by: sortBy,
      });
      setFindings(res.findings);
    } catch (err: any) {
      console.error('Failed to load findings:', err);
      setError(err?.message || 'Failed to connect to NASA findings API');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectFinding = async (id: string) => {
    setSelectedFindingId(id);
    setDetailLoading(true);
    try {
      const res = await fetchFindingDetail(id);
      setDetailData(res);
    } catch (err) {
      console.error('Failed to fetch finding detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedInvestigation('ALL');
    setSelectedArea('ALL');
    setSelectedVariable('ALL');
    setMinScore(0);
    setSortBy('ranking_desc');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Module Title Banner */}
      <div className="sci-card p-4 bg-white dark:bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase">
            <span>NASA PHYSICAL SCIENCES INFORMATICS</span>
            <span>•</span>
            <span>PEER-REVIEWED RESEARCH CATALOG</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Documented Findings & Transparent Ranking System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Every finding is indexed with its supporting flight experiment, experimental conditions, fire safety relevance,
            and an explainable 5-factor scientific ranking formula.
          </p>
        </div>

        {/* Mobile filter trigger */}
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="md:hidden flex items-center justify-center space-x-1.5 px-3 py-2 bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 rounded text-xs font-semibold text-sky-800 dark:text-sky-300 min-h-[44px]"
        >
          <Filter className="w-4 h-4" />
          <span>Filters & Thresholds ({findings.length} results)</span>
        </button>
      </div>

      {/* Filter Control Toolbar (Desktop) */}
      <div className="sci-card p-3 bg-white dark:bg-[#0f172a] hidden md:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search findings, fire hazards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-mono pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Investigation Selector */}
          <div>
            <select
              value={selectedInvestigation}
              onChange={(e) => setSelectedInvestigation(e.target.value)}
              aria-label="Filter by Investigation"
              className="w-full text-xs font-mono py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Investigations</option>
              <option value="SAFFIRE">SAFFIRE (Cygnus cargo vehicle)</option>
              <option value="FLEX">FLEX / FLEX-2 (Droplet combustion)</option>
              <option value="BASS">BASS / BASS-II (Solid fuel low flow)</option>
              <option value="SoFIE">SoFIE (GEL / MIST active)</option>
              <option value="ACME">ACME (Burning Rate Emulator)</option>
              <option value="SAME">SAME (Smoke particle sizing)</option>
            </select>
          </div>

          {/* Research Area Selector */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              aria-label="Filter by Research Area"
              className="w-full text-xs font-mono py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ALL">All Research Areas</option>
              <option value="Flame spread">Flame spread</option>
              <option value="Flame extinction">Flame extinction</option>
              <option value="Material flammability">Material flammability</option>
              <option value="Oxygen concentration">Oxygen concentration</option>
              <option value="Airflow">Airflow dynamics</option>
              <option value="Temperature">Temperature / Preheating</option>
              <option value="Fire suppression">Fire suppression</option>
              <option value="Microgravity effects">Microgravity physics</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort findings by"
              className="w-full text-xs font-mono py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="ranking_desc">Rank: Highest Score First</option>
              <option value="ranking_asc">Rank: Lowest Score First</option>
              <option value="title_asc">Title: A-Z Alphabetical</option>
            </select>
          </div>

          {/* Clear & Result Count */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{findings.length}</span>
            </span>
            <button
              onClick={clearFilters}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Findings Catalog List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="sci-card p-10 text-center space-y-4 bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">NASA Findings Service Offline</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
            Could not fetch findings telemetry ({error}). Ensure the backend server is running on port 8000.
          </p>
          <button
            onClick={loadFindings}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : findings.length === 0 ? (
        <div className="sci-card p-12 text-center space-y-3">
          <Info className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No findings match your selected filter criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting the search terms or clearing investigation filters to inspect the full NASA research catalog.
          </p>
          <button
            onClick={clearFilters}
            className="px-3.5 py-1.5 bg-sky-600 text-white rounded text-xs font-medium hover:bg-sky-500 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {findings.map((finding) => {
            const breakdown = finding.ranking_breakdown;
            const isCritical = finding.ranking_score >= 85;

            return (
              <div
                key={finding.id}
                className="sci-card p-4 md:p-5 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="sci-badge bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        {finding.experiment?.investigation || 'NASA'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {finding.research_area}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {finding.experiment?.platform}
                      </span>
                    </div>

                    {/* Transparent Ranking Score Badge */}
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                          isCritical
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        RANK: {finding.ranking_score.toFixed(1)} / 100
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {breakdown?.rank_tier || 'PEER_REVIEWED'}
                      </span>
                    </div>
                  </div>

                  {/* Finding Title */}
                  <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-2 leading-snug">
                    {finding.title}
                  </h3>

                  {/* Documented Finding Explanation */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                    {finding.explanation}
                  </p>

                  {/* Variables & Conditions */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Variables:</span>
                    {finding.variables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {v}
                      </span>
                    ))}
                  </div>

                  {/* Fire Safety Relevance Callout */}
                  <div className="p-2.5 rounded bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-amber-500 text-xs text-amber-900 dark:text-amber-200 leading-relaxed mb-3">
                    <div className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5 flex items-center space-x-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Fire Safety Relevance</span>
                    </div>
                    {finding.fire_safety_relevance}
                  </div>
                </div>

                {/* Card Footer: Source & Inspection Trigger */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] truncate max-w-md">{finding.evidence_source}</span>
                  </div>

                  <button
                    onClick={() => handleInspectFinding(finding.id)}
                    className="self-end sm:self-auto px-3 py-1.5 rounded bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-semibold flex items-center space-x-1 transition-all min-h-[36px]"
                  >
                    <span>Inspect Evidence & Score Formula</span>
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL & RANKING FORMULA INSPECTION MODAL */}
      {selectedFindingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="sci-card bg-white dark:bg-[#0f172a] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-300 dark:border-slate-700">
            {detailLoading || !detailData ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400 animate-pulse">
                Fetching NASA evidence telemetry & ranking formula...
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 mb-1">
                      <span className="font-bold">FINDING ID: {detailData.finding.id}</span>
                      <span>•</span>
                      <span>EXPERIMENT: {detailData.finding.experiment_id}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {detailData.finding.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedFindingId(null)}
                    aria-label="Close"
                    className="p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 1. Transparent Ranking Formula Breakdown */}
                <div className="p-4 rounded bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Objective Ranking Score Breakdown</span>
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {detailData.finding.ranking_breakdown?.formula || 'Composite Scientific Integrity Index'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        {detailData.finding.ranking_score.toFixed(1)} / 100
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                        {detailData.finding.ranking_breakdown?.rank_tier}
                      </span>
                    </div>
                  </div>

                  {/* Component Progress Bars */}
                  {detailData.finding.ranking_breakdown?.components && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      {Object.entries(detailData.finding.ranking_breakdown.components).map(([key, comp]) => (
                        <div key={key} className="text-xs">
                          <div className="flex justify-between font-mono text-[11px] mb-0.5">
                            <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-bold text-sky-600 dark:text-sky-400">
                              {comp.score} / {comp.max} pts
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded overflow-hidden">
                            <div
                              className="bg-sky-500 h-full rounded"
                              style={{ width: `${(comp.score / comp.max) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                            {comp.rationale}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Experimental Details & Platform Context */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-500">
                    Experimental Environment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">PLATFORM:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {detailData.finding.experiment?.platform}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">FUEL / MATERIAL:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {detailData.finding.experiment?.fuel_or_material}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Future Human Mission Implications */}
                {detailData.finding.mission_implications && detailData.finding.mission_implications.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>Future Mission Safety Considerations (Artemis / Gateway / Mars)</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      {detailData.finding.mission_implications.map((imp, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-sky-500 font-mono">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 4. Supporting Measurements Telemetry */}
                {detailData.supporting_measurements && detailData.supporting_measurements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5 text-sky-500" />
                      <span>Corroborating Quantitative Sensor Telemetry</span>
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded text-xs font-mono">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                          <tr>
                            <th className="p-2">Run ID</th>
                            <th className="p-2">Material</th>
                            <th className="p-2">O2 %</th>
                            <th className="p-2">Press (atm)</th>
                            <th className="p-2">Flow (cm/s)</th>
                            <th className="p-2">Observation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {detailData.supporting_measurements.slice(0, 3).map((m) => (
                            <tr key={m.id} className="text-slate-800 dark:text-slate-200">
                              <td className="p-2 font-bold text-sky-600 dark:text-sky-400">{m.test_id}</td>
                              <td className="p-2 truncate max-w-[120px]">{m.fuel_material}</td>
                              <td className="p-2">{m.oxygen_pct ?? 'N/A'}%</td>
                              <td className="p-2">{m.pressure_atm ?? 'N/A'}</td>
                              <td className="p-2">{m.flow_velocity_cms ?? '0.0'}</td>
                              <td className="p-2 text-[11px] text-slate-500 max-w-[200px] truncate">{m.special_observations}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Supporting NASA Paper / Source */}
                {detailData.supporting_paper && (
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">PRIMARY NASA SOURCE CITATION:</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {detailData.supporting_paper.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {detailData.supporting_paper.authors} ({detailData.supporting_paper.year})
                      </div>
                    </div>
                    {detailData.supporting_paper.url && (
                      <a
                        href={detailData.supporting_paper.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 font-mono text-xs flex items-center space-x-1 hover:bg-sky-200"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MOBILE FILTER BOTTOM SHEET */}
      {mobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm">
          <div className="sci-card bg-white dark:bg-[#0f172a] rounded-t-xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Filter Findings</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filter Controls */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block mb-1 text-slate-500">Investigation</label>
                <select
                  value={selectedInvestigation}
                  onChange={(e) => setSelectedInvestigation(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 min-h-[44px]"
                >
                  <option value="ALL">All Investigations</option>
                  <option value="SAFFIRE">SAFFIRE</option>
                  <option value="FLEX">FLEX / FLEX-2</option>
                  <option value="BASS">BASS / BASS-II</option>
                  <option value="SoFIE">SoFIE</option>
                  <option value="ACME">ACME</option>
                  <option value="SAME">SAME</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-500">Research Area</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 min-h-[44px]"
                >
                  <option value="ALL">All Areas</option>
                  <option value="Flame spread">Flame spread</option>
                  <option value="Flame extinction">Flame extinction</option>
                  <option value="Material flammability">Material flammability</option>
                  <option value="Oxygen concentration">Oxygen concentration</option>
                  <option value="Airflow">Airflow dynamics</option>
                  <option value="Fire suppression">Fire suppression</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-500">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 min-h-[44px]"
                >
                  <option value="ranking_desc">Highest Rank First</option>
                  <option value="ranking_asc">Lowest Rank First</option>
                  <option value="title_asc">Alphabetical Title</option>
                </select>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  onClick={() => {
                    clearFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 min-h-[44px]"
                >
                  Reset
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-2.5 bg-sky-600 text-white font-semibold rounded min-h-[44px]"
                >
                  Apply ({findings.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
