import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface PremiumBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function PremiumBadge({ size = 'sm', className }: PremiumBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <View
      className={cn(
        'flex-row items-center rounded-full bg-accent',
        isSmall ? 'px-2 py-0.5' : 'px-3 py-1',
        className,
      )}
    >
      <Ionicons name="diamond" size={isSmall ? 10 : 12} color="#151922" />
      <Text
        className={cn(
          'ml-1 font-bold text-text-inverse',
          isSmall ? 'text-[10px]' : 'text-xs',
        )}
      >
        PREMIUM
      </Text>
    </View>
  );
}
