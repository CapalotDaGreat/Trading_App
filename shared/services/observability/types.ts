export type ObservabilityLevel = 'debug' | 'info' | 'warning' | 'error';

export interface ObservabilityContext {
  [key: string]: unknown;
}

export interface ObservabilityProvider {
  readonly name: 'noop' | 'sentry';
  initialize(): Promise<boolean>;
  captureException(error: unknown, context?: ObservabilityContext): void;
  addBreadcrumb(message: string, context?: ObservabilityContext, level?: ObservabilityLevel): void;
  setUser(uid: string | null): void;
  setRoute(route: string): void;
  disable(): Promise<void>;
}
