import { Ionicons } from '@expo/vector-icons';

import { Tag } from '@/shared/components/ui/Tag';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface PremiumBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function PremiumBadge({ size = 'sm', className }: PremiumBadgeProps) {
  const isSmall = size === 'sm';
  const { colors } = useTheme();

  return (
    <Tag
      label="PREMIUM"
      tone="premium"
      leading={<Ionicons name="diamond" size={isSmall ? 10 : 12} color={colors.premium.primary} />}
      className={cn(isSmall ? 'min-h-6 px-2 py-0.5' : 'min-h-7 px-3 py-1', className)}
      textClassName={cn('font-bold tracking-wide', isSmall ? 'text-[10px]' : 'text-xs')}
    />
  );
}
