import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import type { PressableProps } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useSettingsStore } from '@/shared/stores/settings.store';

type HapticKind = 'impact' | 'selection' | 'none';

interface InteractivePressOptions {
  disabled?: boolean;
  haptic?: HapticKind;
  pressedScale?: number;
  onPress?: PressableProps['onPress'];
  onPressIn?: PressableProps['onPressIn'];
  onPressOut?: PressableProps['onPressOut'];
}

/**
 * Shared press feedback for design-system controls.
 * Motion is removed immediately when Reduce Motion changes; haptics respect app settings.
 */
export function useInteractivePress({
  disabled = false,
  haptic = 'impact',
  pressedScale = 0.97,
  onPress,
  onPressIn,
  onPressOut,
}: InteractivePressOptions) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion || disabled) {
      scale.value = 1;
    }
  }, [disabled, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress: PressableProps['onPress'] = (event) => {
    if (disabled) return;

    if (hapticsEnabled && haptic !== 'none') {
      const feedback =
        haptic === 'selection'
          ? Haptics.selectionAsync()
          : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void Promise.resolve(feedback).catch(() => undefined);
    }

    onPress?.(event);
  };

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    if (!disabled && !reduceMotion) {
      scale.value = withSpring(pressedScale, { damping: 15, stiffness: 400 });
    }
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    scale.value = reduceMotion ? 1 : withSpring(1, { damping: 15, stiffness: 400 });
    onPressOut?.(event);
  };

  return {
    animatedStyle,
    handlePress,
    handlePressIn,
    handlePressOut,
    reduceMotion,
  };
}
