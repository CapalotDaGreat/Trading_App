import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface ProgressPulseProps {
  progress: number;
  target: number;
  label?: string;
  completeLabel?: string;
  className?: string;
  testID?: string;
}

/** Subtle progress bar used for goals / passport / academy completion. */
export function ProgressPulse({
  progress,
  target,
  label,
  completeLabel = 'Complete',
  className,
  testID,
}: ProgressPulseProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const width = useSharedValue(0);
  const glow = useSharedValue(0);
  const pct = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;
  const complete = pct >= 100;

  useEffect(() => {
    if (reduceMotion) {
      width.value = pct;
      glow.value = complete ? 1 : 0;
      return;
    }
    width.value = withSpring(pct, { damping: 18, stiffness: 160 });
    glow.value = withTiming(complete ? 1 : 0, { duration: 280 });
  }, [pct, complete, reduceMotion, width, glow]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(4, width.value)}%`,
    opacity: 0.75 + glow.value * 0.25,
  }));

  return (
    <View
      className={cn('gap-1.5', className)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: target, now: progress }}
      accessibilityLabel={label ?? 'Progress'}
      testID={testID}
    >
      {label ? (
        <View className="flex-row items-center justify-between">
          <Text variant="caption" className="text-text-secondary">
            {label}
          </Text>
          <Text variant="caption" className={complete ? 'text-bullish' : 'text-text-tertiary'}>
            {complete ? completeLabel : `${progress}/${target}`}
          </Text>
        </View>
      ) : null}
      <View className="h-1.5 overflow-hidden rounded-full bg-border">
        <Animated.View
          className="h-full rounded-full"
          style={[{ backgroundColor: complete ? colors.bullish.primary : colors.accent.primary }, barStyle]}
        />
      </View>
    </View>
  );
}
