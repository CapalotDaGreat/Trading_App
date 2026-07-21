import type { ObservabilityContext, ObservabilityLevel } from './types';

import { addBreadcrumb, captureException, redactContext } from './index';

export interface StructuredLog {
  event: string;
  context?: ObservabilityContext;
}

function write(level: ObservabilityLevel, entry: StructuredLog): void {
  const safeContext = redactContext(entry.context);
  addBreadcrumb(entry.event, safeContext, level);

  if (__DEV__) {
    const method = level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'debug';
    console[method](`[${entry.event}]`, safeContext ?? {});
  }
}

export const logger = {
  debug(event: string, context?: ObservabilityContext) {
    write('debug', { event, context });
  },
  info(event: string, context?: ObservabilityContext) {
    write('info', { event, context });
  },
  warn(event: string, context?: ObservabilityContext) {
    write('warning', { event, context });
  },
  error(event: string, error: unknown, context?: ObservabilityContext) {
    write('error', { event, context });
    captureException(error, { event, ...context });
  },
};
