import React, { useState, useMemo } from 'react';
import {
  X,
  Database,
  Download,
  Search,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { ProvenanceType } from '../../types';

interface RawDataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeseriesData: any;
  datasetId: string;
  experimentId: string;
  isDark?: boolean;
}

export const RawDataTableModal: React.FC<RawDataTableModalProps> = ({
  isOpen,
  onClose,
  timeseriesData,
  datasetId,
  experimentId,
  isDark = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const rows: any[] = useMemo(() => timeseriesData?.data ?? [], [timeseriesData]);

  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]).filter(k => !k.startsWith('_'));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(r =>
      columns.some(col => String(r[col] ?? '').toLowerCase().includes(term))
    );
  }, [rows, columns, searchTerm]);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    if (rows.length === 0) return;
    const header = columns.join(',');
    const csvContent = [
      header,
      ...rows.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${experimentId || datasetId}_telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl max-h-[90vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  RAW RESEARCH TELEMETRY TABLE
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {rows.length} RECORDED TIMESTEPS
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {experimentId || datasetId} Numerical Telemetry
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap bg-slate-50/30 dark:bg-slate-950/20">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter values, phases, timestamps..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-mono border outline-none ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredRows.length}</strong> of {rows.length} data rows
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-1 overflow-auto p-4">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-mono">No numerical timeseries loaded for this selection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">#</th>
                    {columns.map(col => (
                      <th key={col} className="py-2.5 px-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRows.slice(0, 500).map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-sky-500/5 transition-colors ${
                        idx % 2 === 1 ? (isDark ? 'bg-slate-900/40' : 'bg-slate-50/60') : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 text-[10px]">{idx + 1}</td>
                      {columns.map(col => {
                        const val = row[col];
                        const isNum = typeof val === 'number';
                        return (
                          <td key={col} className="py-2 px-3 text-slate-700 dark:text-slate-300">
                            {isNum ? (
                              Number.isInteger(val) ? val : val.toFixed(4)
                            ) : (
                              String(val ?? '—')
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length > 500 && (
                <div className="p-2 text-center text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  Showing first 500 records. Export CSV to analyze all {filteredRows.length} rows.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Data provenance: DIGITIZED_FROM_PUBLICATION (NASA GRC Physical Sciences Informatics)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white cursor-pointer transition-all"
          >
            Close Table
          </button>
        </div>
      </div>
    </div>
  );
};
