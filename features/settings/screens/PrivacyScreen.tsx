import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import {
  buildPrivacyDataExport,
  sharePrivacyDataExport,
} from '@/features/settings/services/privacy-export.service';
import type { SessionTimeoutMinutes } from '@/features/settings/types/settings.types';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { LEGAL_URLS } from '@/shared/constants/legal';
import { openExternalUrl } from '@/shared/utils/open-url';

const TIMEOUT_OPTIONS: { minutes: SessionTimeoutMinutes; label: string }[] = [
  { minutes: 0, label: 'Off' },
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 60, label: '1h' },
  { minutes: 120, label: '2h' },
];

export function PrivacyScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { privacy, updatePrivacy, settings, updateSettings } = useSettings();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const pkg = await buildPrivacyDataExport({
        uid: user?.uid ?? 'guest',
        email: user?.email,
        displayName: user?.displayName,
      });
      await sharePrivacyDataExport(pkg);
    } catch {
      Alert.alert('Export unavailable', 'Could not build your data package. Try again later.');
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete my data & account',
      'This permanently deletes your TradeInsight account and cloud data, then clears local caches on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await deleteAccount();
              } catch {
                Alert.alert(
                  'Deletion needs recent login',
                  'Sign in again, then retry delete. Sensitive account actions require a fresh session.',
                );
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header title="Privacy Dashboard" onBack={() => router.back()} />

      <Text variant="body-sm" className="mb-4 text-text-secondary">
        Control how TradeInsight uses diagnostics, session security, and your data rights under
        Swiss nFADP, EU/UK GDPR, and applicable U.S. state laws.
      </Text>

      <Text variant="label" className="mb-2 px-1">
        Your data
      </Text>
      <GlassCard className="mb-4 overflow-hidden">
        <SettingsRow
          icon="download-outline"
          label="Download my data"
          description={
            exporting ? 'Preparing export…' : 'Journal, decision log, memory, passport, settings'
          }
          showChevron
          onPress={() => {
            if (!exporting) void handleExport();
          }}
        />
        <SettingsRow
          icon="trash-outline"
          label="Delete my data"
          description={deleting ? 'Deleting…' : 'Account deletion with cloud + local wipe'}
          showChevron
          onPress={confirmDelete}
        />
        <SettingsRow
          icon="link-outline"
          label="Manage connected accounts"
          description="Email, Apple, Google providers and profile"
          showChevron
          onPress={() => router.push('/settings/profile' as never)}
        />
      </GlassCard>

      <Text variant="label" className="mb-2 px-1">
        Sessions on this device
      </Text>
      <GlassCard className="mb-4 p-4">
        <Text variant="body-sm" className="mb-1">
          {user?.email ?? user?.displayName ?? 'Signed-in session'}
        </Text>
        <Text variant="caption" className="text-text-secondary">
          UID: {user?.uid ?? 'guest'} · Multi-device revoke inventory arrives in a later release.
          Sign out clears local caches on this device.
        </Text>
        <View className="mt-3">
          <Button size="sm" variant="secondary" onPress={() => void signOut()}>
            Sign out this device
          </Button>
        </View>
      </GlassCard>

      <Text variant="label" className="mb-2 px-1">
        Security on this device
      </Text>
      <GlassCard className="mb-4 overflow-hidden">
        <SettingsRow
          icon="key-outline"
          label="Multi-factor authentication"
          description="Authenticator app factors"
          showChevron
          onPress={() => router.push('/settings/mfa' as never)}
        />
        <SettingsRow
          icon="finger-print-outline"
          label="Biometric unlock"
          description="Require Face ID / fingerprint after backgrounding"
          toggle
          toggleValue={settings.biometricAuthEnabled}
          onToggle={(value) => void updateSettings({ biometricAuthEnabled: value })}
        />
        <SettingsRow
          icon="exit-outline"
          label="Clear local data on sign-out"
          description="Always on — protects shared devices"
          toggle
          toggleValue={privacy.clearLocalDataOnSignOut}
          onToggle={() => void updatePrivacy({ clearLocalDataOnSignOut: true })}
        />
      </GlassCard>

      <Text variant="label" className="mb-2 px-1">
        Automatic session timeout
      </Text>
      <GlassCard className="mb-4 p-4">
        <Text variant="caption" className="mb-3 text-text-secondary">
          Sign out after idle time. Demo guest mode is never auto-signed out.
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TIMEOUT_OPTIONS.map((option) => {
            const selected = privacy.sessionTimeoutMinutes === option.minutes;
            return (
              <Button
                key={option.label}
                size="sm"
                variant={selected ? 'primary' : 'secondary'}
                onPress={() => void updatePrivacy({ sessionTimeoutMinutes: option.minutes })}
              >
                {option.label}
              </Button>
            );
          })}
        </View>
      </GlassCard>

      <Text variant="label" className="mb-2 px-1">
        Diagnostics & communications
      </Text>
      <GlassCard className="mb-4 overflow-hidden">
        <SettingsRow
          icon="bug-outline"
          label="Crash reporting"
          description="Redacted Sentry diagnostics — off until you opt in"
          toggle
          toggleValue={privacy.crashReportingEnabled}
          onToggle={(value) => void updatePrivacy({ crashReportingEnabled: value })}
        />
        <SettingsRow
          icon="stats-chart-outline"
          label="Product analytics"
          description="Allowlisted usage aggregates only — never journals, AI chats, portfolio values, or raw DNA evidence"
          toggle
          toggleValue={privacy.productAnalyticsEnabled}
          onToggle={(value) => void updatePrivacy({ productAnalyticsEnabled: value })}
        />
        <SettingsRow
          icon="finger-print-outline"
          label="Trading DNA stays on-device"
          description="Behavioural coaching is personal — never sold, never public, never compared to other traders"
          toggle
          toggleValue={privacy.tradingDnaLocalOnly ?? true}
          onToggle={(value) => void updatePrivacy({ tradingDnaLocalOnly: value })}
        />
        <SettingsRow
          icon="mail-outline"
          label="Product emails"
          description="Optional digests — never used for trade signals"
          toggle
          toggleValue={privacy.marketingEmailsEnabled}
          onToggle={(value) => void updatePrivacy({ marketingEmailsEnabled: value })}
        />
      </GlassCard>

      <Text variant="caption" className="mb-4 text-text-tertiary">
        Crash consent v{privacy.crashReportingConsentVersion}
        {privacy.crashReportingConsentUpdatedAt
          ? ` · ${new Date(privacy.crashReportingConsentUpdatedAt).toLocaleDateString()}`
          : ' · not granted'}
        {' · '}
        Analytics consent v{privacy.productAnalyticsConsentVersion}
        {privacy.productAnalyticsConsentUpdatedAt
          ? ` · ${new Date(privacy.productAnalyticsConsentUpdatedAt).toLocaleDateString()}`
          : ' · not granted'}
      </Text>

      <Text variant="label" className="mb-2 px-1">
        Legal
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="lock-closed-outline"
          label="Privacy Policy"
          showChevron
          onPress={() => router.push('/settings/legal/privacy' as never)}
        />
        <SettingsRow
          icon="shield-outline"
          label="Security notice"
          showChevron
          onPress={() => router.push('/settings/legal/security' as never)}
        />
        <SettingsRow
          icon="document-text-outline"
          label="Account deletion policy"
          showChevron
          onPress={() => router.push('/settings/legal/accountDeletion' as never)}
        />
      </GlassCard>

      <View className="mt-4 gap-2">
        <Button variant="secondary" onPress={() => void signOut()}>
          Sign out this session
        </Button>
        <Text
          variant="caption"
          className="text-accent"
          onPress={() => void openExternalUrl(LEGAL_URLS.privacyEmail)}
        >
          Contact privacy@tradevision.ai
        </Text>
        <Text
          variant="caption"
          className="text-accent"
          onPress={() => void openExternalUrl(LEGAL_URLS.securityEmail)}
        >
          Report security issues to security@tradevision.ai
        </Text>
      </View>
    </Screen>
  );
}
