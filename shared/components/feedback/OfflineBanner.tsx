import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { Text } from '@/shared/components/ui/Text';
import { useConnectivityStatus } from '@/shared/hooks/useConnectivityStatus';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';

/**
 * Sticky connectivity chip: offline, sync pending, or guest/local demo.
 * Local Academy / Practice / Simulation / Journal / Review still work offline.
 */
export function OfflineBanner() {
  const { kind, refresh } = useConnectivityStatus();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  if (kind === 'online') return null;

  const copy =
    kind === 'guest_local'
      ? {
          title: 'Local demo — no cloud sync',
          body: 'Guest mode keeps lessons, practice, simulation, and journal on this device. Sign in for cloud backup when Firebase is configured.',
          icon: 'person-outline' as const,
          label: 'Local demo mode',
          tone: 'info' as const,
        }
      : kind === 'sync_pending'
        ? {
            title: 'Sync pending',
            body: 'Training progress is saved on this device and will upload when the connection is stable.',
            icon: 'cloud-upload-outline' as const,
            label: 'Sync pending. Tap to retry',
            tone: 'info' as const,
          }
        : {
            title: 'Offline — training stays on this device',
            body: 'Academy, Practice, Simulation, Journal, and Review do not need a network. Tap to retry live market and cloud sync.',
            icon: 'cloud-offline-outline' as const,
            label: 'Offline. Tap to retry connection',
            tone: 'warning' as const,
          };

  const iconColor = copy.tone === 'warning' ? colors.warning.primary : colors.accent.primary;
  const surfaceClass =
    copy.tone === 'warning' ? 'bg-warning-muted' : 'bg-accent-muted';
  const titleClass = copy.tone === 'warning' ? 'text-warning' : 'text-accent';

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(200)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(160)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID={
        kind === 'guest_local'
          ? 'guest-local-banner'
          : kind === 'sync_pending'
            ? 'sync-pending-banner'
            : 'offline-banner'
      }
    >
      <Pressable
        onPress={() => void refresh().then(() => undefined)}
        accessibilityRole="button"
        accessibilityLabel={copy.label}
        accessibilityHint="Checks network and sync status again"
        className={`mx-4 mb-2 flex-row items-center gap-2 rounded-xl px-3 py-2.5 ${surfaceClass}`}
      >
        <Ionicons name={copy.icon} size={18} color={iconColor} />
        <View className="flex-1">
          <Text variant="caption" className={`font-semibold ${titleClass}`}>
            {copy.title}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            {copy.body}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
