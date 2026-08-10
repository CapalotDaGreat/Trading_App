import { type ReactNode } from 'react';
import { type ViewProps } from 'react-native';

import { Surface } from '@/shared/components/ui/Surface';

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
    <Surface
      level="raised"
      padding="none"
      tone={glow ? 'accent' : 'default'}
      emphasis={glow || bordered ? 'outlined' : 'quiet'}
      className={glow ? `border-border-accent ${className ?? ''}` : className}
      style={style}
      {...props}
    >
      {children}
    </Surface>
  );
}
