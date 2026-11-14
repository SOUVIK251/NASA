import React from 'react';
import { Sun, Moon, Search, Activity, ShieldCheck, Database } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeModule: string;
  onSearchClick: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  activeModule,
  onSearchClick,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur sticky top-0 z-30 px-3 md:px-6 flex items-center justify-between transition-colors">
      {/* Brand & Module Indicator */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {/* Flame in Freefall Icon Badge */}
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-sm text-white font-mono font-bold text-xs tracking-tighter">
            0-g
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Flame in Freefall
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded">
                NASA-PSI WORKSTATION
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden md:block">
              MICROGRAVITY COMBUSTION & FIRE SAFETY RESEARCH SUITE
            </p>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-3 hidden sm:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search experiments, findings, variables (e.g. Saffire, cool flame)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-mono pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Right Telemetry & Controls */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Research Telemetry status pill */}
        <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono px-2.5 py-1 bg-slate-100 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-600 dark:text-slate-300">CIR MDCA / SoFIE:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ONLINE</span>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={onSearchClick}
          aria-label="Search"
          className="sm:hidden p-2 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Visible Light / Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle Theme"
          title={darkMode ? "Switch to Scientific Light Mode (Default)" : "Switch to Mission-Control Dark Mode"}
          className="p-2 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1.5 min-h-[44px] min-w-[44px] justify-center"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-medium hidden md:inline">LIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-mono font-medium hidden md:inline">DARK</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
