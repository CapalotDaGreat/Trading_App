import { View } from 'react-native';

import type { SimulationAccount } from '@/features/simulation/types/simulation.types';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';
import { formatPercent, formatPrice } from '@/shared/utils/format';

interface SimulationSummaryProps {
  account: SimulationAccount;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[44%] flex-1">
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text variant="body-sm" className="mt-0.5 text-text-secondary">
        {value}
      </Text>
    </View>
  );
}

export function SimulationSummary({ account }: SimulationSummaryProps) {
  const currency = account.currency;
  const exposurePct =
    account.equity > 0 ? (account.investedAmount / account.equity) * 100 : 0;

  return (
    <Surface className="mb-4" testID="simulate-summary">
      <Text variant="label" className="text-text-tertiary">
        {BRAND.simulatedLabel} PORTFOLIO
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        Equity {formatPrice(account.equity, currency)}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Simulated capital. Return does not grade the decision.
      </Text>
      <View className="mt-4 flex-row flex-wrap gap-y-3">
        <Metric label="Cash" value={formatPrice(account.cashBalance, currency)} />
        <Metric
          label="Exposure"
          value={`${formatPrice(account.investedAmount, currency)} · ${formatPercent(exposurePct, { showSign: false })}`}
        />
        <Metric
          label="Drawdown"
          value={formatPercent(account.drawdown * 100, { showSign: false })}
        />
        <Metric
          label="Positions"
          value={`${account.positions.length} open`}
        />
      </View>
    </Surface>
  );
}
