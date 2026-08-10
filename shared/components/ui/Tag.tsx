import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export type TagTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'premium';

export interface TagProps extends ViewProps {
  label: string;
  tone?: TagTone;
  leading?: ReactNode;
  selected?: boolean;
  textClassName?: string;
}

export const tagToneStyles: Record<TagTone, { container: string; text: string }> = {
  neutral: { container: 'bg-surface', text: 'text-text-secondary' },
  accent: { container: 'bg-accent-muted', text: 'text-accent' },
  success: { container: 'bg-bullish-muted', text: 'text-bullish' },
  danger: { container: 'bg-bearish-muted', text: 'text-bearish' },
  warning: { container: 'bg-warning-muted', text: 'text-warning' },
  info: { container: 'bg-info-muted', text: 'text-info' },
  premium: { container: 'bg-premium-muted', text: 'text-premium' },
};

/** Static metadata label. Use Chip only when the element performs an action. */
export function Tag({
  label,
  tone = 'neutral',
  leading,
  selected = false,
  className,
  textClassName,
  ...props
}: TagProps) {
  const styles = tagToneStyles[tone];

  return (
    <View
      className={cn(
        'min-h-7 flex-row items-center justify-center rounded-pill border border-transparent px-3 py-1',
        styles.container,
        selected && 'border-focus',
        className,
      )}
      {...props}
    >
      {leading}
      <Text
        variant="label"
        className={cn('text-xs', styles.text, leading && 'ml-1.5', textClassName)}
      >
        {label}
      </Text>
    </View>
  );
}
