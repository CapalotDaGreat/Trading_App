import { type ComponentProps, type ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { cn } from '@/shared/utils/cn';

type CardVariant = 'default' | 'elevated' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<ComponentProps<typeof View>, 'children'> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface',
  elevated: 'bg-background-elevated',
  outlined: 'border border-border-strong bg-background-elevated',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityState,
  ...props
}: CardProps) {
  const classes = cn(
    'rounded-card',
    variantStyles[variant],
    paddingStyles[padding],
    disabled && 'bg-disabled opacity-100',
    className,
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        className={cn(classes, 'min-h-11 active:bg-surface-active')}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole={accessibilityRole} className={classes} {...props}>
      {children}
    </View>
  );
}
