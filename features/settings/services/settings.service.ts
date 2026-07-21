import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { canUseFirestore, requireDb } from '@/firebase/config';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useThemeStore } from '@/shared/stores/theme.store';
import { DEFAULT_USER_PREFERENCES } from '@/shared/types/user';

import type {
  AppSettings,
  NotificationSettings,
  PrivacySettings,
  SettingsService,
  SettingsUpdatePayload,
} from '../types/settings.types';

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  pushEnabled: true,
  priceAlerts: true,
  aiInsights: true,
  marketNews: false,
  portfolioUpdates: true,
  emailDigest: false,
};

const DEFAULT_PRIVACY: PrivacySettings = {
  analyticsEnabled: true,
  crashReportingEnabled: true,
  personalizedAds: false,
  shareUsageData: false,
};

function getStoreState() {
  const settings = useSettingsStore.getState();
  const theme = useThemeStore.getState();

  return {
    settings,
    theme,
  };
}

class SettingsServiceImpl implements SettingsService {
  getSettings(): AppSettings {
    const { settings, theme } = getStoreState();

    return {
      theme: theme.mode,
      hapticsEnabled: settings.hapticsEnabled,
      analyticsEnabled: settings.analyticsEnabled,
      biometricAuthEnabled: settings.preferences.biometricAuthEnabled,
      hasCompletedOnboarding: settings.hasCompletedOnboarding,
      preferences: settings.preferences,
      lastSyncAt: settings.lastSyncAt,
    };
  }

  async updateSettings(updates: SettingsUpdatePayload): Promise<AppSettings> {
    const settingsStore = useSettingsStore.getState();
    const themeStore = useThemeStore.getState();

    if (updates.theme !== undefined) {
      themeStore.setMode(updates.theme);
    }

    if (updates.hapticsEnabled !== undefined) {
      settingsStore.setHapticsEnabled(updates.hapticsEnabled);
    }

    if (updates.analyticsEnabled !== undefined) {
      settingsStore.setAnalyticsEnabled(updates.analyticsEnabled);
    }

    if (updates.preferences !== undefined) {
      settingsStore.setPreferences(updates.preferences);
    }

    if (updates.biometricAuthEnabled !== undefined) {
      settingsStore.setPreferences({ biometricAuthEnabled: updates.biometricAuthEnabled });
    }

    settingsStore.setLastSyncAt(Date.now());
    return this.getSettings();
  }

  getNotificationSettings(): NotificationSettings {
    const { preferences } = getStoreState().settings;

    return {
      pushEnabled: preferences.notificationsEnabled,
      priceAlerts: preferences.priceAlertsEnabled,
      aiInsights: preferences.aiInsightsEnabled,
      marketNews: DEFAULT_NOTIFICATIONS.marketNews,
      portfolioUpdates: DEFAULT_NOTIFICATIONS.portfolioUpdates,
      emailDigest: DEFAULT_NOTIFICATIONS.emailDigest,
    };
  }

  async updateNotificationSettings(
    updates: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    const settingsStore = useSettingsStore.getState();

    settingsStore.setPreferences({
      notificationsEnabled: updates.pushEnabled ?? settingsStore.preferences.notificationsEnabled,
      priceAlertsEnabled: updates.priceAlerts ?? settingsStore.preferences.priceAlertsEnabled,
      aiInsightsEnabled: updates.aiInsights ?? settingsStore.preferences.aiInsightsEnabled,
    });

    settingsStore.setLastSyncAt(Date.now());
    return this.getNotificationSettings();
  }

  getPrivacySettings(): PrivacySettings {
    const { settings } = getStoreState();

    return {
      analyticsEnabled: settings.analyticsEnabled,
      crashReportingEnabled: settings.crashReportingEnabled,
      personalizedAds: settings.personalizedAds,
      shareUsageData: settings.shareUsageData,
    };
  }

  async updatePrivacySettings(updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const settingsStore = useSettingsStore.getState();

    if (updates.analyticsEnabled !== undefined) {
      settingsStore.setAnalyticsEnabled(updates.analyticsEnabled);
    }
    if (updates.crashReportingEnabled !== undefined) {
      settingsStore.setCrashReportingEnabled(updates.crashReportingEnabled);
    }
    if (updates.personalizedAds !== undefined) {
      settingsStore.setPersonalizedAds(updates.personalizedAds);
    }
    if (updates.shareUsageData !== undefined) {
      settingsStore.setShareUsageData(updates.shareUsageData);
    }

    settingsStore.setLastSyncAt(Date.now());
    return this.getPrivacySettings();
  }

  async resetToDefaults(): Promise<AppSettings> {
    const settingsStore = useSettingsStore.getState();
    const themeStore = useThemeStore.getState();

    settingsStore.reset();
    themeStore.setMode('system');
    return this.getSettings();
  }

  async syncToFirestore(uid: string): Promise<void> {
    if (!canUseFirestore(uid)) return;

    const settings = this.getSettings();
    const notifications = this.getNotificationSettings();
    const privacy = this.getPrivacySettings();

    await setDoc(
      doc(requireDb(), 'userSettings', uid),
      {
        theme: settings.theme,
        hapticsEnabled: settings.hapticsEnabled,
        analyticsEnabled: settings.analyticsEnabled,
        preferences: settings.preferences,
        notifications,
        privacy,
        hasCompletedOnboarding: settings.hasCompletedOnboarding,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    useSettingsStore.getState().setLastSyncAt(Date.now());
  }

  async hasRemoteSettings(uid: string): Promise<boolean> {
    if (!canUseFirestore(uid)) return false;
    return (await getDoc(doc(requireDb(), 'userSettings', uid))).exists();
  }
}

export const settingsService: SettingsService = new SettingsServiceImpl();

export { DEFAULT_NOTIFICATIONS, DEFAULT_PRIVACY, DEFAULT_USER_PREFERENCES };
