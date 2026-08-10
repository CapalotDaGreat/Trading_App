import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { cn } from '@/shared/utils/cn';

interface SkeletonProps extends ViewProps {
  width?: number | `${number}%`;
  height?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const roundedStyles = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = 'md',
  className,
  style,
  accessibilityLabel = 'Loading',
  ...props
}: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(opacity);
      opacity.value = 0.55;
      return () => cancelAnimation(opacity);
    }
    opacity.value = withRepeat(withTiming(0.72, { duration: 1200 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      className={cn('bg-surface-active', roundedStyles[rounded], className)}
      style={[{ width, height }, animatedStyle, style]}
      {...props}
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  gap?: number;
  itemHeight?: number;
  className?: string;
}

export function SkeletonGroup({
  count = 3,
  gap = 12,
  itemHeight = 16,
  className,
}: SkeletonGroupProps) {
  return (
    <View className={cn('w-full', className)} style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} height={itemHeight} />
      ))}
    </View>
  );
}
