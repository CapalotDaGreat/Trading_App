import { Pressable, View } from 'react-native';

import {
  DISPLAY_CURRENCIES,
  DISPLAY_CURRENCY_LABELS,
  type DisplayCurrency,
  normalizeDisplayCurrency,
} from '@/shared/constants/currency';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface CurrencyPickerProps {
  value: string;
  onChange: (currency: DisplayCurrency) => void;
  testID?: string;
}

export function CurrencyPicker({ value, onChange, testID }: CurrencyPickerProps) {
  const selected = normalizeDisplayCurrency(value);

  return (
    <View testID={testID} className="flex-row flex-wrap gap-2">
      {DISPLAY_CURRENCIES.map((currency) => {
        const active = currency === selected;
        return (
          <Pressable
            key={currency}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={DISPLAY_CURRENCY_LABELS[currency]}
            onPress={() => onChange(currency)}
            className={cn(
              'min-h-11 items-center justify-center rounded-full px-3 py-1.5',
              active ? 'bg-accent-muted' : 'bg-surface',
            )}
          >
            <Text variant="caption" className={cn(active ? 'font-semibold text-accent' : 'text-text-secondary')}>
              {currency}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
