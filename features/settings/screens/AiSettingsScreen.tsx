import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useSettings } from '@/features/settings/hooks/useSettings';

export function AiSettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();

  return (
    <Screen scrollable accessibilityTitle="AI settings">
      <Header
        title="AI"
        subtitle="Limitations, memory, and educational framing"
        onBack={() => router.back()}
      />

      <GlassCard className="mb-4 p-4">
        <Text variant="body-sm" className="leading-relaxed text-text-secondary">
          AI in TradeInsight is a decision coach — not a broker and not a signal service. Insights
          explain research process quality. They do not predict price direction.
        </Text>
      </GlassCard>

      <Text variant="label" className="mb-2 px-1">
        Preferences
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="sparkles-outline"
          label="AI insights"
          description="Allow coaching cards and Ask AI suggestions"
          toggle
          toggleValue={settings.preferences.aiInsightsEnabled}
          onToggle={(value) =>
            void updateSettings({ preferences: { aiInsightsEnabled: value } })
          }
        />
        <SettingsRow
          icon="school-outline"
          label="Educational Mode"
          description="How AI, scores, Replay, and Lab stay educational"
          showChevron
          onPress={() => router.push('/settings/educational-mode' as never)}
        />
        <SettingsRow
          icon="finger-print-outline"
          label="Personal Intelligence & memory"
          description="Trading DNA and AI learning memory — process traits only"
          showChevron
          onPress={() => router.push('/decision/intelligence' as never)}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy Dashboard"
          description="Crash reporting consent and local data controls"
          showChevron
          onPress={() => router.push('/settings/privacy')}
        />
      </GlassCard>

      <View className="mt-6 px-1">
        <Text variant="caption" className="leading-relaxed text-text-tertiary">
          Quota: AI usage is rate-limited. When exceeded, Ask AI explains the limit and when it
          resets — never invents answers to bypass quota.
        </Text>
      </View>
    </Screen>
  );
}
