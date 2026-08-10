import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useInteractivePress } from '@/shared/hooks/useInteractivePress';
import { useTheme } from '@/shared/hooks/useTheme';
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
  primary: 'text-text-on-accent font-semibold',
  secondary: 'text-text-primary font-medium',
  ghost: 'text-text-primary font-medium',
  danger: 'text-text-on-danger font-semibold',
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
  accessibilityLabel,
  accessibilityState,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const minTouch = getMinTouchTargetSize();
  const interaction = useInteractivePress({
    disabled: isDisabled,
    haptic: haptic ? 'impact' : 'none',
    onPress,
    onPressIn,
    onPressOut,
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (typeof children === 'string' ? children : undefined)
      }
      accessibilityState={{
        ...accessibilityState,
        disabled: isDisabled,
        busy: loading,
      }}
      disabled={isDisabled}
      onPress={interaction.handlePress}
      onPressIn={interaction.handlePressIn}
      onPressOut={interaction.handlePressOut}
      style={[interaction.animatedStyle, { minHeight: minTouch }]}
      className={cn(
        'flex-row items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        isDisabled && 'bg-disabled opacity-100',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? colors.text.onAccent
              : variant === 'danger'
                ? colors.text.onDanger
                : colors.accent.primary
          }
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
              isDisabled && 'text-disabled-foreground',
              textClassName,
            )}
            allowFontScaling
            maxFontSizeMultiplier={1.8}
          >
            {children}
          </Animated.Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}
