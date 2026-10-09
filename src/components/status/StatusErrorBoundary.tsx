import React from 'react';
import { StatusPage } from './StatusPage';

type Props = {
  children: React.ReactNode;
  onHome: () => void;
  onNavigate: (path: string) => void;
};

type State = { crashed: boolean };

/** Catches render crashes → Holst 500 status page (no full white-screen). */
export class StatusErrorBoundary extends React.Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Unityteck] UI crash', error);
  }

  render() {
    if (this.state.crashed) {
      return (
        <StatusPage
          kind="500"
          onHome={() => {
            this.setState({ crashed: false });
            this.props.onHome();
          }}
          onNavigate={(path) => {
            this.setState({ crashed: false });
            this.props.onNavigate(path);
          }}
        />
      );
    }
    return this.props.children;
  }
}
