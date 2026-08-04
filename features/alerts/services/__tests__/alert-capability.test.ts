import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { getAlertDeliveryCapability } from '../alert-capability.service';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
  ExecutionEnvironment: {
    StoreClient: 'storeClient',
    Standalone: 'standalone',
    Bare: 'bare',
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

describe('getAlertDeliveryCapability', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
    (Constants as { executionEnvironment: string }).executionEnvironment =
      ExecutionEnvironment.Standalone;
  });

  it('reports foreground-only on web', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const cap = await getAlertDeliveryCapability();
    expect(cap.backgroundEvaluation).toBe(false);
    expect(cap.reason).toBe('web');
    expect(cap.summary).toMatch(/not available/i);
  });

  it('reports foreground-only in Expo Go', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    (Constants as { executionEnvironment: string }).executionEnvironment =
      ExecutionEnvironment.StoreClient;
    const cap = await getAlertDeliveryCapability();
    expect(cap.backgroundEvaluation).toBe(false);
    expect(cap.reason).toBe('expo_go');
  });
});
