import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import type { CandleInterval } from '@/shared/types/market';
import { cn } from '@/shared/utils/cn';

import { TIMEFRAME_OPTIONS } from '../constants/timeframes';

interface TimeframeSelectorProps {
  value: CandleInterval;
  onChange: (interval: CandleInterval) => void;
  className?: string;
}

export function TimeframeSelector({ value, onChange, className }: TimeframeSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('flex-row', className)}
      contentContainerClassName="gap-2 px-1"
    >
      {TIMEFRAME_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={cn(
              'rounded-full px-3.5 py-2',
              isActive ? 'bg-accent-muted' : 'bg-surface',
            )}
          >
            <Text
              variant="caption"
              className={cn('font-semibold', isActive ? 'text-accent' : 'text-text-secondary')}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export { TIMEFRAME_OPTIONS };
