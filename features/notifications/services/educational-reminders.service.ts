import { Platform } from 'react-native';

import { settingsService } from '@/features/settings/services/settings.service';
import { logger } from '@/shared/services/observability/logger';

import { isNotificationRuntimeSupported } from './notification-capability';

import type * as NotificationsNS from 'expo-notifications';

export type EducationalReminderKind = 'practice' | 'journal' | 'review' | 'replay';

const REMINDER_COPY: Record<
  EducationalReminderKind,
  { title: string; body: string; href: string }
> = {
  practice: {
    title: 'Practice a decision',
    body: 'A short drill keeps process sharp. This is education — not a buy or sell alert.',
    href: '/(tabs)/practice',
  },
  journal: {
    title: 'Journal one decision',
    body: 'Capture thesis, invalidation, and emotion while the session is fresh. Educational reflection only.',
    href: '/journal',
  },
  review: {
    title: 'Review your process',
    body: 'Open Review to grade reasoning — not simulated P/L. Training readiness is not live-trading readiness.',
    href: '/(tabs)/review',
  },
  replay: {
    title: 'Replay a decision',
    body: 'Blind replay trains judgment without future candles. Not a signal and not live execution.',
    href: '/decision/replay-tv',
  },
};

function inQuietHours(now = new Date(), startHour = 22, endHour = 7): boolean {
  const hour = now.getHours();
  if (startHour === endHour) return false;
  if (startHour > endHour) return hour >= startHour || hour < endHour;
  return hour >= startHour && hour < endHour;
}

type NotificationsModule = typeof NotificationsNS;
let notificationsModule: NotificationsModule | null | undefined;

function loadNotifications(): NotificationsModule | null {
  if (!isNotificationRuntimeSupported()) return null;
  if (notificationsModule !== undefined) return notificationsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch {
    notificationsModule = null;
  }
  return notificationsModule;
}

/**
 * Schedule a one-shot educational reminder. Never uses market-signal language.
 * Honours notification prefs + quiet hours. No-ops when unsupported or opted out.
 */
export async function scheduleEducationalReminder(
  kind: EducationalReminderKind,
  delaySeconds = 60 * 60 * 20,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const prefs = settingsService.getNotificationSettings();
  if (!prefs.pushEnabled || !prefs.trainingReminders) return null;
  if (inQuietHours(new Date(), prefs.quietHoursStart ?? 22, prefs.quietHoursEnd ?? 7)) return null;

  const Notifications = loadNotifications();
  if (!Notifications?.SchedulableTriggerInputTypes) return null;

  const copy = REMINDER_COPY[kind];
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: {
          kind: 'educational_reminder',
          reminder: kind,
          href: copy.href,
          educational: true,
        },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(60, delaySeconds),
        repeats: false,
      },
    });
    return id;
  } catch (error) {
    logger.debug('notifications.educational_reminder_failed', {
      kind,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

export function educationalReminderCopy(kind: EducationalReminderKind) {
  return REMINDER_COPY[kind];
}

export { inQuietHours };
