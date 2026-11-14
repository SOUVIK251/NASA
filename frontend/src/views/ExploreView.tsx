import React, { useState, useEffect } from 'react';
import { Experiment, Measurement } from '../types';
import { fetchExperiments, fetchMeasurements, compareExperiments } from '../services/api';
import {
  FlaskConical,
  BarChart3,
  Layers,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Download,
  Flame,
  Activity,
  CheckCircle2,
  Columns
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';

export const ExploreView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXPERIMENTS' | 'DATA_EXPLORER' | 'COMPARISON'>('EXPERIMENTS');

  // Experiments state
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [expSearch, setExpSearch] = useState<string>('');
  const [expLoading, setExpLoading] = useState<boolean>(true);
  const [expError, setExpError] = useState<string | null>(null);

  // Data Explorer state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filterExpId, setFilterExpId] = useState<string>('ALL');
  const [filterMaterial, setFilterMaterial] = useState<string>('ALL');
  const [chartMode, setChartMode] = useState<'SPREAD_VS_FLOW' | 'EXTINCTION_VS_O2' | 'BURN_RATE_BY_FUEL'>('SPREAD_VS_FLOW');

  // Comparison state
  const [compareIds, setCompareIds] = useState<string[]>(['EXP-SAFFIRE', 'EXP-FLEX']);
  const [comparisonData, setComparisonData] = useState<Experiment[]>([]);
  const [compareLoading, setCompareLoading] = useState<boolean>(false);

  useEffect(() => {
    loadExperiments();
    loadMeasurements();
  }, []);

  useEffect(() => {
    if (activeTab === 'COMPARISON' && compareIds.length >= 2) {
      loadComparison();
    }
  }, [activeTab, compareIds]);

  const loadExperiments = async () => {
    setExpLoading(true);
    setExpError(null);
    try {
      const data = await fetchExperiments();
      setExperiments(data);
      if (data.length > 0 && !selectedExp) {
        setSelectedExp(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load experiments:', err);
      setExpError(err?.message || 'Failed to connect to NASA experiments API');
    } finally {
      setExpLoading(false);
    }
  };

  const loadMeasurements = async (expId?: string) => {
    try {
      const res = await fetchMeasurements({
        experiment_id: expId !== 'ALL' ? expId : undefined,
      });
      setMeasurements(res.measurements);
    } catch (err) {
      console.error('Failed to load measurements:', err);
    }
  };

  const loadComparison = async () => {
    setCompareLoading(true);
    try {
      const res = await compareExperiments(compareIds);
      setComparisonData(res.experiments);
    } catch (err) {
      console.error('Failed to compare experiments:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  const toggleCompareId = (id: string) => {
    if (compareIds.includes(id)) {
      if (compareIds.length > 2) {
        setCompareIds(compareIds.filter((item) => item !== id));
      }
    } else {
      if (compareIds.length < 4) {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const exportMeasurementsCSV = () => {
    if (measurements.length === 0) return;
    const headers = ['test_id', 'experiment_id', 'fuel_material', 'oxygen_pct', 'pressure_atm', 'flow_velocity_cms', 'temperature_c', 'flame_spread_rate_mms', 'burn_rate', 'extinction_time_s', 'citation'];
    const rows = measurements.map((m) => [
      m.test_id,
      m.experiment_id,
      `"${m.fuel_material}"`,
      m.oxygen_pct ?? '',
      m.pressure_atm ?? '',
      m.flow_velocity_cms ?? '',
      m.temperature_c ?? '',
      m.flame_spread_rate_mms ?? '',
      m.burn_rate ?? '',
      m.extinction_time_s ?? '',
      `"${m.citation}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nasa_microgravity_measurements_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered experiments
  const filteredExps = experiments.filter((e) => {
    const q = expSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.investigation.toLowerCase().includes(q) ||
      e.platform.toLowerCase().includes(q) ||
      e.fuel_or_material.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header & Sub-Tabs */}
      <div className="sci-card p-4 bg-white dark:bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase">
            <span>NASA PHYSICAL SCIENCES INFORMATICS (PSI)</span>
            <span>•</span>
            <span>RESEARCH DATA EXPLORER</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Exploration Suite: Experiments, Data Telemetry & Multi-Mission Comparison
          </h1>
        </div>

        {/* Sub-Tabs Button Group */}
        <div className="flex items-center p-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono">
          <button
            onClick={() => setActiveTab('EXPERIMENTS')}
            className={`px-3 py-1.5 rounded transition-all min-h-[36px] ${
              activeTab === 'EXPERIMENTS'
                ? 'bg-white dark:bg-slate-700 font-bold text-sky-700 dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EXPERIMENTS ({experiments.length})
          </button>
          <button
            onClick={() => setActiveTab('DATA_EXPLORER')}
            className={`px-3 py-1.5 rounded transition-all min-h-[36px] ${
              activeTab === 'DATA_EXPLORER'
                ? 'bg-white dark:bg-slate-700 font-bold text-sky-700 dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            DATA & CHARTS
          </button>
          <button
            onClick={() => setActiveTab('COMPARISON')}
            className={`px-3 py-1.5 rounded transition-all min-h-[36px] ${
              activeTab === 'COMPARISON'
                ? 'bg-white dark:bg-slate-700 font-bold text-sky-700 dark:text-sky-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            COMPARE MISSIONS
          </button>
        </div>
      </div>

      {/* TAB 1: EXPERIMENTS DIRECTORY */}
      {activeTab === 'EXPERIMENTS' && (
        expError ? (
          <div className="sci-card p-10 text-center space-y-4 bg-slate-900/60 border border-slate-800">
            <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-white">NASA Experiments Service Offline</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
              Could not fetch experiments data ({expError}). Ensure the backend server is running on port 8000.
            </p>
            <button
              onClick={loadExperiments}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Experiments Catalog List */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search experiments by name, platform..."
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
                className="w-full text-xs font-mono pl-8 pr-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-2">
              {expLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredExps.length === 0 ? (
                <div className="sci-card p-6 text-center text-xs text-slate-400">
                  No experiments found matching "{expSearch}".
                </div>
              ) : (
                filteredExps.map((exp) => {
                  const isSelected = selectedExp?.id === exp.id;
                  return (
                    <div
                      key={exp.id}
                      onClick={() => setSelectedExp(exp)}
                      className={`sci-card p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 dark:border-sky-400 ring-1 ring-sky-500/20 bg-sky-50/40 dark:bg-sky-950/40'
                          : 'hover:border-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                        <span className="font-bold text-sky-700 dark:text-sky-300 px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950">
                          {exp.investigation}
                        </span>
                        <span>{exp.flight_dates}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {exp.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {exp.platform}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Selected Experiment Detailed Dossier */}
          <div className="lg:col-span-2">
            {selectedExp ? (
              <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-5">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold mb-1">
                    <span>INVESTIGATION DOSSIER: {selectedExp.id}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{selectedExp.status}</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                    {selectedExp.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {selectedExp.objective}
                  </p>
                </div>

                {/* Key Spec Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">PLATFORM & FACILITY:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedExp.platform}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">FUEL / SAMPLE MATERIAL:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedExp.fuel_or_material}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">GRAVITY CONDITION:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedExp.gravity_condition}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">FLIGHT DATES:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedExp.flight_dates || 'Archive'}
                    </span>
                  </div>
                </div>

                {/* Research Areas & Variables Studied */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-1.5">
                    Parameters & Variables Studied
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExp.variables_studied.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Source Note & Integrity */}
                <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-mono">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    NASA RESEARCH CONTEXT:
                  </span>
                  {selectedExp.source_note}
                </div>

                {/* Direct Action to Compare or View Data */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setFilterExpId(selectedExp.id);
                      setActiveTab('DATA_EXPLORER');
                      loadMeasurements(selectedExp.id);
                    }}
                    className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>View Quantitative Data & Charts</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!compareIds.includes(selectedExp.id)) {
                        setCompareIds([...compareIds.slice(0, 3), selectedExp.id]);
                      }
                      setActiveTab('COMPARISON');
                    }}
                    className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Compare with Other Missions</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="sci-card p-12 text-center text-xs font-mono text-slate-400">
                Select an experiment from the catalog to inspect its NASA specifications.
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* TAB 2: SCIENTIFIC DATA EXPLORER & CHARTS */}
      {activeTab === 'DATA_EXPLORER' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="sci-card p-3 bg-white dark:bg-[#0f172a] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">FILTER INVESTIGATION:</span>
              <select
                value={filterExpId}
                onChange={(e) => {
                  setFilterExpId(e.target.value);
                  loadMeasurements(e.target.value);
                }}
                className="py-1 px-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="ALL">All Investigations ({measurements.length} runs)</option>
                {experiments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.investigation} ({e.name})
                  </option>
                ))}
              </select>

              <span className="text-slate-500 ml-2">CHART PLOT:</span>
              <select
                value={chartMode}
                onChange={(e) => setChartMode(e.target.value as any)}
                className="py-1 px-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="SPREAD_VS_FLOW">Flame Spread Rate (mm/s) vs Flow Velocity (cm/s)</option>
                <option value="EXTINCTION_VS_O2">Extinction Time (s) vs Oxygen Conc (%)</option>
                <option value="BURN_RATE_BY_FUEL">Peak Burning Rate by Material</option>
              </select>
            </div>

            <button
              onClick={exportMeasurementsCSV}
              className="px-3 py-1.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center space-x-1 hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Telemetry (CSV)</span>
            </button>
          </div>

          {/* Scientific Chart Canvas */}
          <div className="sci-card p-4 bg-white dark:bg-[#0f172a]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>
                    {chartMode === 'SPREAD_VS_FLOW' && 'Flame Spread Velocity (mm/s) vs Forced Convective Airflow (cm/s)'}
                    {chartMode === 'EXTINCTION_VS_O2' && 'Flame Extinction Time (s) vs Atmospheric Oxygen Concentration (%)'}
                    {chartMode === 'BURN_RATE_BY_FUEL' && 'Measured Burning Rate Constant across NASA Space Test Samples'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  REAL NASA FLIGHT MEASUREMENTS • Saffire (Cygnus), FLEX (CIR-MDCA), BASS (CIR-Glovebox), SoFIE
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'SPREAD_VS_FLOW' ? (
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      type="number"
                      dataKey="flow_velocity_cms"
                      name="Flow Velocity"
                      unit=" cm/s"
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis
                      type="number"
                      dataKey="flame_spread_rate_mms"
                      name="Flame Spread Rate"
                      unit=" mm/s"
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload as Measurement;
                        return (
                          <div className="p-2.5 rounded bg-slate-900 text-white font-mono text-xs shadow-lg border border-slate-700 space-y-1">
                            <div className="text-sky-400 font-bold">{data.run_label}</div>
                            <div>Material: {data.fuel_material}</div>
                            <div>Flow: {data.flow_velocity_cms} cm/s</div>
                            <div>Spread: {data.flame_spread_rate_mms ?? 'N/A'} mm/s</div>
                            <div>O2: {data.oxygen_pct}% | Press: {data.pressure_atm} atm</div>
                            <div className="text-[10px] text-slate-400">{data.citation}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter
                      name="Flame Spread Tests"
                      data={measurements.filter((m) => m.flame_spread_rate_mms !== null && m.flame_spread_rate_mms !== undefined)}
                      fill="#0284c7"
                    />
                  </ScatterChart>
                ) : chartMode === 'EXTINCTION_VS_O2' ? (
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      type="number"
                      dataKey="oxygen_pct"
                      name="Oxygen"
                      unit="%"
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis
                      type="number"
                      dataKey="extinction_time_s"
                      name="Extinction Time"
                      unit=" s"
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <ZAxis range={[70, 70]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload as Measurement;
                        return (
                          <div className="p-2.5 rounded bg-slate-900 text-white font-mono text-xs shadow-lg border border-slate-700 space-y-1">
                            <div className="text-sky-400 font-bold">{data.run_label}</div>
                            <div>Extinction Time: {data.extinction_time_s} s</div>
                            <div>Oxygen: {data.oxygen_pct}%</div>
                            <div>Observation: {data.special_observations}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter
                      name="Extinction Limits"
                      data={measurements.filter((m) => m.extinction_time_s !== null && m.extinction_time_s !== undefined)}
                      fill="#ea580c"
                    />
                  </ScatterChart>
                ) : (
                  <BarChart
                    data={measurements.filter((m) => m.burn_rate !== null && m.burn_rate !== undefined)}
                    margin={{ top: 20, right: 30, bottom: 40, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      dataKey="run_label"
                      stroke="#94a3b8"
                      fontSize={10}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      unit=" mm²/s"
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload as Measurement;
                        return (
                          <div className="p-2.5 rounded bg-slate-900 text-white font-mono text-xs shadow-lg border border-slate-700">
                            <div className="text-sky-400 font-bold">{data.run_label}</div>
                            <div>Burn Rate: {data.burn_rate}</div>
                            <div>Material: {data.fuel_material}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="burn_rate" fill="#0284c7">
                      {measurements.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fuel_material.includes('SIBAL') ? '#0284c7' : entry.fuel_material.includes('Heptane') ? '#d97706' : '#2563eb'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scientific Telemetry Table */}
          <div className="sci-card p-4 bg-white dark:bg-[#0f172a] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Published Quantitative Sensor Telemetry Records ({measurements.length} runs)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                NASA PSI & TECHNICAL REPORT DATASETS
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Test Run ID</th>
                    <th className="p-2.5">Sample / Fuel</th>
                    <th className="p-2.5">Geometry</th>
                    <th className="p-2.5">O2 (%)</th>
                    <th className="p-2.5">Press (atm)</th>
                    <th className="p-2.5">Flow (cm/s)</th>
                    <th className="p-2.5">Spread (mm/s)</th>
                    <th className="p-2.5">Extinct (s)</th>
                    <th className="p-2.5">Scientific Observation</th>
                    <th className="p-2.5">Source / Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {measurements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-2.5 font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                        {m.test_id}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">{m.fuel_material}</td>
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">{m.sample_geometry || 'N/A'}</td>
                      <td className="p-2.5">{m.oxygen_pct ?? 'Data not available'}%</td>
                      <td className="p-2.5">{m.pressure_atm ?? 'Data not available'}</td>
                      <td className="p-2.5">{m.flow_velocity_cms ?? '0.0'}</td>
                      <td className="p-2.5 text-sky-700 dark:text-sky-300 font-bold">
                        {m.flame_spread_rate_mms !== null && m.flame_spread_rate_mms !== undefined
                          ? m.flame_spread_rate_mms
                          : 'Data not available'}
                      </td>
                      <td className="p-2.5">{m.extinction_time_s ?? 'Data not available'}</td>
                      <td className="p-2.5 text-[11px] text-slate-600 dark:text-slate-300 max-w-xs">
                        {m.special_observations}
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-400 max-w-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                            m.data_source_type === 'NASA_TECHNICAL_REPORT'
                              ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                          }`}>
                            {m.data_source_type === 'NASA_TECHNICAL_REPORT' ? 'NASA TP/TM' : 'PSI PUB'}
                          </span>
                          <span className="truncate" title={m.citation}>{m.citation}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPERIMENT COMPARISON */}
      {activeTab === 'COMPARISON' && (
        <div className="space-y-4">
          {/* Comparison Selector Chips */}
          <div className="sci-card p-3 bg-white dark:bg-[#0f172a] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 uppercase">
                Select 2 to 4 Investigations to Compare Side-by-Side:
              </span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">
                {compareIds.length} Selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {experiments.map((exp) => {
                const isChecked = compareIds.includes(exp.id);
                return (
                  <button
                    key={exp.id}
                    onClick={() => toggleCompareId(exp.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center space-x-1.5 ${
                      isChecked
                        ? 'bg-sky-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{exp.investigation} ({exp.name})</span>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          {compareLoading ? (
            <div className="sci-card p-12 text-center text-xs font-mono text-slate-400 animate-pulse">
              Generating scientific cross-investigation comparison matrix...
            </div>
          ) : (
            <div className="sci-card p-4 bg-white dark:bg-[#0f172a] overflow-x-auto">
              <div className="min-w-[700px] border border-slate-200 dark:border-slate-800 rounded divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
                {/* Header Row: Experiment Names */}
                <div className="grid grid-cols-5 bg-slate-100 dark:bg-slate-800/80 p-3 font-bold text-slate-800 dark:text-slate-200">
                  <div className="text-slate-500 uppercase text-[10px]">COMPARISON FIELD</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-sky-700 dark:text-sky-300">
                      {exp.investigation}
                      <div className="text-[10px] text-slate-500 font-normal">{exp.name}</div>
                    </div>
                  ))}
                </div>

                {/* Row 1: Objective */}
                <div className="grid grid-cols-5 p-3 items-start">
                  <div className="text-slate-500 font-semibold text-[11px]">Primary Objective</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-slate-700 dark:text-slate-300 pr-2">
                      {exp.objective}
                    </div>
                  ))}
                </div>

                {/* Row 2: Spacecraft Platform */}
                <div className="grid grid-cols-5 p-3 items-start bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500 font-semibold text-[11px]">Platform & Facility</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-slate-800 dark:text-slate-200 pr-2">
                      {exp.platform}
                    </div>
                  ))}
                </div>

                {/* Row 3: Fuel / Sample Materials */}
                <div className="grid grid-cols-5 p-3 items-start">
                  <div className="text-slate-500 font-semibold text-[11px]">Fuels & Test Materials</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-slate-800 dark:text-slate-200 pr-2 font-medium">
                      {exp.fuel_or_material}
                    </div>
                  ))}
                </div>

                {/* Row 4: Gravity Regime */}
                <div className="grid grid-cols-5 p-3 items-start bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500 font-semibold text-[11px]">Gravity Regime</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {exp.gravity_condition}
                    </div>
                  ))}
                </div>

                {/* Row 5: Airflow Regime */}
                <div className="grid grid-cols-5 p-3 items-start">
                  <div className="text-slate-500 font-semibold text-[11px]">Airflow Regime</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-slate-700 dark:text-slate-300 pr-2">
                      {exp.id.includes('FLEX')
                        ? 'Quiescent droplet (0 cm/s)'
                        : exp.id.includes('SAFFIRE')
                        ? 'Large forced flow duct (20 - 25 cm/s)'
                        : 'Opposed & concurrent low-speed flow (0.6 - 5.5 cm/s)'}
                    </div>
                  ))}
                </div>

                {/* Row 6: Oxygen & Atmospheres */}
                <div className="grid grid-cols-5 p-3 items-start bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500 font-semibold text-[11px]">Atmosphere Parameters</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-slate-700 dark:text-slate-300 pr-2">
                      {exp.id.includes('SAFFIRE')
                        ? 'Standard 21% O2 (1.0 atm) & Artemis 34% O2 (0.56 atm)'
                        : '15% to 21% O2 with N2 & CO2 inerting'}
                    </div>
                  ))}
                </div>

                {/* Row 7: Major Fire Safety Impact */}
                <div className="grid grid-cols-5 p-3 items-start">
                  <div className="text-slate-500 font-semibold text-[11px]">Fire Safety Insight</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-amber-700 dark:text-amber-400 pr-2 font-medium">
                      {exp.id.includes('FLEX')
                        ? 'Low-temperature cool flames continue invisibly after visible flame extinction; produces toxic CO.'
                        : exp.id.includes('SAFFIRE')
                        ? 'Cabin depressurization reduces large-scale flame spread velocity by 30-45%; scale matters.'
                        : 'Low convective flow enables combustion at lower O2 limits than normal Earth gravity.'}
                    </div>
                  ))}
                </div>

                {/* Row 8: Data Records Count */}
                <div className="grid grid-cols-5 p-3 items-start bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="text-slate-500 font-semibold text-[11px]">Quantitative Test Runs</div>
                  {comparisonData.map((exp) => (
                    <div key={exp.id} className="text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                      {exp.measurement_count ?? 4} recorded telemetry runs
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
