import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { PremiumBadge } from '@/features/subscription/components/PremiumBadge';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const { settings, updateSettings, sync } = useSettings();

  return (
    <Screen scrollable>
      <Header title="Settings" />

      {!isPremium ? (
        <GlassCard className="mb-6 p-4" glow>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text variant="h3">Upgrade to Premium</Text>
              <Text variant="body-sm" className="mt-1">
                Faster refresh, trader DNA, AI coach, full radar — improve decisions, not just charts.
              </Text>
            </View>
            <PremiumBadge size="md" />
          </View>
          <Button className="mt-4" onPress={() => router.push('/subscription')}>
            View Plans
          </Button>
        </GlassCard>
      ) : null}

      <Text variant="label" className="mb-2 px-1">
        Appearance
      </Text>
      <ThemeToggle />

      <Text variant="label" className="mb-2 mt-6 px-1">
        Account
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="person-outline"
          label="Profile"
          description={user?.email ?? 'Manage your account'}
          showChevron
          onPress={() => router.push('/settings/profile')}
        />
        <SettingsRow
          icon="pulse-outline"
          label="Market data health"
          description="API keys & refresh policy"
          showChevron
          onPress={() => router.push('/settings/market-data' as never)}
        />
        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          showChevron
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy & Security"
          showChevron
          onPress={() => router.push('/settings/privacy')}
        />
      </GlassCard>

      <Text variant="label" className="mb-2 mt-6 px-1">
        Preferences
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="phone-portrait-outline"
          label="Haptic Feedback"
          toggle
          toggleValue={settings.hapticsEnabled}
          onToggle={(value) => void updateSettings({ hapticsEnabled: value })}
        />
        <SettingsRow
          icon="finger-print-outline"
          label="Biometric Login"
          toggle
          toggleValue={settings.biometricAuthEnabled}
          onToggle={(value) => void updateSettings({ biometricAuthEnabled: value })}
        />
      </GlassCard>

      <Text variant="label" className="mb-2 mt-6 px-1">
        Subscription
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="diamond-outline"
          label="Manage Subscription"
          value={isPremium ? 'Premium' : 'Free'}
          showChevron
          onPress={() => router.push('/subscription')}
        />
      </GlassCard>

      <View className="mt-8 gap-3">
        <Button variant="secondary" onPress={() => void sync()}>
          Sync Settings
        </Button>
        <Button variant="danger" onPress={() => void signOut()}>
          Sign Out
        </Button>
      </View>

      <Text variant="caption" className="mt-6 text-center">
        TradeVision AI v1.0.0
      </Text>
    </Screen>
  );
}
