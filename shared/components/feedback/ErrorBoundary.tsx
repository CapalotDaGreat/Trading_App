import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { mapRecoverableError } from '@/shared/utils/error-recovery';
import { captureException } from '@/shared/services/observability';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureException(error, {
      boundary: 'component',
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const mapped = mapRecoverableError(this.state.error);

      return (
        <View className="flex-1 items-center justify-center bg-background px-6">
          <ErrorState
            title={mapped.title}
            description={mapped.why}
            recovery={mapped.recovery}
            actionLabel={mapped.actionLabel}
            onAction={this.handleReset}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
