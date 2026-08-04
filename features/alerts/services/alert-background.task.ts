/**
 * Background alert evaluation — must be imported from app entry so
 * TaskManager.defineTask runs in global scope (not inside a React component).
 *
 * Uses expo-background-task (SDK 54) + expo-task-manager. OS schedules wakes;
 * minimumInterval is a lower bound, not a guarantee.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '@/shared/services/observability/logger';

export const ALERT_BACKGROUND_TASK_NAME = 'tradevision-alert-evaluation';
export const ALERT_BACKGROUND_UID_KEY = 'tradevision.alerts.background.uid';

/** Android WorkManager minimum is 15 minutes; treat as OS lower bound. */
export const ALERT_BACKGROUND_MIN_INTERVAL_MINUTES = 15;

let taskDefined = false;

export async function persistAlertBackgroundUid(uid: string | null): Promise<void> {
  try {
    if (!uid) {
      await AsyncStorage.removeItem(ALERT_BACKGROUND_UID_KEY);
      return;
    }
    await AsyncStorage.setItem(ALERT_BACKGROUND_UID_KEY, uid);
  } catch (error) {
    logger.warn('alerts.background_uid_persist_failed', { error });
  }
}

export async function readAlertBackgroundUid(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ALERT_BACKGROUND_UID_KEY);
  } catch {
    return null;
  }
}

/** Define the task once at module load when native modules exist. */
export function ensureAlertBackgroundTaskDefined(): void {
  if (taskDefined) return;
  if (process.env.NODE_ENV === 'test') {
    taskDefined = true;
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BackgroundTask = require('expo-background-task') as typeof import('expo-background-task');

    TaskManager.defineTask(ALERT_BACKGROUND_TASK_NAME, async () => {
      try {
        const uid = await readAlertBackgroundUid();
        if (!uid) {
          return BackgroundTask.BackgroundTaskResult.Success;
        }

        const { evaluateAlertsForUser } = await import('./alert-evaluator.service');
        await evaluateAlertsForUser(uid, { allowInactive: true });
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        logger.error('alerts.background_task_failed', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });

    taskDefined = true;
  } catch (error) {
    logger.warn('alerts.background_task_define_skipped', { error });
  }
}

ensureAlertBackgroundTaskDefined();

export async function registerAlertBackgroundTask(uid: string): Promise<boolean> {
  ensureAlertBackgroundTaskDefined();
  await persistAlertBackgroundUid(uid);

  try {
    const { getAlertDeliveryCapability } = await import('./alert-capability.service');
    const capability = await getAlertDeliveryCapability();
    if (!capability.backgroundEvaluation) return false;

    const TaskManager = await import('expo-task-manager');
    const BackgroundTask = await import('expo-background-task');

    const already = await TaskManager.isTaskRegisteredAsync(ALERT_BACKGROUND_TASK_NAME);
    if (!already) {
      await BackgroundTask.registerTaskAsync(ALERT_BACKGROUND_TASK_NAME, {
        minimumInterval: ALERT_BACKGROUND_MIN_INTERVAL_MINUTES,
      });
    }
    logger.info('alerts.background_task_registered', {
      uidPrefix: uid.slice(0, 6),
      minimumIntervalMinutes: ALERT_BACKGROUND_MIN_INTERVAL_MINUTES,
    });
    return true;
  } catch (error) {
    logger.warn('alerts.background_task_register_failed', { error });
    return false;
  }
}

export async function unregisterAlertBackgroundTask(): Promise<void> {
  await persistAlertBackgroundUid(null);
  try {
    const TaskManager = await import('expo-task-manager');
    const BackgroundTask = await import('expo-background-task');
    if (await TaskManager.isTaskRegisteredAsync(ALERT_BACKGROUND_TASK_NAME)) {
      await BackgroundTask.unregisterTaskAsync(ALERT_BACKGROUND_TASK_NAME);
    }
  } catch (error) {
    logger.warn('alerts.background_task_unregister_failed', { error });
  }
}
