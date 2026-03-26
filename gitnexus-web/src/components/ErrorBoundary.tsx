import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-void text-text-primary px-6 py-10 flex items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-border-default bg-surface/90 shadow-2xl shadow-black/30 p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-text-muted">Render failure</p>
            <h1 className="text-3xl font-semibold text-white">Something went wrong</h1>
            <p className="text-sm leading-6 text-text-secondary">
              GitNexus Web hit an unhandled UI error and stopped rendering safely.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="font-mono text-sm text-red-200">{error.message || 'Unknown error'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-dim transition-colors"
            >
              Reload app
            </button>
            <p className="text-sm text-text-muted">A full reload is the fastest recovery path.</p>
          </div>

          {error.stack && (
            <details className="rounded-xl border border-border-subtle bg-deep/70 p-4">
              <summary className="cursor-pointer text-sm font-medium text-text-secondary">
                Error details
              </summary>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words text-xs font-mono text-text-secondary">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
