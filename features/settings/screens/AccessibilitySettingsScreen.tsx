import { useRouter } from 'expo-router';
import { Linking, Platform, View } from 'react-native';

import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useSettingsStore } from '@/shared/stores/settings.store';

async function openSystemAccessibilitySettings() {
  if (Platform.OS === 'ios') {
    await Linking.openURL('App-Prefs:ACCESSIBILITY').catch(() => Linking.openSettings());
    return;
  }
  await Linking.openSettings();
}

export function AccessibilitySettingsScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

  return (
    <Screen scrollable accessibilityTitle="Accessibility settings">
      <Header
        title="Accessibility"
        subtitle="VoiceOver, TalkBack, Dynamic Type, motion"
        onBack={() => router.back()}
      />

      <GlassCard className="mb-4 p-4">
        <Text variant="body-sm" className="leading-relaxed text-text-secondary">
          TradeInsight follows system accessibility settings. Text scales with Dynamic Type (capped
          for layout safety). Interactive controls meet minimum touch targets. Charts expose spoken
          summaries.
        </Text>
      </GlassCard>

      <Text variant="label" className="mb-2 px-1">
        System status
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="speedometer-outline"
          label="Reduce Motion"
          description={
            reduceMotion
              ? 'On — enter animations and haptics-heavy motion are subdued'
              : 'Off — subtle motion is enabled'
          }
          value={reduceMotion ? 'On' : 'Off'}
        />
        <SettingsRow
          icon="text-outline"
          label="Dynamic Type / font scaling"
          description="Uses your system text size. Shared Text allows scaling up to 1.6–2× by variant."
        />
        <SettingsRow
          icon="contrast-outline"
          label="High contrast"
          description="Use system Increase Contrast / high-contrast themes. App tokens follow light/dark automatically."
        />
      </GlassCard>

      <Text variant="label" className="mb-2 mt-6 px-1">
        In-app
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="phone-portrait-outline"
          label="Haptic feedback"
          description="Optional vibration on primary actions"
          toggle
          toggleValue={hapticsEnabled}
          onToggle={setHapticsEnabled}
        />
        <SettingsRow
          icon="open-outline"
          label="Open system accessibility settings"
          description={Platform.OS === 'ios' ? 'iOS Accessibility' : 'Android Accessibility'}
          showChevron
          onPress={() => void openSystemAccessibilitySettings()}
        />
      </GlassCard>

      <View className="mt-6 px-1">
        <Text variant="caption" className="leading-relaxed text-text-tertiary">
          Keyboard: on web, primary actions are focusable buttons. Screen readers: every settings row
          and Today CTA includes an accessibility label and hint where recovery actions exist.
        </Text>
      </View>
    </Screen>
  );
}
