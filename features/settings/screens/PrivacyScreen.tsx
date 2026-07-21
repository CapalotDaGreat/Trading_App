import { useRouter } from 'expo-router';
import { Linking, View } from 'react-native';

import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { LEGAL_URLS } from '@/shared/constants/legal';

export function PrivacyScreen() {
  const router = useRouter();
  const { privacy, updatePrivacy } = useSettings();

  return (
    <Screen scrollable>
      <Header title="Privacy & Security" onBack={() => router.back()} />

      <Text variant="body-sm" className="mb-4">
        Crash reports are off until you choose to enable them. Reports may include app, device,
        release, and error details, but are filtered to remove common credentials and personal
        fields. Full rights under Swiss nFADP, EU/UK GDPR, and U.S. state privacy laws are described
        in the Privacy Policy.
      </Text>

      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="key-outline"
          label="Multi-factor authentication"
          description="Manage authenticator app factors"
          showChevron
          onPress={() => router.push('/settings/mfa' as never)}
        />
        <SettingsRow
          icon="bug-outline"
          label="Crash Reporting"
          description="Send redacted crash and terminal failure diagnostics to Sentry"
          toggle
          toggleValue={privacy.crashReportingEnabled}
          onToggle={(value) => void updatePrivacy({ crashReportingEnabled: value })}
        />
      </GlassCard>

      <Text variant="caption" className="mt-3">
        Consent version {privacy.crashReportingConsentVersion}
        {privacy.crashReportingConsentUpdatedAt
          ? ` · Updated ${new Date(privacy.crashReportingConsentUpdatedAt).toLocaleDateString()}`
          : ' · Not yet granted'}
      </Text>

      <Text variant="label" className="mb-2 mt-6 px-1">
        Legal documents
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
          icon="trash-outline"
          label="Account deletion"
          showChevron
          onPress={() => router.push('/settings/legal/accountDeletion' as never)}
        />
      </GlassCard>

      <View className="mt-4 gap-2 pb-8">
        <Text
          variant="caption"
          className="text-accent"
          onPress={() => void Linking.openURL(LEGAL_URLS.privacyEmail)}
        >
          Contact privacy@tradevision.ai
        </Text>
        <Text
          variant="caption"
          className="text-accent"
          onPress={() => void Linking.openURL(LEGAL_URLS.securityEmail)}
        >
          Report security issues to security@tradevision.ai
        </Text>
      </View>
    </Screen>
  );
}
