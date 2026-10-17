import React from 'react';
import { StatusPage } from './StatusPage';

type Props = {
  children: React.ReactNode;
  onHome: () => void;
  onNavigate: (path: string) => void;
};

type State = {
  crashed: boolean;
  error?: Error | unknown;
  errorInfo?: React.ErrorInfo;
};

/** Catches render crashes → Holst 500 status page (no full white-screen). */
export class StatusErrorBoundary extends React.Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(error: Error): State {
    return { crashed: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error('[Unityteck] UI crash', error);
    if (error instanceof Error) {
      console.error('[Unityteck] Crash stack:', error.stack);
    }
    if (errorInfo?.componentStack) {
      console.error('[Unityteck] Crash component stack:', errorInfo.componentStack);
    }
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.crashed) {
      return (
        <StatusPage
          kind="500"
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onHome={() => {
            this.setState({ crashed: false, error: undefined, errorInfo: undefined });
            this.props.onHome();
          }}
          onNavigate={(path) => {
            this.setState({ crashed: false, error: undefined, errorInfo: undefined });
            this.props.onNavigate(path);
          }}
        />
      );
    }
    return this.props.children;
  }
}
