import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, TextInput, View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { ThemeToggle } from '@/features/settings/components/ThemeToggle';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { PremiumBadge } from '@/features/subscription/components/PremiumBadge';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { DEMO_USER_UID } from '@/firebase/config';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { LEGAL_URLS } from '@/shared/constants/legal';

export function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { isPremium, manage } = useSubscription();
  const { settings, updateSettings, sync } = useSettings();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const isGuest = user?.uid === DEMO_USER_UID;

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE') return;
    setIsDeleting(true);
    setDeletionError(null);
    try {
      await deleteAccount();
    } catch (error) {
      setDeletionError(
        (error as { message?: string }).message ??
          'Account deletion failed. Please sign in again and retry.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Screen scrollable>
      <Header title="Settings" />

      {!isPremium ? (
        <GlassCard className="mb-6 p-4" glow>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text variant="h3">Upgrade to Premium</Text>
              <Text variant="body-sm" className="mt-1">
                Faster refresh, trader DNA, process coaching, and full radar depth.
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
        Learning
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="school-outline"
          label="Educational Mode"
          description="How AI, scores, Replay, and Lab stay educational"
          showChevron
          onPress={() => router.push('/settings/educational-mode' as never)}
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
          onPress={() => void manage()}
        />
      </GlassCard>

      <Text variant="label" className="mb-2 mt-6 px-1">
        Legal & Support
      </Text>
      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="document-text-outline"
          label="Terms of Service"
          showChevron
          onPress={() => router.push('/settings/legal/terms' as never)}
        />
        <SettingsRow
          icon="lock-closed-outline"
          label="Privacy Policy"
          showChevron
          onPress={() => router.push('/settings/legal/privacy' as never)}
        />
        <SettingsRow
          icon="warning-outline"
          label="Risk & Investment Disclaimer"
          showChevron
          onPress={() => router.push('/settings/legal/risk' as never)}
        />
        <SettingsRow
          icon="shield-outline"
          label="Security & Cybersecurity"
          showChevron
          onPress={() => router.push('/settings/legal/security' as never)}
        />
        <SettingsRow
          icon="information-circle-outline"
          label="Account deletion information"
          showChevron
          onPress={() => router.push('/settings/legal/accountDeletion' as never)}
        />
        <SettingsRow
          icon="help-circle-outline"
          label="Support"
          showChevron
          onPress={() => void Linking.openURL(LEGAL_URLS.support)}
        />
      </GlassCard>

      {!isGuest ? (
        <>
          <Text variant="label" className="mb-2 mt-6 px-1">
            Delete Account
          </Text>
          <GlassCard className="p-4">
            <Text variant="body-sm">
              Permanently deletes your account and TradeVision app data. Deleting your account does
              not cancel Apple App Store or Google Play billing.
            </Text>
            <Button variant="secondary" className="mt-4" onPress={() => void manage()}>
              Manage Subscription First
            </Button>
            {!showDeleteConfirmation ? (
              <Button
                variant="danger"
                className="mt-3"
                onPress={() => setShowDeleteConfirmation(true)}
              >
                Delete Account
              </Button>
            ) : (
              <View className="mt-4">
                <Text variant="body-sm">
                  This cannot be undone. Type DELETE to permanently erase the account and app data.
                </Text>
                <TextInput
                  accessibilityLabel="Type DELETE to confirm account deletion"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={deletePhrase}
                  onChangeText={setDeletePhrase}
                  placeholder="DELETE"
                  placeholderTextColor="#64748B"
                  className="mt-3 rounded-xl border border-bearish px-4 py-3 text-text-primary"
                />
                {deletionError ? (
                  <Text variant="caption" className="mt-2 text-bearish">
                    {deletionError}
                  </Text>
                ) : null}
                <View className="mt-3 gap-3">
                  <Button
                    variant="danger"
                    disabled={deletePhrase !== 'DELETE'}
                    loading={isDeleting}
                    onPress={() => void handleDeleteAccount()}
                  >
                    Permanently Delete Account
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={isDeleting}
                    onPress={() => {
                      setShowDeleteConfirmation(false);
                      setDeletePhrase('');
                      setDeletionError(null);
                    }}
                  >
                    Keep Account
                  </Button>
                </View>
              </View>
            )}
          </GlassCard>
        </>
      ) : (
        <Text variant="caption" className="mt-6 px-1 text-text-secondary">
          Guest mode is local-only. Sign out to leave the demo, or create an account for cloud sync
          and account deletion controls.
        </Text>
      )}

      <View className="mt-8 gap-3">
        <Button variant="secondary" onPress={() => void sync()}>
          Sync Settings
        </Button>
        <Button variant="danger" onPress={() => void signOut()}>
          {isGuest ? 'Leave Guest Demo' : 'Sign Out'}
        </Button>
      </View>

      <Text variant="caption" className="mt-6 text-center">
        TradeVision AI v1.0.0
      </Text>
    </Screen>
  );
}
