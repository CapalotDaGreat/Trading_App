import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/shared/utils/cn';

interface GlassCardProps extends ViewProps {
  children: ReactNode;
  /** @deprecated Kept for call-site compatibility; blur is no longer used. */
  intensity?: number;
  /** Hairline border — off by default; prefer fill hierarchy. */
  bordered?: boolean;
  /**
   * Soft accent emphasis for CTAs / heroes — fill + accent border, never a drop shadow.
   */
  glow?: boolean;
  className?: string;
}

/**
 * Quiet surface container shared across the app.
 * Uses elevated fill (and optional accent wash) so cards sit in the layout
 * without frosted blur panels or floating shadow boxes.
 */
export function GlassCard({
  children,
  intensity: _intensity,
  bordered = false,
  glow = false,
  className,
  style,
  ...props
}: GlassCardProps) {
  return (
    <View
      className={cn(
        'overflow-hidden rounded-panel',
        glow
          ? 'border border-border-accent bg-accent-muted'
          : 'bg-background-elevated',
        bordered && !glow && 'border border-border',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
