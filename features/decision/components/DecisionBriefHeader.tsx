import { View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import type { DecisionBrief, ImpactLevel } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';
import { formatPercent, getPriceColorClass } from '@/shared/utils/format';

interface DecisionBriefHeaderProps {
  brief: DecisionBrief;
  onOpenRadar?: () => void;
  isLoading?: boolean;
}

const IMPACT_VARIANT: Record<ImpactLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

export function DecisionBriefHeader({
  brief,
  onOpenRadar,
  isLoading = false,
}: DecisionBriefHeaderProps) {
  if (isLoading) {
    return (
      <GlassCard className="p-4" glow>
        <Skeleton height={24} width="55%" className="mb-3" />
        <Skeleton height={16} width="40%" className="mb-4" />
        <Skeleton height={72} className="mb-3" />
        <Skeleton height={44} rounded="lg" />
      </GlassCard>
    );
  }

  const events = brief.highImpactEvents.slice(0, 3);
  const portfolioColor =
    brief.portfolioChangePercent !== undefined
      ? getPriceColorClass(brief.portfolioChangePercent)
      : undefined;

  return (
    <GlassCard className="p-4" glow>
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="h2" className="mb-1">
            {brief.greeting}
          </Text>
          <Text variant="caption" className="text-text-tertiary">
            {formatRelativeTime(brief.generatedAt)}
          </Text>
        </View>
        <DataFreshnessBadge fetchedAt={brief.quotesFetchedAt} />
      </View>

      <View className="mb-3 flex-row flex-wrap items-center gap-2">
        <Badge label={brief.regimeLabel} variant="accent" size="sm" />
        <Badge label={`${brief.setupCount} setups`} variant="default" size="sm" />
        {brief.portfolioChangePercent !== undefined ? (
          <Text variant="caption" className={portfolioColor}>
            Portfolio {formatPercent(brief.portfolioChangePercent)}
          </Text>
        ) : null}
      </View>

      <Text variant="h3" className="mb-1">
        {brief.headline}
      </Text>
      <Text variant="body-sm" className="mb-3 leading-relaxed text-text-secondary">
        {brief.summary}
      </Text>

      {events.length > 0 ? (
        <View className="mb-4 gap-2">
          <Text variant="caption" className="font-semibold uppercase tracking-wide">
            High-impact events
          </Text>
          {events.map((event) => (
            <View
              key={event.id}
              className="flex-row items-center justify-between gap-2 rounded-lg border border-border/50 bg-surface/20 px-2.5 py-2"
            >
              <View className="flex-1">
                <Text variant="caption" className="font-medium text-text-primary" numberOfLines={1}>
                  {event.title}
                </Text>
                <Text variant="caption">{formatRelativeTime(event.at)}</Text>
              </View>
              <Badge
                label={event.impact}
                variant={IMPACT_VARIANT[event.impact]}
                size="sm"
              />
            </View>
          ))}
        </View>
      ) : null}

      {onOpenRadar ? (
        <Button variant="primary" fullWidth onPress={onOpenRadar}>
          Open Setup Radar
        </Button>
      ) : null}
    </GlassCard>
  );
}
