import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';

import type { CreateHoldingInput, Holding, UpdateHoldingInput } from '../types/portfolio.types';

interface HoldingFormProps {
  holding?: Holding | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  onCreate: (input: CreateHoldingInput) => Promise<unknown>;
  onUpdate: (holdingId: string, updates: UpdateHoldingInput) => Promise<unknown>;
  onDelete: (holdingId: string) => Promise<unknown>;
  onClose: () => void;
}

export function HoldingForm({
  holding,
  isSaving,
  isDeleting,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: HoldingFormProps) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averageCost, setAverageCost] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSymbol(holding?.symbol ?? '');
    setName(holding?.name ?? '');
    setQuantity(holding ? String(holding.quantity) : '');
    setAverageCost(holding ? String(holding.averageCost) : '');
    setCurrentPrice(holding ? String(holding.currentPrice) : '');
    setError(null);
  }, [holding]);

  const save = async () => {
    const parsedQuantity = Number(quantity);
    const parsedAverageCost = Number(averageCost);
    const parsedCurrentPrice = Number(currentPrice);
    if (
      !symbol.trim() ||
      !name.trim() ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !Number.isFinite(parsedAverageCost) ||
      parsedAverageCost < 0 ||
      !Number.isFinite(parsedCurrentPrice) ||
      parsedCurrentPrice < 0
    ) {
      setError('Enter a symbol, name, positive quantity, and valid prices.');
      return;
    }

    try {
      setError(null);
      if (holding) {
        await onUpdate(holding.id, {
          quantity: parsedQuantity,
          averageCost: parsedAverageCost,
          currentPrice: parsedCurrentPrice,
        });
      } else {
        await onCreate({
          symbol,
          name,
          quantity: parsedQuantity,
          averageCost: parsedAverageCost,
          currentPrice: parsedCurrentPrice,
          marketType: 'stocks',
          assetClass: 'equity',
          currency: 'USD',
          side: 'long',
        });
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save holding.');
    }
  };

  return (
    <GlassCard className="p-4">
      <Text variant="h3" className="mb-1">
        {holding ? `Edit ${holding.symbol}` : 'Add holding'}
      </Text>
      <Text variant="caption" className="mb-4 text-text-secondary">
        Prices are your entered or latest available values, not broker-verified performance.
      </Text>
      <View className="gap-3">
        <Input
          label="Symbol"
          autoCapitalize="characters"
          editable={!holding}
          value={symbol}
          onChangeText={setSymbol}
        />
        <Input label="Name" editable={!holding} value={name} onChangeText={setName} />
        <Input
          label="Quantity"
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Input
          label="Average cost"
          keyboardType="decimal-pad"
          value={averageCost}
          onChangeText={setAverageCost}
        />
        <Input
          label="Current / last known price"
          keyboardType="decimal-pad"
          value={currentPrice}
          onChangeText={setCurrentPrice}
        />
      </View>
      {error ? (
        <Text variant="caption" className="mt-3 text-bearish">
          {error}
        </Text>
      ) : null}
      <View className="mt-4 gap-2">
        <Button loading={isSaving} onPress={() => void save()}>
          {holding ? 'Save holding' : 'Add holding'}
        </Button>
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
