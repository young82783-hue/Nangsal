import * as React from 'react';
import { errorLogger } from '../lib/errorLogger';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to errorLogger service
    errorLogger.captureException(error, {
      type: 'react_boundary',
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full border border-neutral-200 rounded-2xl p-8 bg-neutral-50 shadow-sm text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold uppercase tracking-wider text-black">
                Something Went Wrong
              </h2>
              <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                An unexpected error was encountered. Our automated error logging system has recorded the event for diagnosis.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-white border border-neutral-200 rounded-xl p-3 text-left">
                <p className="text-[11px] font-mono text-red-600 break-words line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-mono font-bold tracking-widest uppercase rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-neutral-200 text-neutral-800 text-xs font-mono font-bold tracking-widest uppercase rounded-xl hover:bg-neutral-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
