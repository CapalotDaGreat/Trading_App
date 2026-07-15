import { useRouter } from 'expo-router';

import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export function PrivacyScreen() {
  const router = useRouter();
  const { privacy, updatePrivacy } = useSettings();

  return (
    <Screen scrollable>
      <Header title="Privacy & Security" onBack={() => router.back()} />

      <Text variant="body-sm" className="mb-4">
        Control how TradeVision AI uses your data. We never sell your personal information.
      </Text>

      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="analytics-outline"
          label="Analytics"
          description="Help improve the app with anonymous usage data"
          toggle
          toggleValue={privacy.analyticsEnabled}
          onToggle={(value) => void updatePrivacy({ analyticsEnabled: value })}
        />
        <SettingsRow
          icon="bug-outline"
          label="Crash Reporting"
          description="Send crash reports to improve stability"
          toggle
          toggleValue={privacy.crashReportingEnabled}
          onToggle={(value) => void updatePrivacy({ crashReportingEnabled: value })}
        />
        <SettingsRow
          icon="megaphone-outline"
          label="Personalized Ads"
          description="Show ads based on your interests"
          toggle
          toggleValue={privacy.personalizedAds}
          onToggle={(value) => void updatePrivacy({ personalizedAds: value })}
        />
        <SettingsRow
          icon="share-outline"
          label="Share Usage Data"
          description="Contribute anonymized trading patterns for research"
          toggle
          toggleValue={privacy.shareUsageData}
          onToggle={(value) => void updatePrivacy({ shareUsageData: value })}
        />
      </GlassCard>
    </Screen>
  );
}
