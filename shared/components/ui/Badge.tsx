import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'warning' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface border-border',
  accent: 'bg-accent-muted border-transparent',
  success: 'bg-bullish-muted border-transparent',
  danger: 'bg-bearish-muted border-transparent',
  warning: 'bg-warning-muted border-transparent',
  outline: 'bg-transparent border-border',
};

const textVariantStyles: Record<BadgeVariant, string> = {
  default: 'text-text-secondary',
  accent: 'text-accent',
  success: 'text-bullish',
  danger: 'text-bearish',
  warning: 'text-warning',
  outline: 'text-text-secondary',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 rounded-md',
  md: 'px-2.5 py-1 rounded-lg',
};

const textSizeStyles: Record<BadgeSize, string> = {
  sm: 'text-2xs',
  md: 'text-xs',
};

export function Badge({ label, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <View
      className={cn(
        'self-start border',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
    >
      <Text
        variant="caption"
        className={cn('font-semibold uppercase tracking-wide', textVariantStyles[variant], textSizeStyles[size])}
      >
        {label}
      </Text>
    </View>
  );
}
