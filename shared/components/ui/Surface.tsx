import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useInteractivePress } from '@/shared/hooks/useInteractivePress';
import { getMinTouchTargetSize } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SurfaceLevel = 'base' | 'raised' | 'overlay';
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';
export type SurfaceTone =
  'default' | 'subtle' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type SurfaceEmphasis = 'quiet' | 'outlined' | 'strong';

export interface SurfaceProps extends Omit<ViewProps, 'children'> {
  children: ReactNode;
  level?: SurfaceLevel;
  padding?: SurfacePadding;
  tone?: SurfaceTone;
  interactive?: boolean;
  emphasis?: SurfaceEmphasis;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
  haptic?: boolean;
}

const levelStyles: Record<SurfaceLevel, string> = {
  base: 'bg-background-secondary',
  raised: 'bg-background-elevated',
  overlay: 'bg-surface-glass',
};

const paddingStyles: Record<SurfacePadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

const toneStyles: Record<SurfaceTone, string> = {
  default: '',
  subtle: 'bg-surface',
  accent: 'bg-accent-muted',
  success: 'bg-bullish-muted',
  warning: 'bg-warning-muted',
  danger: 'bg-bearish-muted',
  info: 'bg-info-muted',
};

const emphasisStyles: Record<SurfaceEmphasis, string> = {
  quiet: '',
  outlined: 'border border-border',
  strong: 'border border-border-strong',
};

/** Canonical flat surface. Card and GlassCard remain as migration wrappers. */
export function Surface({
  children,
  level = 'raised',
  padding = 'md',
  tone = 'default',
  interactive = false,
  emphasis = 'quiet',
  onPress,
  disabled = false,
  haptic = true,
  className,
  accessibilityRole,
  accessibilityState,
  style,
  ...props
}: SurfaceProps) {
  const isInteractive = interactive || Boolean(onPress);
  const interaction = useInteractivePress({
    disabled,
    haptic: haptic ? 'impact' : 'none',
    onPress,
  });
  const classes = cn(
    'overflow-hidden rounded-panel',
    levelStyles[level],
    toneStyles[tone],
    emphasisStyles[emphasis],
    paddingStyles[padding],
    isInteractive && 'active:bg-surface-active',
    disabled && 'bg-disabled',
    className,
  );

  if (isInteractive) {
    return (
      <AnimatedPressable
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityState={{ ...accessibilityState, disabled }}
        disabled={disabled}
        onPress={interaction.handlePress}
        onPressIn={interaction.handlePressIn}
        onPressOut={interaction.handlePressOut}
        className={classes}
        style={[interaction.animatedStyle, { minHeight: getMinTouchTargetSize() }, style]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
