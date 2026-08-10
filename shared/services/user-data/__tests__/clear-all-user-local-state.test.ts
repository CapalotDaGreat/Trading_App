import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearAllUserLocalState, USER_LOCAL_STORAGE_KEYS } from '../clear-all-user-local-state';

const mockResetRepository = jest.fn(async () => undefined);
const mockResetSettings = jest.fn();
const mockResetSubscription = jest.fn();
const mockResetAcademy = jest.fn();
const mockResetLab = jest.fn();
const mockResetOnboarding = jest.fn();

jest.mock('@/features/academy/stores/checklist.store', () => ({
  useChecklistStore: { setState: jest.fn() },
}));
jest.mock('@/features/academy/stores/academy-progress.store', () => ({
  useAcademyProgressStore: { getState: () => ({ resetProgress: mockResetAcademy }) },
}));
jest.mock('@/features/decision/stores/decision-ui.store', () => ({
  useDecisionUiStore: { setState: jest.fn() },
}));
jest.mock('@/features/decision-lab/stores/lab.store', () => ({
  useDecisionLabStore: { getState: () => ({ resetAccount: mockResetLab }) },
}));
jest.mock('@/features/decision-simulator/stores/simulator.store', () => ({
  useSimulatorStore: { setState: jest.fn() },
}));
jest.mock('@/features/decision-passport/stores/passport.store', () => ({
  useDecisionPassportStore: { setState: jest.fn() },
}));
jest.mock('@/features/educational/stores/educational.store', () => ({
  useEducationalStore: { setState: jest.fn() },
}));
jest.mock('@/features/notifications/services/notification.service', () => ({
  notificationService: {
    getExpoPushToken: jest.fn(async () => null),
    removeTokenFromFirestore: jest.fn(),
    cancelAllScheduled: jest.fn(async () => undefined),
    setBadgeCount: jest.fn(async () => undefined),
  },
}));
jest.mock('@/features/onboarding/stores/onboarding.store', () => ({
  useOnboardingStore: { getState: () => ({ resetMemory: mockResetOnboarding }) },
}));
jest.mock('@/shared/services/observability/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));
jest.mock('@/shared/services/storage/secure-storage.service', () => ({
  secureStorageService: { clear: jest.fn(async () => undefined) },
  SecureStorageKeys: { AUTH_TOKEN: 'auth_token', USER_SESSION: 'user_session' },
}));
const mockSetOnboardingCompleted = jest.fn();
jest.mock('@/shared/stores/settings.store', () => ({
  useSettingsStore: {
    getState: () => ({
      reset: mockResetSettings,
      hasCompletedOnboarding: true,
      setOnboardingCompleted: mockSetOnboardingCompleted,
    }),
  },
}));
jest.mock('@/shared/stores/subscription.store', () => ({
  useSubscriptionStore: { getState: () => ({ reset: mockResetSubscription }) },
}));
jest.mock('../local-user.repository', () => ({
  getLocalUserRepository: () => ({ reset: mockResetRepository }),
}));

describe('clearAllUserLocalState', () => {
  beforeEach(() => {
    mockSetOnboardingCompleted.mockClear();
  });

  it('wipes the audited account keys and preserves only device theme', async () => {
    const queryClient = { clear: jest.fn() };
    const multiRemove = jest.spyOn(AsyncStorage, 'multiRemove');

    const result = await clearAllUserLocalState('user-1', queryClient as never);

    expect(result.preservedDeviceKeys).toEqual(['tradevision-theme-v2']);
    expect(result.removedAsyncStorageKeys).toEqual([
      ...USER_LOCAL_STORAGE_KEYS,
      'tradevision:onboarding-draft:v1:user-1',
    ]);
    expect(result.removedAsyncStorageKeys).toContain('tradevision-decision-passport-v1');
    expect(result.removedAsyncStorageKeys).not.toContain('tradevision-theme-v2');
    expect(multiRemove).toHaveBeenCalledWith(result.removedAsyncStorageKeys);
    expect(mockResetRepository).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(mockSetOnboardingCompleted).not.toHaveBeenCalled();
  });

  it('preserves onboarding completion on logout mode', async () => {
    await clearAllUserLocalState('user-1', undefined, { mode: 'logout' });
    expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
  });
});
