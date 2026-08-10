import { Ionicons } from '@expo/vector-icons';
import { useId, useState } from 'react';
import { Pressable, View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import type { DecisionBrief, ImpactLevel } from '@/features/decision/types/decision.types';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
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
  const { colors } = useTheme();
  const [eventsOpen, setEventsOpen] = useState(false);
  const eventsId = useId();

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <Skeleton height={24} width="55%" className="mb-3" />
        <Skeleton height={16} width="40%" className="mb-4" />
        <Skeleton height={72} className="mb-3" />
        <Skeleton height={44} rounded="lg" />
      </GlassCard>
    );
  }

  const events = brief.highImpactEvents.slice(0, 3);
  const focus = brief.focusSummary;
  const minutes = brief.estimatedResearchMinutes;
  const portfolioColor =
    brief.portfolioChangePercent !== undefined
      ? getPriceColorClass(brief.portfolioChangePercent)
      : undefined;

  return (
    <GlassCard className="p-4" testID="morning-brief-card">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="caption" className="mb-1 text-text-tertiary">
            Morning brief · {formatRelativeTime(brief.generatedAt)}
          </Text>
          <Text variant="h2" className="mb-1">
            {brief.greeting}
          </Text>
        </View>
        <View className="items-end gap-1">
          {brief.provenance ? <DataSourceBadge kind={brief.provenance.kind} /> : null}
          <DataFreshnessBadge fetchedAt={brief.quotesFetchedAt} />
        </View>
      </View>

      <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
        Your market environment
      </Text>
      <View className="mb-3 flex-row flex-wrap items-center gap-2">
        <Badge label={brief.regimeLabel} variant="accent" size="sm" />
        {brief.portfolioChangePercent !== undefined ? (
          <Text variant="caption" className={portfolioColor}>
            Portfolio {formatPercent(brief.portfolioChangePercent)}
          </Text>
        ) : null}
      </View>

      {focus ? (
        <View className="mb-3">
          <Text variant="caption" className="mb-1.5 font-semibold text-text-secondary">
            Your focus today
          </Text>
          <Text variant="body-sm" className="text-text-primary">
            {focus.opportunities} research candidate{focus.opportunities === 1 ? '' : 's'} ·{' '}
            {focus.risks} risk flag{focus.risks === 1 ? '' : 's'} · {focus.events} event
            {focus.events === 1 ? '' : 's'}
          </Text>
          {minutes !== undefined ? (
            <Text variant="caption" className="mt-1 text-accent">
              Estimated research time: {minutes} minutes
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text variant="body-sm" className="mb-3 leading-relaxed text-text-secondary">
        {brief.summary}
      </Text>

      {brief.psychologyReminder || brief.recommendedFocus || brief.timeBudgetMinutes ? (
        <View className="mb-3 rounded-xl bg-accent-muted/30 px-3 py-2.5">
          {brief.psychologyReminder ? (
            <Text variant="body-sm" className="text-text-primary">
              {brief.psychologyReminder}
            </Text>
          ) : null}
          <Text variant="caption" className="mt-1 text-accent">
            {[
              brief.recommendedFocus ? `Focus: ${brief.recommendedFocus}` : null,
              brief.timeBudgetMinutes ? `Budget: ${brief.timeBudgetMinutes} min` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      ) : null}

      {events.length > 0 ? (
        <View className="mb-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${events.length} market catalysts`}
            accessibilityHint={eventsOpen ? 'Collapses catalyst list' : 'Expands catalyst list'}
            accessibilityState={{ expanded: eventsOpen }}
            aria-controls={eventsId}
            testID="morning-brief-events-toggle"
            onPress={() => setEventsOpen((v) => !v)}
            className="mb-2 min-h-11 flex-row items-center justify-between"
          >
            <Text variant="caption" className="font-semibold text-text-secondary">
              {events.length} catalyst{events.length === 1 ? '' : 's'} to respect
            </Text>
            <Ionicons
              name={eventsOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.tertiary}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </Pressable>
          {eventsOpen ? (
            <View nativeID={eventsId}>
              {events.map((event) => (
                <View
                  key={event.id}
                  className="mb-2 flex-row items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2.5"
                >
                  <View className="flex-1">
                    <Text
                      variant="caption"
                      className="font-medium text-text-primary"
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>
                  </View>
                  <Badge label={event.impact} variant={IMPACT_VARIANT[event.impact]} size="sm" />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {onOpenRadar ? (
        <Button variant="primary" fullWidth onPress={onOpenRadar}>
          Review today’s research candidates
        </Button>
      ) : null}
    </GlassCard>
  );
}
