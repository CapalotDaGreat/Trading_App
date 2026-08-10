import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useInteractivePress } from '@/shared/hooks/useInteractivePress';
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
  accessibilityState,
  ...props
}: IconButtonProps) {
  const minTouch = getMinTouchTargetSize();
  const interaction = useInteractivePress({
    disabled: Boolean(disabled),
    haptic: haptic ? 'impact' : 'none',
    pressedScale: 0.92,
    onPress,
    onPressIn,
    onPressOut,
  });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={interaction.handlePress}
      onPressIn={interaction.handlePressIn}
      onPressOut={interaction.handlePressOut}
      style={[interaction.animatedStyle, { minWidth: minTouch, minHeight: minTouch }]}
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
