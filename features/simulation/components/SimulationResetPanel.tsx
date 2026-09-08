import { Alert } from 'react-native';

import type { SimulationResetSnapshot } from '@/features/simulation/types/simulation.types';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice } from '@/shared/utils/format';

interface SimulationResetPanelProps {
  snapshot: SimulationResetSnapshot;
  archiveCount: number;
  onConfirm: () => void;
}

export function SimulationResetPanel({ snapshot, archiveCount, onConfirm }: SimulationResetPanelProps) {
  const confirm = () => {
    Alert.alert(
      'Archive this simulation?',
      `Starting ${formatPrice(snapshot.startingBalance, snapshot.currency)} · equity ${formatPrice(snapshot.equity, snapshot.currency)} · return ${formatPercent(snapshot.totalReturn * 100)} · ${snapshot.tradeCount} trade${snapshot.tradeCount === 1 ? '' : 's'} · max drawdown ${formatPercent(snapshot.maxDrawdown * 100, { showSign: false })}. History is archived, not silently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive and reset',
          style: 'destructive',
          onPress: onConfirm,
        },
      ],
    );
  };

  return (
    <Surface className="mb-4" testID="simulate-reset-snapshot">
      <Text variant="label">Reset paper account</Text>
      <Text variant="caption" className="mt-2 text-text-secondary">
        Starting {formatPrice(snapshot.startingBalance, snapshot.currency)} · current equity{' '}
        {formatPrice(snapshot.equity, snapshot.currency)} · return{' '}
        {formatPercent(snapshot.totalReturn * 100)} · trades {snapshot.tradeCount} · max drawdown{' '}
        {formatPercent(snapshot.maxDrawdown * 100, { showSign: false })}.
      </Text>
      <Text variant="caption" className="mt-2 text-text-secondary">
        {archiveCount > 0
          ? `${archiveCount} archived simulation${archiveCount === 1 ? '' : 's'} kept on this device.`
          : 'The current ledger will be archived on this device.'}
      </Text>
      <Button className="mt-3" variant="outline" onPress={confirm}>
        Archive and reset
      </Button>
    </Surface>
  );
}
