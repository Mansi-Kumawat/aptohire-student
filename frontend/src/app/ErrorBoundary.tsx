import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error internally if needed, but never render stack trace to user
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-danger-50 text-danger-600 flex items-center justify-center mb-6 border border-danger-600/20">
            <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
            Something went wrong
          </h1>
          <p className="text-moss text-[16px] max-w-md mb-8 leading-relaxed">
            An unexpected error occurred. You can reload the page to continue.
          </p>

          <Button variant="primary" size="lg" onClick={this.handleReload}>
            <RefreshCw className="w-4 h-4 mr-2" />
            <span>Reload page</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
