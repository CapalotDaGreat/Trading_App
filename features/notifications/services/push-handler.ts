import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { logger } from '@/shared/services/observability/logger';

import { isNotificationRuntimeSupported } from './notification-capability';
import { notificationService } from './notification.service';

type NotificationData = {
  screen?: string;
  symbol?: string;
  type?: string;
};

type NotificationSubscription = { remove: () => void };

function handleNotificationNavigation(
  data: NotificationData | undefined,
  router: ReturnType<typeof useRouter>,
): void {
  if (!data?.screen) return;

  switch (data.screen) {
    case 'markets':
      router.push('/(tabs)/markets');
      break;
    case 'portfolio':
      router.push('/(tabs)/portfolio');
      break;
    case 'ai':
      router.push('/(tabs)/ai');
      break;
    case 'subscription':
      router.push('/subscription');
      break;
    case 'settings':
      router.push('/settings');
      break;
    default:
      break;
  }
}

export function usePushNotificationHandler(): void {
  const router = useRouter();
  const responseListener = useRef<NotificationSubscription | null>(null);
  const receivedListener = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    if (!isNotificationRuntimeSupported()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        // Lazy require — never load expo-notifications inside Expo Go.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications') as typeof import('expo-notifications');
        if (cancelled) return;

        receivedListener.current = Notifications.addNotificationReceivedListener(() => {
          // Foreground notifications are handled by setNotificationHandler.
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response.notification.request.content.data as
              | NotificationData
              | undefined;
            handleNotificationNavigation(data, router);
          },
        );

        const response = await Notifications.getLastNotificationResponseAsync();
        if (cancelled || !response) return;
        const data = response.notification.request.content.data as NotificationData | undefined;
        handleNotificationNavigation(data, router);
      } catch (error) {
        logger.debug('push.listeners_unavailable', {
          message: error instanceof Error ? error.message : 'unknown',
        });
      }
    })();

    return () => {
      cancelled = true;
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}

export async function initializePushNotifications(uid: string | null): Promise<void> {
  if (!uid || !isNotificationRuntimeSupported()) return;
  await notificationService.registerForPushNotifications(uid);
}

export { handleNotificationNavigation };
