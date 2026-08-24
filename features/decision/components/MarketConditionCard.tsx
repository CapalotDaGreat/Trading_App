import { View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { marketConditionWhy } from '@/features/decision/components/RegimeCard';
import type { DecisionBrief, ImpactLevel } from '@/features/decision/types/decision.types';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION } from '@/shared/constants/trust-language';

interface MarketConditionCardProps {
  brief: DecisionBrief;
}

function eventCaption(
  event: { title: string; at: number; impact: ImpactLevel } | undefined,
): string | null {
  if (!event) return null;
  return `${event.title} · ${event.impact} impact · ${new Date(event.at).toLocaleString()}`;
}

export function MarketConditionCard({ brief }: MarketConditionCardProps) {
  const why = brief.regimeSnapshot
    ? marketConditionWhy(brief.regimeSnapshot)
    : CALM_ATTENTION.researchBeforeDeciding;
  const upcoming = eventCaption(brief.highImpactEvents[0]);

  return (
    <Surface padding="md" tone="subtle" testID="today-regime-freshness">
      <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
        Market condition
      </Text>
      <Text
        variant="h3"
        headingLevel={2}
        accessibilityLabel={`Market condition ${brief.regimeLabel}`}
      >
        {brief.regimeLabel}
      </Text>
      <Text variant="body-sm" className="mt-2 leading-6 text-text-secondary">
        Why it matters: {why}
      </Text>
      {upcoming ? (
        <Text variant="caption" className="mt-2 leading-5 text-text-tertiary" testID="today-upcoming-event">
          Calendar: {upcoming}
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        {brief.provenance ? <DataSourceBadge kind={brief.provenance.kind} /> : null}
        <DataFreshnessBadge fetchedAt={brief.quotesFetchedAt} />
      </View>
    </Surface>
  );
}
