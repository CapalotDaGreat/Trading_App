import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatDate, formatMarketTime, formatRelativeTime } from '@/shared/utils/date';

import { isStaleCalendarSnapshot, LIFECYCLE_LABELS } from '../services/event-status.service';
import type { MarketEventCardModel } from '../types/events.types';
import { EventArticleRow } from './EventArticleRow';

const LIFECYCLE_VARIANT: Record<MarketEventCardModel['lifecycle'], 'default' | 'warning' | 'outline' | 'accent'> = {
  upcoming: 'accent',
  developing: 'warning',
  released: 'default',
  historical: 'outline',
};

export function MarketEventCard({
  event,
  variant = 'full',
}: {
  event: MarketEventCardModel;
  variant?: 'beginner' | 'full';
}) {
  const router = useRouter();
  const beginner = variant === 'beginner';
  const stale = isStaleCalendarSnapshot(event.freshness.kind);
  const badgeKind =
    event.freshness.kind === 'sample'
      ? 'sample'
      : event.freshness.kind === 'delayed'
        ? 'delayed'
        : 'approximate';

  return (
    <GlassCard className="mb-3 p-3" testID={`market-event-${event.id}`}>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge label={LIFECYCLE_LABELS[event.lifecycle]} variant={LIFECYCLE_VARIANT[event.lifecycle]} size="sm" />
        <Badge label={event.categoryLabel} variant="outline" size="sm" />
        {!beginner ? <Badge label={`Importance ${event.importance.score}`} variant="outline" size="sm" /> : null}
        {event.countryCode ? <Badge label={event.countryCode} variant="outline" size="sm" /> : null}
        <DataSourceBadge kind={badgeKind} />
        {stale ? <Badge label="Stale snapshot" variant="warning" size="sm" /> : null}
      </View>

      <Text variant="h3" headingLevel={3} className="mt-2">
        {event.title}
      </Text>
      <Text variant="caption" className="mt-1 text-text-tertiary">
        {formatDate(event.scheduledAt, { weekday: 'short' })} · {formatMarketTime(event.scheduledAt)}
      </Text>
      <Text variant="caption" className="mt-1 text-text-tertiary" testID={stale ? 'event-stale-label' : undefined}>
        Freshness: {formatRelativeTime(event.freshness.fetchedAt)}. {event.freshness.note}
      </Text>

      <Text variant="label" className="mt-3">
        {beginner ? 'What is this event?' : event.lifecycle === 'released' || event.lifecycle === 'historical' ? 'What happened' : 'What is expected'}
      </Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        {event.whatHappenedOrExpected}
      </Text>
      <Text variant="label" className="mt-3">
        {beginner ? 'Why does it matter?' : 'TradeAcademy interpretation'}
      </Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        {event.whyMarketsMayCare} This is educational context, not a prediction and not copied from the source.
      </Text>

      <Text variant="caption" className="mt-3 text-text-tertiary">
        Affected markets: {event.relatedAssets.join(' · ')}
      </Text>
      {!beginner ? (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Relevant sectors: {event.relatedSectors.join(' · ')}
        </Text>
      ) : null}
      <Text variant="caption" className="mt-1 text-text-tertiary">
        Related concepts: {event.training.concepts.join(' · ')}
      </Text>
      {!beginner ? (
        <Text variant="caption" className="mt-2 text-text-tertiary">
          Importance reasons: {event.importance.reasons.join(' ')}
        </Text>
      ) : null}

      <View className="mt-3 flex-row flex-wrap gap-2">
        <Button
          size="sm"
          onPress={() => router.push(`/academy/lesson/${event.training.lessonId}` as never)}
        >
          {beginner ? 'Learn more' : 'Lesson'}
        </Button>
        {!beginner ? (
          <>
            <Button size="sm" variant="outline" onPress={() => router.push(event.training.practiceHref as never)}>
              Practice
            </Button>
            <Button size="sm" variant="outline" onPress={() => router.push(event.training.replayHref as never)}>
              Replay
            </Button>
            <Button size="sm" variant="ghost" onPress={() => router.push(event.training.simulateHref as never)}>
              Simulation
            </Button>
          </>
        ) : null}
      </View>

      {event.articles.map((article) => (
        <EventArticleRow key={article.url} article={article} />
      ))}
    </GlassCard>
  );
}
