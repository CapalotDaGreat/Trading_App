import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

type ChipTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected?: boolean;
  tone?: ChipTone;
  leading?: ReactNode;
  className?: string;
  textClassName?: string;
}

const toneStyles: Record<ChipTone, { container: string; text: string }> = {
  neutral: { container: 'bg-surface', text: 'text-text-secondary' },
  accent: { container: 'bg-accent-muted', text: 'text-accent' },
  success: { container: 'bg-bullish-muted', text: 'text-bullish' },
  danger: { container: 'bg-bearish-muted', text: 'text-bearish' },
  warning: { container: 'bg-warning-muted', text: 'text-warning' },
  info: { container: 'bg-info-muted', text: 'text-info' },
};

export function Chip({
  label,
  selected = false,
  tone = 'neutral',
  leading,
  disabled,
  className,
  textClassName,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  ...props
}: ChipProps) {
  const styles = toneStyles[tone];

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled), selected }}
      disabled={disabled}
      className={cn(
        'min-h-11 flex-row items-center justify-center rounded-pill border border-transparent px-4',
        styles.container,
        selected && 'border-focus',
        disabled && 'bg-disabled',
        className,
      )}
      {...props}
    >
      {leading}
      <Text
        variant="label"
        className={cn(
          styles.text,
          leading && 'ml-2',
          disabled && 'text-disabled-foreground',
          textClassName,
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}
