import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
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
import { useTheme } from '@/shared/hooks/useTheme';
import { formatChange, formatNumber, formatPercent } from '@/shared/utils/format';

export default function JournalScreen() {
  const router = useRouter();
  const { symbol, from } = useLocalSearchParams<{ symbol?: string; from?: string }>();
  const { colors } = useTheme();
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
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header
        title="Reflect"
        subtitle="Record decisions and lessons"
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
          title="Coach tip"
          body={
            coachQuery.data?.recommendation ??
            'Log closed trades to unlock personal process coaching.'
          }
          confidence={coachQuery.data?.processScore}
          onExplain={() => router.push('/decision/coach' as never)}
          explainLabel="Full coach"
        />

        <JournalForm
          initialSymbol={symbol}
          onSubmit={async (input) => {
            await createEntry(input);
            if (from === 'onboarding') {
              router.replace(
                `/onboarding?journaled=1&symbol=${encodeURIComponent(input.symbol)}` as never,
              );
            }
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
