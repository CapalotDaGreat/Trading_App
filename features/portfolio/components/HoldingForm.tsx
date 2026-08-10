import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import type { Instrument } from '@/features/markets/types/instrument.types';
import { instrumentClassLabel } from '@/features/markets/types/instrument.types';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

import { HoldingInstrumentPicker } from './HoldingInstrumentPicker';
import type { CreateHoldingInput, Holding, UpdateHoldingInput } from '../types/portfolio.types';
import { DuplicateHoldingError } from '../types/portfolio.types';

interface HoldingFormProps {
  holding?: Holding | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  onCreate: (input: CreateHoldingInput) => Promise<unknown>;
  onUpdate: (holdingId: string, updates: UpdateHoldingInput) => Promise<unknown>;
  onDelete: (holdingId: string) => Promise<unknown>;
  onClose: () => void;
}

type Step = 'search' | 'confirm' | 'lot';

export function HoldingForm({
  holding,
  isSaving,
  isDeleting,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: HoldingFormProps) {
  const [step, setStep] = useState<Step>(holding ? 'lot' : 'search');
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [quantity, setQuantity] = useState('');
  const [averageCost, setAverageCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Holding | null>(null);

  useEffect(() => {
    if (holding) {
      setStep('lot');
      setInstrument(null);
      setQuantity(String(holding.quantity));
      setAverageCost(String(holding.averageCost));
    } else {
      setStep('search');
      setInstrument(null);
      setQuantity('');
      setAverageCost('');
    }
    setError(null);
    setDuplicate(null);
  }, [holding]);

  const saveEdit = async () => {
    if (!holding) return;
    const parsedQuantity = Number(quantity);
    const parsedAverageCost = Number(averageCost);
    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isFinite(parsedAverageCost) ||
      parsedAverageCost < 0
    ) {
      setError('Enter a positive quantity and valid average cost.');
      return;
    }
    try {
      setError(null);
      await onUpdate(holding.id, {
        quantity: parsedQuantity,
        averageCost: parsedAverageCost,
        currentPrice: holding.currentPrice,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save holding.');
    }
  };

  const saveCreate = async () => {
    if (!instrument) {
      setError('Select a resolved market asset first.');
      return;
    }
    const parsedQuantity = Number(quantity);
    const parsedAverageCost = Number(averageCost);
    const price = instrument.lastQuotePrice;
    if (!price || price <= 0) {
      setError('Market data is unavailable for this asset — it cannot be added.');
      return;
    }
    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isFinite(parsedAverageCost) ||
      parsedAverageCost < 0
    ) {
      setError('Enter a positive quantity and valid average cost.');
      return;
    }

    try {
      setError(null);
      setDuplicate(null);
      await onCreate({
        instrumentId: instrument.id,
        symbol: instrument.symbol,
        canonicalSymbol: instrument.canonicalSymbol,
        name: instrument.name,
        marketType: instrument.marketType,
        assetClass: instrument.assetClass,
        quantity: parsedQuantity,
        averageCost: parsedAverageCost,
        currentPrice: price,
        currency: instrument.currency || 'USD',
        side: 'long',
        provider: instrument.provider,
        providerSymbol: instrument.providerSymbol,
        exchange: instrument.exchange,
      });
      onClose();
    } catch (cause) {
      if (cause instanceof DuplicateHoldingError) {
        setDuplicate(cause.holding);
        setError(cause.message);
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Unable to save holding.');
    }
  };

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-1">
        {holding ? `Edit ${holding.symbol}` : 'Add holding'}
      </Text>
      <Text variant="caption" className="mb-4 text-text-secondary">
        {holding
          ? 'Update quantity or cost basis. Instrument identity cannot change.'
          : 'Prices come from resolved market data — never invented.'}
      </Text>

      {!holding && step === 'search' ? (
        <HoldingInstrumentPicker
          disabled={isSaving}
          onResolved={(resolved) => {
            setInstrument(resolved);
            setStep('confirm');
            setError(null);
            setDuplicate(null);
          }}
        />
      ) : null}

      {!holding && step === 'confirm' && instrument ? (
        <View className="gap-3">
          <Text variant="label">Select asset</Text>
          <View className="rounded-2xl bg-surface px-4 py-3">
            <Text variant="h3" headingLevel={3}>
              {instrument.name}
            </Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {instrument.canonicalSymbol} · {instrumentClassLabel(instrument.assetClass)}
              {instrument.exchange ? ` · ${instrument.exchange}` : ''}
            </Text>
            <View className="mt-3 flex-row items-center gap-2">
              {instrument.lastQuoteKind ? (
                <DataSourceBadge kind={instrument.lastQuoteKind} />
              ) : null}
              <Text variant="caption" className="text-text-tertiary">
                Market data available
                {instrument.lastQuotePrice != null
                  ? ` · last ${instrument.lastQuotePrice.toFixed(2)} ${instrument.currency}`
                  : ''}
              </Text>
            </View>
          </View>
          <Button
            onPress={() => setStep('lot')}
            accessibilityLabel="Continue with selected asset"
          >
            Continue
          </Button>
          <Button
            variant="ghost"
            onPress={() => {
              setInstrument(null);
              setStep('search');
            }}
          >
            Choose a different asset
          </Button>
        </View>
      ) : null}

      {(holding || step === 'lot') && (
        <View className="gap-3">
          {!holding && instrument ? (
            <View className="rounded-xl bg-surface px-3 py-3">
              <Text variant="label">
                {instrument.name} · {instrument.canonicalSymbol}
              </Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                Last market price {instrument.lastQuotePrice?.toFixed(2)} {instrument.currency}{' '}
                (used as current price — not a recommendation)
              </Text>
            </View>
          ) : null}

          <Input
            label="Quantity"
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
            accessibilityLabel="Holding quantity"
          />
          <Input
            label="Average cost"
            keyboardType="decimal-pad"
            value={averageCost}
            onChangeText={setAverageCost}
            accessibilityLabel="Average cost basis"
          />
        </View>
      )}

      {error ? (
        <Text variant="caption" className="mt-3 text-bearish" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {duplicate ? (
        <View className="mt-3 gap-2 rounded-xl bg-surface px-3 py-3">
          <Text variant="body-sm" className="text-text-secondary">
            {duplicate.name} ({duplicate.symbol}) is already in your portfolio.
          </Text>
          <Button
            loading={isSaving}
            onPress={async () => {
              const parsedQuantity = Number(quantity);
              const parsedAverageCost = Number(averageCost);
              if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
                setError('Enter a positive quantity to update.');
                return;
              }
              try {
                await onUpdate(duplicate.id, {
                  quantity: parsedQuantity,
                  averageCost: Number.isFinite(parsedAverageCost)
                    ? parsedAverageCost
                    : duplicate.averageCost,
                });
                onClose();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Unable to update holding.');
              }
            }}
          >
            Update holding
          </Button>
          <Button variant="ghost" onPress={() => setDuplicate(null)}>
            Cancel
          </Button>
        </View>
      ) : null}

      <View className="mt-4 gap-2">
        {holding ? (
          <Button loading={isSaving} onPress={() => void saveEdit()}>
            Save holding
          </Button>
        ) : step === 'lot' ? (
          <Button loading={isSaving} onPress={() => void saveCreate()}>
            Add holding
          </Button>
        ) : null}
        {holding ? (
          <Button
            variant="danger"
            loading={isDeleting}
            onPress={async () => {
              try {
                setError(null);
                await onDelete(holding.id);
                onClose();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Unable to delete holding.');
              }
            }}
          >
            Delete holding
          </Button>
        ) : null}
        <Button variant="ghost" onPress={onClose}>
          Cancel
        </Button>
      </View>
    </GlassCard>
  );
}
