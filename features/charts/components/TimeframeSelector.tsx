import { ScrollView } from 'react-native';

import { Chip } from '@/shared/components/ui/Chip';
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
      accessibilityRole="tablist"
      accessibilityLabel="Chart timeframe"
      showsHorizontalScrollIndicator={false}
      className={cn('flex-row', className)}
      contentContainerClassName="gap-2 px-1"
    >
      {TIMEFRAME_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Chip
            key={option.value}
            label={option.label}
            accessibilityRole="tab"
            accessibilityLabel={`${option.label} timeframe`}
            selected={isActive}
            tone={isActive ? 'accent' : 'neutral'}
            onPress={() => onChange(option.value)}
            className="px-3.5"
          />
        );
      })}
    </ScrollView>
  );
}

export { TIMEFRAME_OPTIONS };
