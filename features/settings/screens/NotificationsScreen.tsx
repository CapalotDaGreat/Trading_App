import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { notificationService } from '@/features/notifications/services/notification.service';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useToast } from '@/shared/components/feedback/Toast';

export function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { notifications, updateNotifications } = useSettings();
  const [permission, setPermission] = useState<string>('checking');

  useEffect(() => {
    void notificationService.getPermissionStatus().then(setPermission);
  }, []);

  const handleEnablePush = async () => {
    if (!user?.uid) {
      toast.warning('Sign in required', 'Sign in to enable push notifications.');
      return;
    }

    const token = await notificationService.registerForPushNotifications(user.uid);
    const status = await notificationService.getPermissionStatus();
    setPermission(status);

    if (token) {
      toast.success('Notifications enabled', 'You will receive price alerts and AI insights.');
      await updateNotifications({ pushEnabled: true });
    } else {
      toast.error('Permission denied', 'Enable notifications in system settings.');
    }
  };

  return (
    <Screen scrollable>
      <Header title="Notifications" onBack={() => router.back()} />

      {permission !== 'granted' ? (
        <GlassCard className="mb-6 p-4">
          <Text variant="h3">Enable Push Notifications</Text>
          <Text variant="body-sm" className="mt-2">
            Get real-time price alerts, AI trade insights, and portfolio updates.
          </Text>
          <Button className="mt-4" onPress={() => void handleEnablePush()}>
            Enable Notifications
          </Button>
        </GlassCard>
      ) : null}

      <GlassCard className="overflow-hidden">
        <SettingsRow
          icon="notifications-outline"
          label="Push Notifications"
          toggle
          toggleValue={notifications.pushEnabled}
          onToggle={(value) => void updateNotifications({ pushEnabled: value })}
        />
        <SettingsRow
          icon="trending-up-outline"
          label="Price Alerts"
          toggle
          toggleValue={notifications.priceAlerts}
          onToggle={(value) => void updateNotifications({ priceAlerts: value })}
        />
        <SettingsRow
          icon="sparkles-outline"
          label="AI Insights"
          toggle
          toggleValue={notifications.aiInsights}
          onToggle={(value) => void updateNotifications({ aiInsights: value })}
        />
        <SettingsRow
          icon="newspaper-outline"
          label="Market News"
          toggle
          toggleValue={notifications.marketNews}
          onToggle={(value) => void updateNotifications({ marketNews: value })}
        />
        <SettingsRow
          icon="briefcase-outline"
          label="Portfolio Updates"
          toggle
          toggleValue={notifications.portfolioUpdates}
          onToggle={(value) => void updateNotifications({ portfolioUpdates: value })}
        />
        <SettingsRow
          icon="mail-outline"
          label="Weekly Email Digest"
          toggle
          toggleValue={notifications.emailDigest}
          onToggle={(value) => void updateNotifications({ emailDigest: value })}
        />
      </GlassCard>

      <View className="mt-6">
        <Text variant="caption" className="text-center">
          Permission status: {permission}
        </Text>
      </View>
    </Screen>
  );
}
