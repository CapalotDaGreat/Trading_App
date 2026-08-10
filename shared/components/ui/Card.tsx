import { type ComponentProps, type ReactNode } from 'react';
import { View, type PressableProps } from 'react-native';

import { Surface, type SurfaceEmphasis } from '@/shared/components/ui/Surface';

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

/** @deprecated Prefer Surface for new work. */
export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  onPress,
  disabled,
  ...props
}: CardProps) {
  const emphasis: SurfaceEmphasis = variant === 'outlined' ? 'outlined' : 'quiet';
  return (
    <Surface
      level="raised"
      emphasis={emphasis}
      padding={padding}
      interactive={Boolean(onPress)}
      onPress={onPress}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </Surface>
  );
}
