import React from 'react';
import {
  LayoutDashboard,
  FileText,
  FlaskConical,
  Cpu,
  ShieldAlert,
  BookOpen,
  Sliders,
  Flame,
  ChevronRight,
  Database,
  Satellite,
  Beaker
} from 'lucide-react';

interface NavProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  badgeCounts?: {
    findings?: number;
    experiments?: number;
  };
}

export const Sidebar: React.FC<NavProps> = ({ activeModule, setActiveModule, badgeCounts }) => {
  const primaryNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, tag: 'PSI' },
    { id: 'findings', label: 'Findings & Ranks', icon: FileText, count: badgeCounts?.findings || 8 },
    { id: 'explore', label: 'Explore & Data', icon: FlaskConical, count: badgeCounts?.experiments || 7 },
    { id: 'simulator', label: '3D Simulator', icon: Beaker, highlight: false, tag: '3D' },
    { id: 'ai-analyst', label: 'AI Research Analyst', icon: Cpu, highlight: true },
    { id: 'fire-safety', label: 'Fire Safety Insights', icon: ShieldAlert, alert: true },
  ];

  const secondaryNavItems = [
    { id: 'sources', label: 'NASA Sources & NTRS', icon: BookOpen },
    { id: 'settings', label: 'Workstation Telemetry', icon: Sliders },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] select-none h-[calc(100vh-3.5rem)] sticky top-14">
      {/* Workstation Title Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>RESEARCH WORKSTATION</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold">CIR-MDCA</span>
        </div>
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
          <Satellite className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>NASA Glenn Combustion Suite</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Core Research Modules
        </div>
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold border-l-4 border-sky-600 dark:border-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-sky-600 dark:text-sky-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center space-x-1">
                {item.tag && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                    {item.tag}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.count}
                  </span>
                )}
                {item.highlight && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded font-semibold">
                    RAG
                  </span>
                )}
                {item.alert && (
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-semibold">
                    SAFETY
                  </span>
                )}
              </div>
            </button>
          );
        })}

        <div className="pt-4 px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Corpus & Configuration
        </div>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-semibold border-l-4 border-sky-600 dark:border-sky-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500" />
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer telemetry */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex justify-between">
          <span>DATA INTEGRITY:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">NASA PSI & PUBLISHED CORPUS</span>
        </div>
        <div className="flex justify-between">
          <span>CORPUS CHUNKS:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">39 INDEXED</span>
        </div>
      </div>
    </aside>
  );
};

export const MobileBottomNav: React.FC<NavProps> = ({ activeModule, setActiveModule }) => {
  const items = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings', icon: FileText },
    { id: 'explore', label: 'Explore', icon: FlaskConical },
    { id: 'simulator', label: 'Simulator', icon: Beaker },
    { id: 'ai-analyst', label: 'AI Analyst', icon: Cpu },
    { id: 'fire-safety', label: 'Safety', icon: ShieldAlert },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 z-40 px-1 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-1 transition-colors ${
              isActive
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
