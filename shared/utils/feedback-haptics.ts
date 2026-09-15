import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/shared/stores/settings.store';

export type FeedbackHapticKind = 'success' | 'selection' | 'warning' | 'light';

/**
 * Preference-gated haptic feedback for meaningful learning milestones.
 * No-ops on web and when the user disables haptics.
 */
export function feedbackHaptic(kind: FeedbackHapticKind = 'selection'): void {
  if (Platform.OS === 'web') return;
  if (!useSettingsStore.getState().hapticsEnabled) return;

  const run = (() => {
    switch (kind) {
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'light':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'selection':
      default:
        return Haptics.selectionAsync();
    }
  })();

  void Promise.resolve(run).catch(() => undefined);
}
