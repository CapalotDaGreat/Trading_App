import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { CurrencyPicker } from '@/features/settings/components/CurrencyPicker';
import type { DisplayCurrency } from '@/shared/constants/currency';
import { normalizeDisplayCurrency } from '@/shared/constants/currency';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatNumber, formatPrice } from '@/shared/utils/format';

import { convertAmount, parseFxPair, syntheticSpotRate } from '../services/fx-conversion.service';
import type { SimulationAccount } from '../types/simulation.types';

interface SimulationCurrencyPanelProps {
  account: SimulationAccount;
  preferredCurrency: string;
  onChangeAccountCurrency: (currency: DisplayCurrency) => void;
}

export function SimulationCurrencyPanel({
  account,
  preferredCurrency,
  onChangeAccountCurrency,
}: SimulationCurrencyPanelProps) {
  const book = normalizeDisplayCurrency(account.currency);
  const preferred = normalizeDisplayCurrency(preferredCurrency);
  const [amount, setAmount] = useState('10000');
  const [target, setTarget] = useState<DisplayCurrency>(book === 'USD' ? 'EUR' : 'USD');

  const converted = useMemo(() => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return null;
    const rate = syntheticSpotRate(book, target);
    return {
      rate,
      result: convertAmount(value, book, target),
    };
  }, [amount, book, target]);

  const mismatch = book !== preferred;

  return (
    <Surface className="mb-4" testID="simulate-currency-panel">
      <Text variant="label">Paper account currency</Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        Default is US dollars. Changing currency archives this book and opens a new starting balance
        in the currency you pick. We do not silently rewrite past paper P/L.
      </Text>
      <View className="mt-3">
        <CurrencyPicker
          value={book}
          onChange={(currency) => {
            if (currency === book) return;
            Alert.alert(
              'Archive and switch currency?',
              `New paper cash will be ${formatPrice(account.startingBalance, currency)}. History is archived, not deleted. Sample FX rates are educational, not live.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Archive and switch',
                  style: 'destructive',
                  onPress: () => onChangeAccountCurrency(currency),
                },
              ],
            );
          }}
          testID="simulate-currency-picker"
        />
      </View>
      {mismatch ? (
        <Text variant="caption" className="mt-2 text-warning">
          Settings prefers {preferred}, but this book is still {book}. Switch above if you want them to
          match.
        </Text>
      ) : null}

      <Text variant="label" className="mt-5">
        Sample currency conversion
      </Text>
      <Text variant="caption" className="mt-1 text-text-secondary">
        Synthetic spot only — labelled sample, not a live FX venue. Useful for seeing how a USD book
        translates into euros (or the reverse) before you size an FX pair.
      </Text>
      <Input
        containerClassName="mt-3"
        label={`Amount (${book})`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Convert into
      </Text>
      <View className="mt-2">
        <CurrencyPicker value={target} onChange={setTarget} />
      </View>
      {converted ? (
        <Text variant="body-sm" className="mt-3 text-text-secondary">
          {formatPrice(Number(amount), book)} ≈ {formatNumber(converted.result, target === 'JPY' ? 0 : 2)}{' '}
          {target} at {formatNumber(converted.rate, target === 'JPY' ? 2 : 4)} {target} per 1 {book}.
        </Text>
      ) : null}
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Buying EURUSD is a view on the pair (euros vs dollars), not the same as exchanging holiday cash.
        {parseFxPair('EURUSD') ? ' Use the ticket below to paper-trade the pair.' : ''}
      </Text>
    </Surface>
  );
}
