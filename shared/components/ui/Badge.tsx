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
  default: 'bg-surface',
  accent: 'bg-accent-muted',
  success: 'bg-bullish-muted',
  danger: 'bg-bearish-muted',
  warning: 'bg-warning-muted',
  outline: 'bg-surface',
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
  sm: 'px-2 py-0.5 rounded-full',
  md: 'px-2.5 py-1 rounded-full',
};

const textSizeStyles: Record<BadgeSize, string> = {
  sm: 'text-2xs',
  md: 'text-xs',
};

export function Badge({ label, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <View className={cn('self-start', variantStyles[variant], sizeStyles[size], className)}>
      <Text
        variant="caption"
        className={cn(
          'font-semibold tracking-wide',
          textVariantStyles[variant],
          textSizeStyles[size],
        )}
      >
        {label}
      </Text>
    </View>
  );
}
