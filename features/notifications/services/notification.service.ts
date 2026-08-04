import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import {
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { requireDb, isFirebaseConfigured } from '@/firebase/config';
import { colors } from '@/shared/constants/theme';
import { logger } from '@/shared/services/observability/logger';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PushTokenRecord {
  deviceId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string | null;
}

export interface NotificationPreferences {
  enabled: boolean;
  priceAlerts: boolean;
  aiInsights: boolean;
  marketNews: boolean;
  portfolioUpdates: boolean;
}

export interface NotificationService {
  requestPermissions(): Promise<NotificationPermissionStatus>;
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  registerForPushNotifications(uid: string): Promise<string | null>;
  saveTokenToFirestore(uid: string, token: string): Promise<void>;
  removeTokenFromFirestore(uid: string, token: string): Promise<void>;
  getExpoPushToken(): Promise<string | null>;
  scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    triggerSeconds?: number,
  ): Promise<string>;
  /** Immediate local notification — preferred from background alert evaluation. */
  presentLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<string>;
  cancelAllScheduled(): Promise<void>;
  setBadgeCount(count: number): Promise<void>;
}

const USERS_COLLECTION = 'users';
const DEVICES_COLLECTION = 'devices';
const DEVICE_ID_STORAGE_KEY = 'tradevision-push-device-id';

function deviceDocRef(uid: string, deviceId: string) {
  return doc(requireDb(), USERS_COLLECTION, uid, DEVICES_COLLECTION, deviceId);
}

function userDocRef(uid: string) {
  return doc(requireDb(), USERS_COLLECTION, uid);
}

function createDeviceId(): string {
  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const deviceId = createDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

function mapPermissionStatus(status: Notifications.PermissionStatus): NotificationPermissionStatus {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted';
  if (status === Notifications.PermissionStatus.DENIED) return 'denied';
  return 'undetermined';
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationServiceImpl implements NotificationService {
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    if (!Device.isDevice) {
      return 'denied';
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === Notifications.PermissionStatus.GRANTED) {
      return 'granted';
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return mapPermissionStatus(status);
  }

  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return mapPermissionStatus(status);
  }

  async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;

    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
      // EAS project id from app config (Dev Client / production) — required for
      // real APNs/FCM tokens; Expo Go may still resolve via the Expo push proxy.
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
        ?.projectId ??
      Constants.easConfig?.projectId ??
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

    try {
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      logger.debug('push.token_acquired', {
        projectIdPresent: Boolean(projectId),
        tokenPrefix: token.data.slice(0, 12),
      });
      return token.data;
    } catch (error) {
      logger.warn('push.token_unavailable', { error, projectIdPresent: Boolean(projectId) });
      return null;
    }
  }

  async registerForPushNotifications(uid: string): Promise<string | null> {
    const permission = await this.requestPermissions();
    if (permission !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: colors.accent.primary,
      });
    }

    const token = await this.getExpoPushToken();
    if (token) {
      await this.saveTokenToFirestore(uid, token);
    }
    return token;
  }

  async saveTokenToFirestore(uid: string, token: string): Promise<void> {
    if (!isFirebaseConfigured()) return;

    const record: PushTokenRecord = {
      deviceId: await getOrCreateDeviceId(),
      token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
      deviceName: Device.deviceName,
    };

    await setDoc(deviceDocRef(uid, record.deviceId), {
      ...record,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(userDocRef(uid), {
      fcmTokens: deleteField(),
      removedPushToken: deleteField(),
      pushTokenUpdatedAt: deleteField(),
    }).catch((error) => logger.warn('push.legacy_token_cleanup_failed', { error }));
  }

  async removeTokenFromFirestore(uid: string, _token: string): Promise<void> {
    if (!isFirebaseConfigured()) return;

    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
    if (!deviceId) return;
    await deleteDoc(deviceDocRef(uid, deviceId));
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    triggerSeconds = 1,
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });
  }

  async presentLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  }

  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService: NotificationService = new NotificationServiceImpl();
