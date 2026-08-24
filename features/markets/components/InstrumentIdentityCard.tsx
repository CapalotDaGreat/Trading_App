import { View } from 'react-native';

import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import type { Instrument } from '@/features/markets/types/instrument.types';
import {
  instrumentClassLabel,
  instrumentCountryLabel,
  isUsableMarketPrice,
} from '@/features/markets/types/instrument.types';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

interface InstrumentIdentityCardProps {
  instrument: Instrument;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  disabled?: boolean;
}

export function InstrumentIdentityCard({
  instrument,
  confirmLabel = 'Add this asset',
  onConfirm,
  onCancel,
  cancelLabel = 'Choose a different asset',
  disabled,
}: InstrumentIdentityCardProps) {
  const country = instrumentCountryLabel(instrument.country);
  const classLabel = instrumentClassLabel(instrument.assetClass);

  return (
    <View className="gap-3" testID="instrument-identity-card">
      <View className="rounded-2xl bg-surface px-4 py-3">
        <Text variant="h3" headingLevel={3}>
          {instrument.name}
        </Text>
        <Text variant="body" className="mt-1">
          {instrument.canonicalSymbol}
        </Text>
        {instrument.exchange ? (
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {instrument.exchange}
          </Text>
        ) : null}
        <Text variant="body-sm" className="text-text-secondary">
          {classLabel}
        </Text>
        {country ? (
          <Text variant="body-sm" className="text-text-secondary">
            {country}
          </Text>
        ) : null}
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          {instrument.lastQuoteKind ? <DataSourceBadge kind={instrument.lastQuoteKind} /> : null}
          <Text variant="caption" className="text-text-tertiary">
            {instrument.provider ? `Provider · ${instrument.provider}` : 'Resolved instrument'}
          </Text>
        </View>
      </View>
      {onConfirm ? (
        <Button
          onPress={onConfirm}
          disabled={disabled || !isUsableMarketPrice(instrument.lastQuotePrice)}
          accessibilityLabel={`${confirmLabel}: ${instrument.name}, ${instrument.canonicalSymbol}`}
        >
          {confirmLabel}
        </Button>
      ) : null}
      {onCancel ? (
        <Button variant="ghost" onPress={onCancel} disabled={disabled}>
          {cancelLabel}
        </Button>
      ) : null}
    </View>
  );
}
