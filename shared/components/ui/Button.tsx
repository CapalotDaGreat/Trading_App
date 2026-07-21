import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { getMinTouchTargetSize } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  haptic?: boolean;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent active:bg-accent-dark',
  secondary: 'bg-surface active:bg-surface-active',
  ghost: 'bg-transparent active:bg-surface',
  danger: 'bg-bearish active:opacity-90',
  outline: 'bg-accent-muted active:bg-surface',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3.5 rounded-full',
  md: 'min-h-11 px-5 rounded-full',
  lg: 'min-h-13 px-6 rounded-full',
};

const textVariantStyles: Record<ButtonVariant, string> = {
  primary: 'text-text-inverse font-semibold',
  secondary: 'text-text-primary font-medium',
  ghost: 'text-text-primary font-medium',
  danger: 'text-text-primary font-semibold',
  outline: 'text-accent font-semibold',
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  haptic = true,
  disabled,
  className,
  textClassName,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;
  const minTouch = getMinTouchTargetSize();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    if (!reduceMotion) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    if (!reduceMotion) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
    onPressOut?.(event);
  };

  const handlePress: PressableProps['onPress'] = (event) => {
    if (haptic && hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(event);
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, { minHeight: minTouch }]}
      className={cn(
        'flex-row items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.inverse : colors.accent.primary}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Animated.Text
            className={cn(
              textVariantStyles[variant],
              textSizeStyles[size],
              leftIcon && 'ml-2',
              rightIcon && 'mr-2',
              textClassName,
            )}
          >
            {children}
          </Animated.Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}
