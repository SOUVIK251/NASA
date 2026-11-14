import React, { useState, useEffect, useCallback } from 'react';
import { Paper } from '../types';
import { fetchSources, fetchPaperById } from '../services/api';
import { PaperCard } from '../components/papers/PaperCard';
import { PaperDetails } from '../components/papers/PaperDetails';
import {
  Search,
  Database,
  FileQuestion,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface SourcesViewProps {
  initialPaperId?: string | null;
  onNavigate?: (module: string, param?: string) => void;
  isDark?: boolean;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  initialPaperId,
  onNavigate,
  isDark = true
}) => {
  const [sources, setSources] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Currently selected paper state
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(initialPaperId || null);
  const [selectedPaperDetail, setSelectedPaperDetail] = useState<Paper | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Helper to extract paper ID from URL
  const getPaperIdFromUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;

    // 1. Check query parameters: ?paper=... or ?paper_id=... or ?source=...
    const urlParams = new URLSearchParams(window.location.search);
    const qPaper = urlParams.get('paper') || urlParams.get('paper_id') || urlParams.get('source');
    if (qPaper) return qPaper;

    // 2. Check hash route: #paper=... or #/papers/... or #/sources/...
    const hash = window.location.hash;
    const hashMatch = hash.match(/(?:#|\/)papers?[\/=]([A-Za-z0-9_-]+)/i);
    if (hashMatch) return hashMatch[1];

    // 3. Check path route: /papers/:id or /sources/:id
    const pathMatch = window.location.pathname.match(/\/(?:papers|sources)\/([A-Za-z0-9_-]+)/i);
    if (pathMatch) return pathMatch[1];

    return null;
  }, []);

  // Sync with URL parameters on mount and browser navigation (popstate)
  useEffect(() => {
    const urlPaperId = getPaperIdFromUrl();
    if (urlPaperId) {
      setSelectedPaperId(urlPaperId);
    } else if (initialPaperId) {
      setSelectedPaperId(initialPaperId);
    }

    const handlePopState = () => {
      const poppedId = getPaperIdFromUrl();
      setSelectedPaperId(poppedId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getPaperIdFromUrl, initialPaperId]);

  // Load all sources
  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (err: any) {
      console.error('Failed to load sources:', err);
      setError(err?.message || 'Failed to connect to NASA sources repository');
    } finally {
      setLoading(false);
    }
  };

  // When selectedPaperId changes, resolve the paper object
  useEffect(() => {
    if (!selectedPaperId) {
      setSelectedPaperDetail(null);
      setDetailError(null);
      return;
    }

    // Try finding in already loaded sources
    const foundInList = sources.find(
      (s) => s.id.toLowerCase() === selectedPaperId.toLowerCase()
    );

    if (foundInList) {
      setSelectedPaperDetail(foundInList);
      setDetailError(null);
    } else {
      // Fetch directly from backend API
      setDetailLoading(true);
      setDetailError(null);
      fetchPaperById(selectedPaperId)
        .then((p) => {
          setSelectedPaperDetail(p);
          setDetailError(null);
        })
        .catch((err: any) => {
          console.warn(`Could not load paper '${selectedPaperId}':`, err);
          setSelectedPaperDetail(null);
          setDetailError(err?.message || 'Research paper unavailable');
        })
        .finally(() => {
          setDetailLoading(false);
        });
    }
  }, [selectedPaperId, sources]);

  // Handle selecting / deselecting a paper
  const handleSelectPaper = (paperId: string | null) => {
    setSelectedPaperId(paperId);
    setDetailError(null);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (paperId) {
        url.searchParams.set('paper', paperId);
        window.history.pushState({ paperId }, '', url.toString());
      } else {
        url.searchParams.delete('paper');
        url.searchParams.delete('paper_id');
        url.searchParams.delete('source');
        window.history.pushState({}, '', url.toString());
      }
    }
  };

  // Filter sources for list view
  const filteredSources = sources.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      s.authors.toLowerCase().includes(q) ||
      s.investigation.toLowerCase().includes(q) ||
      s.abstract.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q);

    const st = (s.source_type || '').toLowerCase();
    const matchesType =
      selectedType === 'ALL' ||
      (selectedType === 'NASA Technical Memorandum' && (st.includes('technical') || st.includes('nasa/tm') || st.includes('ntrs'))) ||
      (selectedType === 'Journal' && (st.includes('journal') || st.includes('nature') || st.includes('science and technology') || st.includes('combustion'))) ||
      (selectedType === 'Science' && (st.includes('science') || st.includes('mission overview') || st.includes('fact sheet'))) ||
      (selectedType === 'NASA' && st.includes('nasa')) ||
      st.includes(selectedType.toLowerCase());

    return matchesSearch && matchesType;
  });

  // ─── DETAIL VIEW MODE ───
  if (selectedPaperId) {
    if (detailLoading) {
      return (
        <div className="space-y-4 max-w-4xl mx-auto py-12">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      );
    }

    if (detailError || !selectedPaperDetail) {
      return (
        <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-200">
          <div className="sci-card p-10 text-center space-y-4 bg-slate-900/80 border border-slate-800 shadow-2xl">
            <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Research paper unavailable
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
              The requested research paper with identifier{' '}
              <code className="text-sky-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                {selectedPaperId}
              </code>{' '}
              could not be found or is not currently indexed in the publications repository.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleSelectPaper(null)}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition-all shadow-lg hover:shadow-sky-500/20 cursor-pointer"
                data-testid="return-to-papers-btn"
              >
                Return to Research Papers
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <PaperDetails
        paper={selectedPaperDetail}
        onBack={() => handleSelectPaper(null)}
        isDark={isDark}
      />
    );
  }

  // ─── LIST VIEW MODE ───
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className={`sci-card p-4 md:p-5 space-y-1 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
          <Database className="w-3.5 h-3.5" />
          <span>NASA TECHNICAL REPORTS SERVER (NTRS) & PSI REPOSITORY</span>
        </div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Primary NASA Research Literature & Flight Documents
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Trace every finding and experimental measurement directly back to formal NASA Technical Memorandums,
          AIAA aerospace journal articles, and peer-reviewed combustion literature. Select any paper to inspect details or open verified sources.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className={`sci-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search paper titles, authors, keywords, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-mono pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              data-testid="search-papers-input"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Source Types</option>
            <option value="NASA Technical Memorandum">NASA Technical Reports (TM)</option>
            <option value="Journal">AIAA / Nature Journals</option>
            <option value="Science">NASA Science Reviews</option>
            <option value="NASA">All NASA Sources</option>
          </select>
        </div>

        <div className="text-slate-500 text-[11px] font-mono">
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredSources.length}</span> publications
        </div>
      </div>

      {/* Sources List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/80 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="sci-card p-10 text-center space-y-4 bg-slate-900/60 border border-slate-800">
          <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">NASA Documents Archive Offline</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
            Could not retrieve publications repository ({error}). Ensure the backend server is running on port 8000.
          </p>
          <button
            onClick={loadSources}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="sci-card p-10 text-center space-y-2 bg-slate-900/40 border border-slate-800">
          <BookOpen className="w-8 h-8 mx-auto text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-300">No matching research papers</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No NASA publications found matching "{search}". Try searching by another keyword, author, or investigation.
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-xs font-mono text-sky-400 hover:underline cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5" data-testid="papers-list">
          {filteredSources.map((source) => (
            <PaperCard
              key={source.id}
              paper={source}
              onSelect={handleSelectPaper}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SourcesView;
