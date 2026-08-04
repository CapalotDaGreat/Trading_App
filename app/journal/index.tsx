import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard';
import { JournalForm } from '@/features/journal/components/JournalForm';
import {
  JournalInsightsPanel,
  JournalReviewsPanel,
  JournalTimelinePanel,
} from '@/features/journal/components/JournalLearningPanels';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { useJournalLearningJourney } from '@/features/journal/hooks/useJournalLearningJourney';
import type { JournalHubTab } from '@/features/journal/types/journal-learning-journey.types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatChange, formatNumber, formatPercent } from '@/shared/utils/format';

const TABS: Array<{ value: JournalHubTab; label: string }> = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'insights', label: 'Insights' },
  { value: 'entries', label: 'Entries' },
];

export default function JournalScreen() {
  const router = useRouter();
  const { symbol, from } = useLocalSearchParams<{ symbol?: string; from?: string }>();
  const { colors } = useTheme();
  const [tab, setTab] = useState<JournalHubTab>('timeline');
  const { canExport, createEntry, deleteEntry, exportJournal, isCreating } = useJournal();
  const { journey, stats, entries, isLoading } = useJournalLearningJourney();

  if (isLoading || !journey) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header
        title="Journal"
        subtitle="Your long-term learning journey"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        {from === 'onboarding' ? (
          <GlassCard className="p-4" testID="journal-onboarding-context">
            <Text variant="label">Close your first decision loop</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {symbol ? `${symbol.toUpperCase()} is prefilled. ` : ''}
              Saving a real entry completes activation; going back keeps your progress.
            </Text>
          </GlassCard>
        ) : null}

        <GlassCard className="p-4" bordered testID="journal-learning-headline">
          <Text variant="h3">{journey.headline}</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Every entry updates Decision Timeline, reviews, DNA, Decision Graph, and coaching —
            automatically.
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-4">
            <Stat label="Entries" value={String(journey.processCoverage.entries)} />
            <Stat
              label="Emotion tags"
              value={formatPercent(journey.processCoverage.emotionTaggedRate, { showSign: false })}
            />
            <Stat
              label="Lessons"
              value={formatPercent(journey.processCoverage.lessonsRate, { showSign: false })}
            />
            <Stat
              label="Plan adherence"
              value={formatPercent(journey.processCoverage.planAdherenceRate, { showSign: false })}
            />
          </View>
          <View className="mt-3 flex-row flex-wrap gap-4 border-t border-border pt-3">
            <Stat label="Closed" value={String(stats.totalTrades)} />
            <Stat label="Win rate" value={formatPercent(stats.winRate, { showSign: false })} />
            <Stat label="Total P&L" value={formatChange(stats.totalPnL)} />
            <Stat label="Profit factor" value={formatNumber(stats.profitFactor, 2)} />
          </View>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            P&L is context only — coaching grades process quality, never profits.
          </Text>
          {canExport ? (
            <View className="mt-3 flex-row gap-2">
              <Button size="sm" variant="outline" onPress={() => void exportJournal('csv')}>
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onPress={() => void exportJournal('json')}>
                Export JSON
              </Button>
            </View>
          ) : (
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Upgrade to Premium to export journal data.
            </Text>
          )}
        </GlassCard>

        <SegmentedControl options={TABS} value={tab} onChange={setTab} testID="journal-hub-tabs" />

        {tab === 'timeline' ? (
          <View className="gap-4">
            <JournalTimelinePanel journey={journey} />
            <JournalForm
              initialSymbol={symbol}
              onSubmit={async (input) => {
                await createEntry(input);
                if (from === 'onboarding') {
                  router.replace(
                    `/onboarding?journaled=1&symbol=${encodeURIComponent(input.symbol)}` as never,
                  );
                } else {
                  setTab('entries');
                }
              }}
              isSubmitting={isCreating}
            />
          </View>
        ) : null}

        {tab === 'reviews' ? <JournalReviewsPanel journey={journey} /> : null}

        {tab === 'insights' ? <JournalInsightsPanel journey={journey} /> : null}

        {tab === 'entries' ? (
          <View>
            <Text variant="h3" className="mb-2">
              Entries
            </Text>
            {entries.length === 0 ? (
              <EmptyState
                title="No journal entries"
                description="Log your first decision on the Timeline tab."
              />
            ) : (
              entries.map((entry) => (
                <JournalEntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={(id) => void deleteEntry(id)}
                />
              ))
            )}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[40%] flex-1">
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text variant="mono">{value}</Text>
    </View>
  );
}
