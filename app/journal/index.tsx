import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard';
import { JournalForm } from '@/features/journal/components/JournalForm';
import {
  JournalInsightsPanel,
  JournalReviewsPanel,
  JournalTimelinePanel,
} from '@/features/journal/components/JournalLearningPanels';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { useJournalLearningJourney } from '@/features/journal/hooks/useJournalLearningJourney';
import { searchJournalEntries, type JournalQuickFilter } from '@/features/journal/services/journal-search.service';
import type { JournalHubTab } from '@/features/journal/types/journal-learning-journey.types';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { RecoverableErrorState } from '@/shared/components/feedback/RecoverableErrorState';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { formatChange, formatNumber, formatPercent } from '@/shared/utils/format';

const TABS: Array<{ value: JournalHubTab; label: string }> = [
  { value: 'timeline', label: 'Overview' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'insights', label: 'Insights' },
  { value: 'entries', label: 'Entries' },
];

/** Keep the entries tab bounded inside the parent ScrollView. Full export remains available. */
const JOURNAL_ENTRIES_RENDER_CAP = 40;

const JOURNAL_FILTERS: Array<{ value: JournalQuickFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'uncertain', label: 'Uncertain' },
  { value: 'losses', label: 'Losses' },
  { value: 'recent', label: '30 days' },
  { value: 'thesis_changed', label: 'Thesis changed' },
];

export default function JournalScreen() {
  const router = useRouter();
  const { symbol, from, notes, concept } = useLocalSearchParams<{
    symbol?: string;
    from?: string;
    notes?: string;
    concept?: string;
  }>();
  const fromParam = typeof from === 'string' ? from : Array.isArray(from) ? from[0] : undefined;
  const notesParam = typeof notes === 'string' ? notes : Array.isArray(notes) ? notes[0] : undefined;
  const [tab, setTab] = useState<JournalHubTab>('timeline');
  const [showReflectionForm, setShowReflectionForm] = useState(
    fromParam === 'onboarding' ||
      fromParam === 'simulate' ||
      fromParam === 'academy' ||
      Boolean(notesParam) ||
      Boolean(concept),
  );
  const [journalQuery, setJournalQuery] = useState(symbol ?? '');
  const [journalFilter, setJournalFilter] = useState<JournalQuickFilter>('all');
  const { canExport, createEntry, deleteEntry, exportJournal, isCreating } = useJournal();
  const { isOnline } = useOnlineStatus();
  const { journey, stats, entries, isLoading, isError, isStale, refetch } = useJournalLearningJourney();
  const visibleEntries = useMemo(
    () => searchJournalEntries(entries, journalQuery, journalFilter),
    [entries, journalQuery, journalFilter],
  );

  if (isError && entries.length === 0) {
    return (
      <ScreenScaffold title="Journal" scrollable={false} contentClassName="justify-center">
        <RecoverableErrorState error={new Error('journal-unavailable')} onRetry={() => void refetch()} />
      </ScreenScaffold>
    );
  }

  if ((isLoading && entries.length === 0) || !journey) {
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
        <TrainingHandoffBanner />
        {!isOnline ? (
          <Text variant="caption" className="text-text-tertiary">
            Journal stays on this device. You can keep writing and reviewing offline.
          </Text>
        ) : null}
        {isStale ? (
          <Surface padding="sm" tone="warning" testID="journal-stale-banner">
            <Text variant="label">Showing saved reflections</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              Cloud journal could not refresh. Nothing here is live market data.
            </Text>
            <Button size="sm" className="mt-2 self-start" onPress={() => void refetch()}>
              Retry
            </Button>
          </Surface>
        ) : null}

        {fromParam === 'onboarding' ? (
          <Surface padding="sm" tone="info" testID="journal-onboarding-context">
            <Text variant="label">Close your first decision loop</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {symbol ? `${symbol.toUpperCase()} is prefilled. ` : ''}
              Saving a real entry completes activation; going back keeps your progress.
            </Text>
          </Surface>
        ) : null}

        {fromParam === 'simulate' ? (
          <Surface padding="sm" tone="info" testID="journal-simulate-context">
            <Text variant="label">Review the simulated trade</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {symbol ? `${symbol.toUpperCase()} is prefilled. ` : ''}
              This journal is for process: what happened, whether the thesis held, and what you would change.
              Simulated P/L is not the grade.
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
              initialNotes={notesParam}
              onSubmit={async (input) => {
                await createEntry(input);
                setShowReflectionForm(false);
                if (fromParam === 'onboarding') {
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
          <Text variant="label" className="text-text-tertiary">Process trend</Text>
          <Text variant="h2" headingLevel={2} className="mt-2">{journey.headline}</Text>
        </Surface>

        <Surface>
          <Text variant="label" className="text-text-tertiary">One coaching insight</Text>
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
                  title="No journal entries yet"
                  description="Complete a practice drill or simulation first, then write what you noticed."
                  actionLabel="Open Practice"
                  onAction={() => router.push('/practice' as never)}
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
            <Input
              accessibilityLabel="Search journal entries"
              placeholder="Tesla, RSI, uncertain, last month…"
              value={journalQuery}
              onChangeText={setJournalQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            <View className="mt-3">
              <SegmentedControl
                options={JOURNAL_FILTERS}
                value={journalFilter}
                onChange={setJournalFilter}
                testID="journal-entry-filters"
              />
            </View>
            {visibleEntries.length === 0 ? (
              <EmptyState
                title={entries.length === 0 ? 'No journal entries' : 'No entries match that search'}
                description={
                  entries.length === 0
                    ? 'Your decisions will appear here.'
                    : 'Try a ticker, a concept like RSI, or a filter such as Uncertain or Losses.'
                }
                actionLabel={entries.length === 0 ? 'Open Practice' : 'Clear filters'}
                onAction={() => {
                  if (entries.length === 0) router.push('/practice' as never);
                  else {
                    setJournalQuery('');
                    setJournalFilter('all');
                  }
                }}
                className="px-4 py-8"
              />
            ) : (
              <>
                {visibleEntries.slice(0, JOURNAL_ENTRIES_RENDER_CAP).map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={(id) => void deleteEntry(id)}
                  />
                ))}
                {visibleEntries.length > JOURNAL_ENTRIES_RENDER_CAP ? (
                  <Text variant="caption" className="mt-2 text-text-tertiary">
                    Showing the {JOURNAL_ENTRIES_RENDER_CAP} most recent matching reflections. Export still
                    includes the full journal.
                  </Text>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        <CollapsibleSection
          title="Summary and export"
          description="Outcome context, advanced statistics, and data export."
        >
          <View className="flex-row flex-wrap gap-4">
            <Stat label="Entries" value={String(journey.processCoverage.entries)} />
            <Stat
              label="Emotion tags"
              value={formatPercent(journey.processCoverage.emotionTaggedRate, { showSign: false })}
            />
            <Stat
              label="Plan adherence"
              value={formatPercent(journey.processCoverage.planAdherenceRate, { showSign: false })}
            />
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
