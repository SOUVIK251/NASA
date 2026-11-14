import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Workstation Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleSoftReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 font-mono select-none">
          <div className="max-w-xl w-full bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                  Workstation Recovery Shield
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {this.props.fallbackTitle || 'Subsystem Execution Fault Detected'}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              The workstation encountered an unexpected runtime exception in a visualization or telemetry component.
              The application state has been preserved to prevent a blank display.
            </p>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-left text-xs overflow-hidden">
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 uppercase font-bold">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Diagnostic Trace:</span>
                </div>
                <div className="text-amber-300/90 font-mono text-[11px] break-words">
                  {this.state.error.name}: {this.state.error.message}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleSoftReset}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-sky-400" />
                <span>Reset View State</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-sky-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Workstation</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
