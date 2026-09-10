import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { notificationService } from '@/features/notifications/services/notification.service';
import { SettingsRow } from '@/features/settings/components/SettingsRow';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION } from '@/shared/constants/trust-language';
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
      toast.success('Notifications enabled', CALM_ATTENTION.researchReminderReady);
      await updateNotifications({ pushEnabled: true });
    } else {
      toast.error('Permission denied', 'Enable notifications in system settings.');
    }
  };

  return (
    <ScreenScaffold
      title="Notifications"
      subtitle="Quiet study reminders — never a prompt to trade."
      showBack
      onBack={() => router.back()}
      contentClassName="pb-12"
    >
      {permission !== 'granted' ? (
        <Surface className="mb-6 p-4">
          <Text variant="h3">Enable study reminders</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Named levels and optional process notes can notify you later. This is not real-time
            trading urgency.
          </Text>
          <Button className="mt-4" onPress={() => void handleEnablePush()}>
            Enable reminders
          </Button>
        </Surface>
      ) : null}

      <Surface className="overflow-hidden">
        <SettingsRow
          icon="notifications-outline"
          label="Push notifications"
          toggle
          toggleValue={notifications.pushEnabled}
          onToggle={(value) => void updateNotifications({ pushEnabled: value })}
        />
        <SettingsRow
          icon="trending-up-outline"
          label="Named-level reminders"
          description="When a level you named is reached"
          toggle
          toggleValue={notifications.priceAlerts}
          onToggle={(value) => void updateNotifications({ priceAlerts: value })}
        />
        <SettingsRow
          icon="sparkles-outline"
          label="Process notes"
          description="Occasional coaching reminders — not trade ideas"
          toggle
          toggleValue={notifications.aiInsights}
          onToggle={(value) => void updateNotifications({ aiInsights: value })}
        />
        <SettingsRow
          icon="newspaper-outline"
          label="Calendar context"
          description="Events that may change research conditions"
          toggle
          toggleValue={notifications.marketNews}
          onToggle={(value) => void updateNotifications({ marketNews: value })}
        />
        <SettingsRow
          icon="briefcase-outline"
          label="Portfolio context"
          description="Concentration notes, not P&L alerts"
          toggle
          toggleValue={notifications.portfolioUpdates}
          onToggle={(value) => void updateNotifications({ portfolioUpdates: value })}
        />
        <SettingsRow
          icon="mail-outline"
          label="Weekly process digest"
          toggle
          toggleValue={notifications.emailDigest}
          onToggle={(value) => void updateNotifications({ emailDigest: value })}
        />
      </Surface>

      <View className="mt-6">
        <Text variant="caption" className="text-center text-text-tertiary">
          Permission status: {permission}
        </Text>
      </View>
    </ScreenScaffold>
  );
}
