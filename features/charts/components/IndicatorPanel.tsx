import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { INDICATOR_LABELS, type IndicatorType } from '../utils/indicators';

interface IndicatorPanelProps {
  active: IndicatorType[];
  onToggle: (indicator: IndicatorType) => void;
  disabled?: IndicatorType[];
  className?: string;
}

const AVAILABLE_INDICATORS: IndicatorType[] = [
  'rsi',
  'macd',
  'ema',
  'sma',
  'bollinger',
  'atr',
  'adx',
  'stochastic',
  'vwap',
  'ichimoku',
  'fibonacci',
];

export function IndicatorPanel({
  active,
  onToggle,
  disabled = [],
  className,
}: IndicatorPanelProps) {
  return (
    <View className={cn('gap-2', className)}>
      <Text variant="label" className="mb-1">
        Indicators
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {AVAILABLE_INDICATORS.map((indicator) => {
          const isActive = active.includes(indicator);
          const isDisabled = disabled.includes(indicator);

          return (
            <Pressable
              key={indicator}
              onPress={() => !isDisabled && onToggle(indicator)}
              disabled={isDisabled}
              className={cn(
                'rounded-lg border px-3 py-1.5',
                isActive ? 'border-border-strong bg-accent-muted' : 'border-border bg-surface',
                isDisabled && 'opacity-40',
              )}
            >
              <Text
                variant="caption"
                className={cn(
                  'font-medium',
                  isActive ? 'text-accent' : 'text-text-secondary',
                )}
              >
                {INDICATOR_LABELS[indicator]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
