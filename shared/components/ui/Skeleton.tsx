import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

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
  ...props
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.8, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
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
