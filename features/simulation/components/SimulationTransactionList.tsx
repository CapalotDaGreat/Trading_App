import type { SimulationAccount } from '@/features/simulation/types/simulation.types';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatPrice } from '@/shared/utils/format';

interface SimulationTransactionListProps {
  account: SimulationAccount;
}

export function SimulationTransactionList({ account }: SimulationTransactionListProps) {
  if (account.transactions.length === 0) return null;

  return (
    <Surface className="mb-4" testID="simulate-ledger">
      <Text variant="label" className="mb-2">
        Recent transactions
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        Ledger entries are immutable. History is for review, not for rewriting the score.
      </Text>
      {[...account.transactions].reverse().slice(0, 12).map((txn) => (
        <Text key={txn.id} variant="caption" className="mb-2 text-text-secondary">
          {txn.side.toUpperCase()} {txn.quantity} {txn.symbol} @ {formatPrice(txn.executionPrice, account.currency)}
          {txn.decisionId ? ' · linked decision' : ''}
          {txn.reason ? ` · ${txn.reason}` : ''}
        </Text>
      ))}
    </Surface>
  );
}
