import React, { useState, useEffect } from 'react';
import { HeroScrollBar } from './components/HeroScrollBar';
import { OverviewView } from './views/OverviewView';
import { FindingsView } from './views/FindingsView';
import { ExploreView } from './views/ExploreView';
import { AIAnalystView } from './views/AIAnalystView';
import { FireSafetyView } from './views/FireSafetyView';
import { SourcesView } from './views/SourcesView';
import { SimulatorView } from './views/SimulatorView';
import { FireBehaviourAnalysisView } from './views/FireBehaviourAnalysisView';
import { fetchOverview } from './services/api';
import { OverviewData } from './types';
import {
  Activity,
  Flame,
  FlaskConical,
  Cpu,
  ShieldAlert,
  BookOpen,
  ArrowUp,
  Satellite,
  Beaker
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);

  // Enforce dark mode for aerospace space-science visual aesthetic
  useEffect(() => {
    document.documentElement.classList.add('dark');
    loadOverview();

    // Direct paper-detail URL support (?paper=... or ?paper_id=... or #paper=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paperParam = params.get('paper') || params.get('paper_id') || params.get('source');
      if (paperParam) {
        setActiveModule('sources');
        setSearchQuery(paperParam);
      } else {
        const hashMatch = window.location.hash.match(/(?:#|\/)papers?[\/=]([A-Za-z0-9_-]+)/i);
        if (hashMatch) {
          setActiveModule('sources');
          setSearchQuery(hashMatch[1]);
        }
      }
    }
  }, []);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await fetchOverview();
      setOverviewData(data);
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to load overview data:', err);
      setBackendConnected(false);
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleNavigate = (module: string, param?: string) => {
    if (param) {
      setSearchQuery(param);
    }
    setActiveModule(module);
    const workstation = document.getElementById('research-workstation');
    workstation?.scrollIntoView({ behavior: 'smooth' });
  };

  const navTabs = [
    { id: 'overview', label: 'Overview Snapshot', icon: Activity, count: null },
    { id: 'fire-behaviour', label: 'Fire Behaviour Analysis', icon: Flame, count: null },
    { id: 'findings', label: 'Ranked Findings', icon: Flame, count: overviewData?.stats.findings_count },
    { id: 'explore', label: 'Explore & Compare', icon: FlaskConical, count: overviewData?.stats.experiments_count },
    { id: 'simulator', label: '3D Simulator', icon: Beaker, count: null },
    { id: 'ai-analyst', label: 'AI Space Analyst', icon: Cpu, count: null },
    { id: 'fire-safety', label: 'Fire Safety Rules', icon: ShieldAlert, count: null },
    { id: 'sources', label: 'Research Papers', icon: BookOpen, count: overviewData?.stats.papers_count },
  ];

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. HERO SCROLL BAR SECTION (Takes 100vh full-screen) */}
      <section className="w-screen h-screen overflow-hidden">
        <HeroScrollBar onNavigate={handleNavigate} />
      </section>

      {/* 2. RESEARCH WORKSTATION SECTION (Added AFTER the scroll bar ends, with ISS Cupola background) */}
      <section
        id="research-workstation"
        className="relative min-h-screen text-slate-100 bg-fixed bg-center bg-cover border-t border-sky-500/20 shadow-2xl"
        style={{
          backgroundImage: `url('/iss_cupola_bg.jpg')`,
        }}
      >
        {/* Dark High-Readability Scrim Overlay (ensures all writing is 100% crisp and readable) */}
        <div className="absolute inset-0 bg-[#070b14]/88 backdrop-blur-[2px] pointer-events-none" />

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/90">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-sky-400 uppercase tracking-widest mb-1.5">
                <Satellite className="w-4 h-4 text-sky-400" />
                <span>NASA PHYSICAL SCIENCES INFORMATICS (PSI) • RESEARCH WORKSTATION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Flame in Freefall Analysis Suite
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Quantitative spaceflight microgravity telemetry, transparent 5-factor scientific findings ranking, and exploration cabin fire-safety guidelines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-xs">
              {backendConnected ? (
                <>
                  <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-emerald-500/30 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 font-bold">DATABASE CONNECTED</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-sky-500/30 shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span className="text-sky-300 font-bold">API READY</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-amber-400 font-bold">BACKEND OFFLINE</span>
                  <button
                    onClick={loadOverview}
                    className="ml-2 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[10px] border border-amber-500/40 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Offline Warning Banner */}
          {!backendConnected && !loadingOverview && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs font-mono text-amber-300">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>FastAPI backend at http://127.0.0.1:8000 is offline. Run <code className="bg-amber-900/40 px-1 py-0.5 rounded text-amber-200">launch_dev.bat</code> or <code className="bg-amber-900/40 px-1 py-0.5 rounded text-amber-200">py run_dev.py</code> to connect.</span>
              </div>
              <button
                onClick={loadOverview}
                className="px-3 py-1 bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 font-bold rounded border border-amber-500/50 cursor-pointer shrink-0 ml-3"
              >
                Reconnect
              </button>
            </div>
          )}

          {/* Sticky Navigation Pills Bar */}
          <div className="sticky top-4 z-30 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveModule(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center space-x-2 transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-800 text-sky-400 border border-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Workstation Module Content */}
          <div className="pt-2">
            {activeModule === 'overview' && (
              <OverviewView
                data={overviewData}
                loading={loadingOverview}
                onNavigate={handleNavigate}
                onSelectFinding={(id) => handleNavigate('findings', id)}
                onRetry={loadOverview}
              />
            )}

            {activeModule === 'fire-behaviour' && (
              <FireBehaviourAnalysisView onNavigate={handleNavigate} />
            )}

            {activeModule === 'findings' && (
              <FindingsView initialSearch={searchQuery} />
            )}

            {activeModule === 'explore' && <ExploreView />}

            {activeModule === 'simulator' && (
              <SimulatorView onNavigate={handleNavigate} />
            )}

            {activeModule === 'ai-analyst' && (
              <AIAnalystView onNavigate={handleNavigate} />
            )}

            {activeModule === 'fire-safety' && <FireSafetyView />}

            {activeModule === 'sources' && (
              <SourcesView
                initialPaperId={searchQuery.startsWith('P-') ? searchQuery : undefined}
                onNavigate={handleNavigate}
              />
            )}
          </div>

          {/* Footer with Return to Top button */}
          <div className="pt-12 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div>
              <span>NASA Physical Sciences Informatics (PSI) & NTRS Corpus</span>
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 text-sky-400 hover:text-sky-300 px-4 py-2 rounded-xl border border-slate-700/80 transition-all shadow-xl cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
              <span>RETURN TO ORBITAL FLIGHT SCENE</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
