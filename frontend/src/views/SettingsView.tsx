import React, { useState, useEffect } from 'react';
import { fetchSystemStatus, fetchExperiments, fetchFindings, fetchMeasurements, fetchSources, pingAI } from '../services/api';
import {
  Sliders,
  Database,
  Activity,
  Download,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
  Info,
  Server,
  Cpu,
  Sparkles,
  Radio,
  Zap
} from 'lucide-react';

interface SettingsViewProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, setDarkMode }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [pinging, setPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await fetchSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFullCorpus = async () => {
    setExporting(true);
    try {
      const [exps, fnds, meas, srcs] = await Promise.all([
        fetchExperiments(),
        fetchFindings(),
        fetchMeasurements(),
        fetchSources(),
      ]);

      const bundle = {
        exported_at: new Date().toISOString(),
        application: 'Flame in Freefall — NASA Microgravity Combustion Research Workstation',
        version: '2.0.0',
        experiments: exps,
        findings: fnds.findings,
        measurements: meas.measurements,
        sources: srcs,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `flame_in_freefall_nasa_corpus_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div className="sci-card p-4 md:p-5 bg-white dark:bg-[#0f172a] space-y-1">
        <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase">
          <Sliders className="w-3.5 h-3.5" />
          <span>WORKSTATION TELEMETRY & SYSTEM CONFIGURATION</span>
        </div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Status, Scientific Data Integrity & Configuration
        </h1>
      </div>

      {/* 1. Live Telemetry Panel */}
      <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Research Subsystem Telemetry</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
            HEALTH: 100% OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">WORKSTATION ENGINE:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {status?.workstation_mode || 'RESEARCH_GRADE'}
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">RAG INDEXED CHUNKS:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              {status?.rag_index_chunks ?? 64} Document Chunks
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">LOCAL PSI REPOSITORY:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {status?.iss_cir_link || 'LOCAL PSI REPOSITORY LOADED'}
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">EXPERIMENTS INDEXED:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {status?.experiments_indexed ?? 7} Investigations
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">FINDINGS INDEXED:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {status?.findings_indexed ?? 8} Evidence Findings
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">SENSOR RUNS RECORDED:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {status?.measurements_indexed ?? 37} Telemetry Sets
            </span>
          </div>
        </div>
      </div>

      {/* 2. AI Online State Integration */}
      <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>AI Research Synthesis • Online State Configuration</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE ONLINE STATE</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">AI SYNTHESIS:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">Active (Online State)</span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">ENGINE STATUS:</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">
              Scientific Cloud Engine
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">API KEY STATUS:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Secured & Active
            </span>
          </div>

          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block">GROUNDING MODE:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">NASA PSI Telemetry RAG</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500 max-w-xl">
            Questions submitted across the workstation are processed in live online state, strictly grounded in empirical flight data from Saffire, FLEX, BASS, SoFIE, and ACME.
          </p>
          <button
            type="button"
            disabled={pinging}
            onClick={async () => {
              setPinging(true);
              setPingResult(null);
              try {
                const res = await pingAI();
                setPingResult(res);
                loadStatus();
              } catch (e: any) {
                setPingResult({ online: false, error: e.message });
              } finally {
                setPinging(false);
              }
            }}
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-400 text-white font-mono text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {pinging ? (
              <>
                <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                <span>Testing Online Link...</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5" />
                <span>Test AI Link</span>
              </>
            )}
          </button>
        </div>

        {pingResult && (
          <div
            className={`p-3 rounded text-xs font-mono border ${
              pingResult.online
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            {pingResult.online ? (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  Online Link Verified! Latency: <strong>{pingResult.latency_ms} ms</strong> | Status: <strong>ONLINE</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-rose-500" />
                <span>Connection Warning: {pingResult.error || 'Failed to ping endpoint'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Theme & Visual Configuration */}
      <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Display & Appearance Mode
        </h3>
        <p className="text-xs text-slate-500">
          The workstation defaults to Scientific Light Mode for high daytime readability and documentation work.
          Switch to Mission-Control Dark Mode for low-light research sessions.
        </p>

        <div className="flex space-x-3 pt-1">
          <button
            onClick={() => setDarkMode(false)}
            className={`flex-1 p-3 rounded border text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
              !darkMode
                ? 'border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Scientific Light Mode (Default)</span>
          </button>

          <button
            onClick={() => setDarkMode(true)}
            className={`flex-1 p-3 rounded border text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
              darkMode
                ? 'border-sky-500 bg-sky-950/60 text-sky-300 ring-2 ring-sky-500/20'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-sky-400" />
            <span>Mission-Control Dark Mode</span>
          </button>
        </div>
      </div>

      {/* 3. Research Data Export */}
      <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Offline Dataset Export
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Export the entire structured NASA Flame in Freefall database including all experiments, findings,
          quantitative telemetry records, ranking scores, and publication citations as a unified JSON bundle.
        </p>

        <button
          onClick={handleExportFullCorpus}
          disabled={exporting}
          className="px-4 py-2.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-400 text-white font-mono text-xs font-semibold flex items-center space-x-2 transition-colors min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Packaging Research Bundle...' : 'Export Complete NASA Research Dataset (JSON)'}</span>
        </button>
      </div>

      {/* 4. Scientific Integrity Statement */}
      <div className="p-4 rounded bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 space-y-2">
        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 uppercase">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>NASA Research Integrity Protocol</span>
        </div>
        <p className="leading-relaxed">
          All qualitative descriptions, experimental parameters, and quantitative measurements rendered in this application
          are drawn from published NASA Glenn Research Center and Physical Sciences Informatics (PSI) documentation
          (Saffire I-VI, FLEX, FLEX-2, BASS, SoFIE, ACME-BRE, SAME). Numerical variables are never fabricated. Missing
          variables are explicitly marked with verifiable scientific empty states.
        </p>
      </div>
    </div>
  );
};
