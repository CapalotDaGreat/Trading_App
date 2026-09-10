import { View } from 'react-native';

import { concentration } from '@/features/simulation/services/simulation-engine.service';
import type { SimulationAccount } from '@/features/simulation/types/simulation.types';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatPercent, formatPrice } from '@/shared/utils/format';

interface SimulationPositionListProps {
  account: SimulationAccount;
}

export function SimulationPositionList({ account }: SimulationPositionListProps) {
  const top = concentration(account);
  if (account.positions.length === 0) return null;

  return (
    <Surface className="mb-4" testID="simulate-positions">
      <Text variant="label" className="mb-1">
        Positions
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        Allocation and concentration matter as much as simulated P/L. A large weight is a process
        observation, not a trophy.
      </Text>
      {account.positions.map((position) => (
        <View key={position.symbol} className="mb-3 border-b border-border pb-3">
          <Text variant="label">
            {position.symbol} · {position.assetType}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            Qty {position.quantity} · avg {formatPrice(position.averageEntryPrice, account.currency)} · last{' '}
            {formatPrice(position.currentPrice, account.currency)}
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            Value {formatPrice(position.marketValue, account.currency)} · P/L{' '}
            {formatPrice(position.unrealizedPnL, account.currency)} · weight{' '}
            {formatPercent(position.portfolioWeight * 100, { showSign: false })}
          </Text>
        </View>
      ))}
      {top ? (
        <Text variant="caption" className="text-text-secondary" testID="simulate-concentration">
          Concentration: {top.symbol} is {formatPercent(top.portfolioWeight * 100, { showSign: false })} of
          simulated equity.
        </Text>
      ) : null}
    </Surface>
  );
}
