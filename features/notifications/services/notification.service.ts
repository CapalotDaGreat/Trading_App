import {
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { requireDb, isFirebaseConfigured } from '@/firebase/config';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PushTokenRecord {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string | null;
  updatedAt: string;
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
  cancelAllScheduled(): Promise<void>;
  setBadgeCount(count: number): Promise<void>;
}

const USERS_COLLECTION = 'users';
const FCM_TOKENS_FIELD = 'fcmTokens';

function userDocRef(uid: string) {
  return doc(requireDb(), USERS_COLLECTION, uid);
}

function mapPermissionStatus(
  status: Notifications.PermissionStatus,
): NotificationPermissionStatus {
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
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

    try {
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      return token.data;
    } catch {
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
        lightColor: '#00D4AA',
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
      token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
      deviceName: Device.deviceName,
      updatedAt: new Date().toISOString(),
    };

    const ref = userDocRef(uid);
    try {
      await updateDoc(ref, {
        [FCM_TOKENS_FIELD]: arrayUnion(record),
        pushTokenUpdatedAt: serverTimestamp(),
      });
    } catch {
      await setDoc(
        ref,
        {
          [FCM_TOKENS_FIELD]: [record],
          pushTokenUpdatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  }

  async removeTokenFromFirestore(uid: string, token: string): Promise<void> {
    if (!isFirebaseConfigured()) return;

    // Firestore arrayRemove needs exact object match; store tokens in a map in production.
    // For Expo Go, we mark removal via a dedicated field.
    await updateDoc(userDocRef(uid), {
      removedPushToken: token,
      pushTokenUpdatedAt: serverTimestamp(),
    } as DocumentData);
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    triggerSeconds = 1,
  ): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds },
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
