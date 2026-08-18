import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type AlertBackgroundUnavailableReason =
  | 'web'
  | 'expo_go'
  | 'simulator'
  | 'restricted'
  | 'task_manager_unavailable'
  | 'unknown';

export interface AlertDeliveryCapability {
  /** Always true — foreground ~45s poll remains. */
  foregroundPolling: true;
  /** OS-scheduled background evaluation via expo-background-task. */
  backgroundEvaluation: boolean;
  reason?: AlertBackgroundUnavailableReason;
  /**
   * Honest user-facing copy. Background delivery is OS-scheduled (not instant);
   * never claim second-level latency.
   */
  summary: string;
}

const FOREGROUND_ONLY_SUMMARY =
  'Alerts are checked about every 45 seconds while TradeInsight is open. Background delivery is not available in this build — keep the app open, or use an EAS Dev Client / production install for OS-scheduled background checks.';

const BACKGROUND_AVAILABLE_SUMMARY =
  'While TradeInsight is open, alerts check about every 45 seconds. When the app is backgrounded or closed, the OS may wake TradeInsight periodically to re-check (often 15+ minutes later — not instant). Battery savers and low power can delay delivery.';

async function probeNativeBackground(): Promise<{
  available: boolean;
  reason?: AlertBackgroundUnavailableReason;
}> {
  try {
    const TaskManager = await import('expo-task-manager');
    const BackgroundTask = await import('expo-background-task');

    if (!(await TaskManager.isAvailableAsync())) {
      return { available: false, reason: 'task_manager_unavailable' };
    }

    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return { available: false, reason: 'restricted' };
    }

    return { available: status === BackgroundTask.BackgroundTaskStatus.Available };
  } catch {
    return { available: false, reason: 'unknown' };
  }
}

/**
 * Capability probe for alert delivery. Expo Go / web / simulators never claim
 * reliable background evaluation even if APIs partially load.
 */
export async function getAlertDeliveryCapability(): Promise<AlertDeliveryCapability> {
  if (Platform.OS === 'web') {
    return {
      foregroundPolling: true,
      backgroundEvaluation: false,
      reason: 'web',
      summary: FOREGROUND_ONLY_SUMMARY,
    };
  }

  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return {
      foregroundPolling: true,
      backgroundEvaluation: false,
      reason: 'expo_go',
      summary: FOREGROUND_ONLY_SUMMARY,
    };
  }

  if (!Device.isDevice) {
    return {
      foregroundPolling: true,
      backgroundEvaluation: false,
      reason: 'simulator',
      summary:
        'Alerts poll while the app is open. Background evaluation requires a physical device with an EAS Dev Client or production build.',
    };
  }

  const probe = await probeNativeBackground();
  if (!probe.available) {
    return {
      foregroundPolling: true,
      backgroundEvaluation: false,
      reason: probe.reason ?? 'unknown',
      summary: FOREGROUND_ONLY_SUMMARY,
    };
  }

  return {
    foregroundPolling: true,
    backgroundEvaluation: true,
    summary: BACKGROUND_AVAILABLE_SUMMARY,
  };
}
