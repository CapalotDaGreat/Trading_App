import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { notificationService } from './notification.service';

type NotificationData = {
  screen?: string;
  symbol?: string;
  type?: string;
};

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
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    receivedListener.current = Notifications.addNotificationReceivedListener(() => {
      // Foreground notifications are handled by setNotificationHandler.
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData | undefined;
      handleNotificationNavigation(data, router);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as NotificationData | undefined;
      handleNotificationNavigation(data, router);
    });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}

export async function initializePushNotifications(uid: string | null): Promise<void> {
  if (!uid) return;
  await notificationService.registerForPushNotifications(uid);
}

export { handleNotificationNavigation };
