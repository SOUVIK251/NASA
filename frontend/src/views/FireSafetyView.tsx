import React, { useState, useEffect } from 'react';
import { FireSafetyTopic } from '../types';
import { fetchFireSafetyTopics } from '../services/api';
import {
  ShieldAlert,
  Flame,
  Atom,
  Layers,
  Activity,
  CheckCircle2,
  ChevronDown,
  Info,
  Compass,
  AlertTriangle,
  FileCheck,
  Globe
} from 'lucide-react';

export const FireSafetyView: React.FC = () => {
  const [topics, setTopics] = useState<FireSafetyTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string>('flame_spread');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFireSafetyTopics();
      setTopics(data);
      if (data.length > 0) {
        setActiveTopicId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load fire safety topics:', err);
      setError(err?.message || 'Failed to connect to NASA fire safety API');
    } finally {
      setLoading(false);
    }
  };

  const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Module Title Banner */}
      <div className="sci-card p-4 md:p-5 bg-white dark:bg-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SPACE EXPLORATION RISK MITIGATION ARCHITECTURE</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Spacecraft Fire Safety Insights & Human Mission Guidelines
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Converting microgravity combustion physics into operational safety protocols for Lunar Gateway,
            Artemis Base Camp, and Mars transit habitats.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold">
            HIGH SEVERITY DOMAIN
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-slate-400 animate-pulse">
          Loading spacecraft fire safety matrix...
        </div>
      ) : error || !activeTopic ? (
        <div className="sci-card p-10 text-center space-y-4 bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">Fire Safety Data Offline</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
            Could not retrieve exploration fire safety guidelines. Ensure the backend server is running on port 8000.
          </p>
          <button
            onClick={loadTopics}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left Navigation: Topics Selector */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Fire Safety Topics
            </div>
            {topics.map((t) => {
              const isSelected = t.id === activeTopicId;
              const isCritical = t.risk_level === 'CRITICAL';
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTopicId(t.id)}
                  className={`w-full text-left p-3 rounded text-xs font-mono transition-all flex items-center justify-between min-h-[44px] ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-l-4 border-sky-600 dark:border-sky-400 font-bold'
                      : 'sci-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-1">
                    <Flame className={`w-3.5 h-3.5 flex-shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className="truncate">{t.title}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      isCritical
                        ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {t.risk_level}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Topic Detailed Dossier */}
          <div className="lg:col-span-3 space-y-4">
            <div className="sci-card p-5 bg-white dark:bg-[#0f172a] space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mb-1">
                    <span>TOPIC CODE: {activeTopic.id.toUpperCase()}</span>
                    <span>•</span>
                    <span className="font-bold text-red-600 dark:text-red-400">RISK: {activeTopic.risk_level}</span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                    {activeTopic.title}
                  </h2>
                </div>
              </div>

              {/* 1. Underlying Scientific Principle */}
              <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 flex items-center space-x-1.5">
                  <Atom className="w-3.5 h-3.5 text-sky-500" />
                  <span>Microgravity Scientific Principle</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  {activeTopic.scientific_principle}
                </p>
              </div>

              {/* 2. What NASA Studied vs What Research Found */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase font-bold text-sky-600 dark:text-sky-400">
                    1. WHAT NASA STUDIED
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeTopic.what_nasa_studied}
                  </p>
                </div>

                <div className="p-3.5 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">
                    2. WHAT RESEARCH FOUND (NASA DOCUMENTED)
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeTopic.what_research_found}
                  </p>
                </div>
              </div>

              {/* 3. Spacecraft Fire-Safety Relevance */}
              <div className="p-3.5 rounded bg-amber-50/60 dark:bg-amber-950/30 border-l-4 border-amber-500 space-y-1">
                <div className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-amber-400 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Spacecraft Fire-Safety Relevance</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  {activeTopic.fire_safety_relevance}
                </p>
              </div>

              {/* 4. Actionable Spacecraft Design Rules */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 flex items-center space-x-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Operational Spacecraft Design Requirements (AI Interpretation & Synthesis)</span>
                </div>
                <div className="space-y-1.5">
                  {activeTopic.spacecraft_design_rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-start space-x-2"
                    >
                      <span className="text-sky-600 dark:text-sky-400 font-bold">{idx + 1}.</span>
                      <span className="leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Planetary Surface Contrast: Lunar (1/6 g) & Mars (3/8 g) vs Microgravity */}
              <div className="p-3.5 rounded bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
                <div className="text-[10px] font-mono uppercase font-bold text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Planetary Surface Regime: Moon (1/6 g) & Mars (3/8 g) Contrast</span>
                </div>
                <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-mono">
                  {activeTopic.lunar_mars_contrast}
                </p>
              </div>

              {/* Connected Experiments */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">CORROBORATING INVESTIGATIONS:</span>
                <div className="flex space-x-1.5">
                  {activeTopic.key_experiments.map((e) => (
                    <span
                      key={e}
                      className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold text-[10px]"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
