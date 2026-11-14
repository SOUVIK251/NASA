import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackHeight?: string;
  label?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'WebGL context error' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D Canvas Context Loss or Shader Exception:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="relative bg-[#030712] rounded-2xl border border-amber-500/30 flex flex-col items-center justify-center p-6 text-center text-slate-300 font-mono space-y-3"
          style={{ height: this.props.fallbackHeight || '420px' }}
        >
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            3D Graphics Renderer Fallback
          </div>
          <p className="text-[11px] text-slate-400 max-w-md font-sans">
            The 3D WebGL renderer experienced a canvas context interruption ({this.props.label || 'Microgravity Chamber'}).
            Telemetry data and 2D charts remain fully operational.
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={this.handleRetry}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restart 3D Canvas</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;
