import type { ThemeMode } from '@/shared/stores/theme.store';
import type { UserPreferences } from '@/shared/types/user';

export interface AppSettings {
  theme: ThemeMode;
  hapticsEnabled: boolean;
  biometricAuthEnabled: boolean;
  hasCompletedOnboarding: boolean;
  preferences: UserPreferences;
  lastSyncAt: number | null;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  priceAlerts: boolean;
  aiInsights: boolean;
  marketNews: boolean;
  portfolioUpdates: boolean;
  emailDigest: boolean;
}

/** Idle minutes before optional automatic sign-out. 0 = disabled. */
export type SessionTimeoutMinutes = 0 | 15 | 30 | 60 | 120;

export interface PrivacySettings {
  crashReportingEnabled: boolean;
  crashReportingConsentVersion: number;
  crashReportingConsentUpdatedAt: string | null;
  /** Prefer clearing local user caches on every sign-out (always on for security). */
  clearLocalDataOnSignOut: boolean;
  /** Auto sign-out after idle period (minutes). 0 disables. */
  sessionTimeoutMinutes: SessionTimeoutMinutes;
  /** Marketing / product email preferences (digest-style). */
  marketingEmailsEnabled: boolean;
}

export interface ProfileSettings {
  displayName: string;
  email: string;
  bio: string;
  timezone: string;
  currency: string;
  experienceLevel: UserPreferences['experienceLevel'];
}

export interface SettingsUpdatePayload {
  theme?: ThemeMode;
  hapticsEnabled?: boolean;
  biometricAuthEnabled?: boolean;
  preferences?: Partial<UserPreferences>;
  notifications?: Partial<NotificationSettings>;
  privacy?: Partial<PrivacySettings>;
  profile?: Partial<ProfileSettings>;
}

export interface SettingsService {
  getSettings(): AppSettings;
  updateSettings(updates: SettingsUpdatePayload): Promise<AppSettings>;
  getNotificationSettings(): NotificationSettings;
  updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<NotificationSettings>;
  getPrivacySettings(): PrivacySettings;
  updatePrivacySettings(updates: Partial<PrivacySettings>): Promise<PrivacySettings>;
  resetToDefaults(): Promise<AppSettings>;
  syncToFirestore(uid: string): Promise<void>;
  hasRemoteSettings(uid: string): Promise<boolean>;
}
