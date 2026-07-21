const mockInitialize = jest.fn(async () => true);
const mockDisable = jest.fn(async () => undefined);
const mockCaptureException = jest.fn();

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'bare' },
  ExecutionEnvironment: {
    Bare: 'bare',
    Standalone: 'standalone',
    StoreClient: 'storeClient',
  },
}));

jest.mock('../sentry.provider', () => ({
  sentryObservabilityProvider: {
    name: 'sentry',
    initialize: mockInitialize,
    disable: mockDisable,
    captureException: mockCaptureException,
    addBreadcrumb: jest.fn(),
    setUser: jest.fn(),
    setRoute: jest.fn(),
  },
}));

process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const observability = require('../index') as typeof import('../index');

describe('observability lifecycle', () => {
  afterAll(() => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  });

  it('initializes after opt-in, captures terminal errors, and closes on opt-out', async () => {
    await observability.configureObservability(true);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(observability.getObservabilityProviderName()).toBe('sentry');

    const error = new Error('terminal');
    observability.captureException(error, { operation: 'test' });
    expect(mockCaptureException).toHaveBeenCalledWith(error, { operation: 'test' });

    await observability.configureObservability(false);
    expect(mockDisable).toHaveBeenCalledTimes(1);
    expect(observability.getObservabilityProviderName()).toBe('noop');
  });

  it('stays no-op in Expo Go even when consent is enabled', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    Constants.executionEnvironment = 'storeClient';

    await observability.configureObservability(true);

    expect(mockInitialize).toHaveBeenCalledTimes(1);
    expect(observability.getObservabilityProviderName()).toBe('noop');
    Constants.executionEnvironment = 'bare';
  });
});
