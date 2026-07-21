import type { ObservabilityProvider } from './types';

export const noopObservabilityProvider: ObservabilityProvider = {
  name: 'noop',
  async initialize() {
    return false;
  },
  captureException() {},
  addBreadcrumb() {},
  setUser() {},
  setRoute() {},
  async disable() {},
};
