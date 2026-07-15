import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { JournalCoachCard } from '@/features/decision/components/JournalCoachCard';
import { useJournalCoach } from '@/features/decision/hooks/useDecision';
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard';
import { JournalForm } from '@/features/journal/components/JournalForm';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatChange, formatNumber, formatPercent } from '@/shared/utils/format';

export default function JournalScreen() {
  const router = useRouter();
  const {
    entries,
    stats,
    canExport,
    isLoading,
    createEntry,
    deleteEntry,
    exportJournal,
    isCreating,
  } = useJournal();
  const coachQuery = useJournalCoach();

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color="#00D4AA" />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="Trade Journal" onBack={() => router.back()} />

      <View className="mt-4 gap-4">
        <GlassCard className="p-4">
          <View className="flex-row flex-wrap gap-4">
            <Stat label="Trades" value={String(stats.totalTrades)} />
            <Stat label="Win Rate" value={formatPercent(stats.winRate, { showSign: false })} />
            <Stat label="Total P&L" value={formatChange(stats.totalPnL)} />
            <Stat label="Profit Factor" value={formatNumber(stats.profitFactor, 2)} />
          </View>
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

        <EmbeddedAiInsight
          title="Coach snapshot"
          body={
            coachQuery.data?.recommendation ??
            'Log closed trades to unlock personal process coaching.'
          }
          confidence={coachQuery.data?.processScore}
          onExplain={() => router.push('/decision/coach' as never)}
        />

        {coachQuery.data ? <JournalCoachCard insight={coachQuery.data} /> : null}

        <JournalForm
          onSubmit={async (input) => {
            await createEntry(input);
          }}
          isSubmitting={isCreating}
        />

        <View>
          <Text variant="h3" className="mb-2">
            Entries
          </Text>
          {entries.length === 0 ? (
            <EmptyState title="No journal entries" description="Log your first trade above." />
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
