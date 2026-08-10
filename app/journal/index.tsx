import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

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
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatChange, formatNumber, formatPercent } from '@/shared/utils/format';

const TABS: Array<{ value: JournalHubTab; label: string }> = [
  { value: 'timeline', label: 'Overview' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'insights', label: 'Insights' },
  { value: 'entries', label: 'Entries' },
];

export default function JournalScreen() {
  const router = useRouter();
  const { symbol, from } = useLocalSearchParams<{ symbol?: string; from?: string }>();
  const [tab, setTab] = useState<JournalHubTab>('timeline');
  const [showReflectionForm, setShowReflectionForm] = useState(from === 'onboarding');
  const { canExport, createEntry, deleteEntry, exportJournal, isCreating } = useJournal();
  const { journey, stats, entries, isLoading } = useJournalLearningJourney();

  if (isLoading || !journey) {
    return (
      <ScreenScaffold title="Journal" scrollable={false} contentClassName="justify-center">
        <StatusState
          status="loading"
          title="Loading journal"
          description="Gathering reflections and process context."
        />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      title="Journal"
      subtitle="Reflect on decisions and notice how your process changes."
      contentClassName="pb-8"
      headerAction={
        <Button size="sm" onPress={() => setShowReflectionForm((value) => !value)}>
          {showReflectionForm ? 'Close' : 'New reflection'}
        </Button>
      }
    >
      <View className="gap-4">
        {from === 'onboarding' ? (
          <Surface padding="sm" tone="info" testID="journal-onboarding-context">
            <Text variant="label">Close your first decision loop</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {symbol ? `${symbol.toUpperCase()} is prefilled. ` : ''}
              Saving a real entry completes activation; going back keeps your progress.
            </Text>
          </Surface>
        ) : null}

        {showReflectionForm ? (
          <Surface emphasis="outlined" testID="journal-new-reflection">
            <Text variant="h2" headingLevel={2}>New reflection</Text>
            <Text variant="body-sm" className="mb-4 mt-1 text-text-secondary">
              Capture what you decided, what influenced you, and what you would repeat.
            </Text>
            <JournalForm
              initialSymbol={symbol}
              onSubmit={async (input) => {
                await createEntry(input);
                setShowReflectionForm(false);
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
          </Surface>
        ) : null}

        <Surface tone="accent" emphasis="outlined" testID="journal-learning-headline">
          <Text variant="label" className="text-accent">PROCESS TREND</Text>
          <Text variant="h2" headingLevel={2} className="mt-2">{journey.headline}</Text>
          <View className="mt-4 flex-row flex-wrap gap-4">
            <Stat label="Entries" value={String(journey.processCoverage.entries)} />
            <Stat
              label="Emotion tags"
              value={formatPercent(journey.processCoverage.emotionTaggedRate, { showSign: false })}
            />
            <Stat
              label="Plan adherence"
              value={formatPercent(journey.processCoverage.planAdherenceRate, { showSign: false })}
            />
          </View>
        </Surface>

        <Surface>
          <Text variant="label" className="text-text-tertiary">ONE COACHING INSIGHT</Text>
          <Text variant="body" className="mt-2">
            {journey.coach?.recommendation ??
              'Add emotion and lesson notes to help coaching identify a repeatable process pattern.'}
          </Text>
        </Surface>

        <SegmentedControl options={TABS} value={tab} onChange={setTab} testID="journal-hub-tabs" />

        {tab === 'timeline' ? (
          <View className="gap-4">
            <View>
              <Text variant="h2" headingLevel={2}>Recent reflections</Text>
              <Text variant="body-sm" className="mb-3 mt-1 text-text-secondary">
                Notes you authored about your decisions.
              </Text>
              {entries.length === 0 ? (
                <EmptyState
                  title="No reflections yet"
                  description="Authored notes explain what shaped a decision and what you would repeat. Without them, coaching cannot spot process patterns."
                  actionLabel="New reflection"
                  onAction={() => setShowReflectionForm(true)}
                  className="px-4 py-8"
                />
              ) : (
                entries.slice(0, 5).map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => void deleteEntry(id)}
                  />
                ))
              )}
              {entries.length > 5 ? (
                <Button size="sm" variant="ghost" onPress={() => setTab('entries')}>
                  View all reflections
                </Button>
              ) : null}
            </View>
            <JournalTimelinePanel journey={journey} />
          </View>
        ) : null}

        {tab === 'reviews' ? <JournalReviewsPanel journey={journey} /> : null}

        {tab === 'insights' ? <JournalInsightsPanel journey={journey} /> : null}

        {tab === 'entries' ? (
          <View>
            <Text variant="h3" headingLevel={3} className="mb-2">
              Entries
            </Text>
            {entries.length === 0 ? (
              <EmptyState
                title="No journal entries"
                description="Capture your first authored decision note so Review and Mentor can reuse the lesson."
                actionLabel="New reflection"
                onAction={() => setShowReflectionForm(true)}
                className="px-4 py-8"
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

        <CollapsibleSection
          title="Summary and export"
          description="Outcome context, advanced statistics, and data export."
        >
          <View className="flex-row flex-wrap gap-4">
            <Stat label="Closed" value={String(stats.totalTrades)} />
            <Stat label="Win rate" value={formatPercent(stats.winRate, { showSign: false })} />
            <Stat label="Total P&L" value={formatChange(stats.totalPnL)} />
            <Stat label="Profit factor" value={formatNumber(stats.profitFactor, 2)} />
          </View>
          <Text variant="caption" className="text-text-tertiary">
            P&L is context only — coaching grades process quality, never profits.
          </Text>
          {canExport ? (
            <View className="flex-row gap-2">
              <Button size="sm" variant="outline" onPress={() => void exportJournal('csv')}>
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onPress={() => void exportJournal('json')}>
                Export JSON
              </Button>
            </View>
          ) : (
            <Text variant="caption" className="text-text-tertiary">
              Journal export is included with Premium.
            </Text>
          )}
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
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
