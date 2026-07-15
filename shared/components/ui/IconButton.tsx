import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useSettingsStore } from '@/shared/stores/settings.store';
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
  default: 'bg-surface border border-border active:bg-surface-active',
  ghost: 'bg-transparent active:bg-surface',
  accent: 'bg-accent-muted border border-border active:bg-surface-active',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
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
  const scale = useSharedValue(1);

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
        scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPressOut?.(e);
      }}
      style={animatedStyle}
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
