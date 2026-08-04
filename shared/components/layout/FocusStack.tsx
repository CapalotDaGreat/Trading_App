import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { spacing } from '@/shared/constants/theme';
import { cn } from '@/shared/utils/cn';

type StackDensity = 'focus' | 'section' | 'compact';

const gapFor: Record<StackDensity, number> = {
  focus: spacing.focus,
  section: spacing.section,
  compact: spacing.lg,
};

export interface FocusStackProps extends ViewProps {
  children: ReactNode;
  /** focus = primary viewport rhythm; section = hub blocks; compact = dense lists. */
  density?: StackDensity;
  className?: string;
}

/** Vertical stack with Phase A calm spacing defaults. */
export function FocusStack({
  children,
  density = 'focus',
  className,
  style,
  ...props
}: FocusStackProps) {
  return (
    <View className={cn('w-full', className)} style={[{ gap: gapFor[density] }, style]} {...props}>
      {children}
    </View>
  );
}
