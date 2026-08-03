import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';

/**
 * Sticky connectivity chip. Local journals / demo still work offline.
 */
export function OfflineBanner() {
  const { isOnline, refresh } = useOnlineStatus();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  if (isOnline) return null;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(200)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(160)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID="offline-banner"
    >
      <Pressable
        onPress={() => void refresh().then(() => undefined)}
        accessibilityRole="button"
        accessibilityLabel="Offline. Tap to retry connection"
        accessibilityHint="Checks network again"
        className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl bg-warning-muted px-3 py-2.5"
      >
        <Ionicons name="cloud-offline-outline" size={18} color={colors.warning.primary} />
        <View className="flex-1">
          <Text variant="caption" className="font-semibold text-warning">
            Offline — local demo & journal still work
          </Text>
          <Text variant="caption" className="text-text-secondary">
            Tap to retry live market and cloud sync
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
