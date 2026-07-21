import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { getMinTouchTargetSize } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconButtonVariant = 'default' | 'ghost' | 'accent';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  haptic?: boolean;
  className?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-surface active:bg-surface-active',
  ghost: 'bg-transparent active:bg-surface',
  accent: 'bg-accent-muted active:bg-surface-active',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'h-11 w-11 rounded-full',
  md: 'h-11 w-11 rounded-full',
  lg: 'h-12 w-12 rounded-full',
};

export function IconButton({
  icon,
  variant = 'default',
  size = 'md',
  haptic = true,
  disabled,
  className,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  ...props
}: IconButtonProps) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const minTouch = getMinTouchTargetSize();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={(e) => {
        if (haptic && hapticsEnabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.(e);
      }}
      onPressIn={(e) => {
        if (!reduceMotion) {
          scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduceMotion) {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }
        onPressOut?.(e);
      }}
      style={[animatedStyle, { minWidth: minTouch, minHeight: minTouch }]}
      className={cn(
        'items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-40',
        className,
      )}
      {...props}
    >
      {icon}
    </AnimatedPressable>
  );
}
