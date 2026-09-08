import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { LessonCard } from '@/features/academy/components/LessonCard';
import { useAcademy } from '@/features/academy/hooks/useAcademy';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { JournalEntryCard } from '@/features/journal/components/JournalEntryCard';
import { useMarketSearch } from '@/features/markets/hooks/useMarketSearch';
import { searchEducation } from '@/features/academy/services/educational-search.service';
import { searchJournalEntries } from '@/features/journal/services/journal-search.service';
import { looksLikeInstrumentQuery } from '@/features/search/services/unified-search.service';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Input } from '@/shared/components/ui/Input';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export default function UnifiedSearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? '');
  const { lessons } = useAcademy();
  const { entries, deleteEntry } = useJournal();
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const markets = useMarketSearch({
    query,
    limit: 6,
    enabled: hasQuery && (looksLikeInstrumentQuery(query) || trimmed.length >= 2),
  });

  const educationHits = useMemo(() => searchEducation(lessons, query), [lessons, query]);
  const academyHits = educationHits.lessons;
  const practiceHits = educationHits.practice;
  const glossaryHits = educationHits.glossary;
  const exerciseHits = educationHits.exercises;
  const journalHits = useMemo(
    () => searchJournalEntries(entries, query).slice(0, 6),
    [entries, query],
  );
  const marketHits = hasQuery ? (markets.data ?? []) : [];
  const empty =
    hasQuery &&
    academyHits.length === 0 &&
    practiceHits.length === 0 &&
    glossaryHits.length === 0 &&
    exerciseHits.length === 0 &&
    journalHits.length === 0 &&
    marketHits.length === 0 &&
    !markets.isFetching;

  return (
    <ScreenScaffold
      title="Search"
      subtitle="Find a symbol, a concept, a lesson, or one of your notes — you do not need the exact title."
      showBack
      contentClassName="pb-12"
      testID="unified-search-screen"
    >
      <Input
        accessibilityLabel="Search TradeAcademy"
        placeholder="Try “why can RSI stay overbought?” or “is this breakout real?”"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />

      {!hasQuery ? (
        <EmptyState
          className="px-2 py-8"
          title="Search a concept, not just a title"
          description="Examples: “why can RSI stay overbought?”, “how do I know if a breakout is real?”, or a ticker."
          actionLabel="Open Academy"
          onAction={() => router.push('/academy' as never)}
        />
      ) : null}

      {empty ? (
        <EmptyState
          className="px-2 py-8"
          title="Nothing matched that yet"
          description="Try a simpler concept word (candles, risk, RSI) or a ticker. Academy search understands intent, not only exact titles."
          actionLabel="Browse Academy"
          onAction={() => router.push('/academy' as never)}
        />
      ) : null}

      {marketHits.length > 0 ? (
        <View className="mt-6" testID="search-group-markets">
          <Text variant="label" className="mb-2 text-text-tertiary">
            Markets
          </Text>
          {marketHits.map((item) => (
            <Pressable
              key={`${item.marketType}-${item.symbol}`}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.symbol} research`}
              onPress={() =>
                router.push({
                  pathname: '/asset/[symbol]',
                  params: { symbol: item.symbol, marketType: item.marketType },
                })
              }
              className="mb-2 min-h-11 justify-center rounded-2xl bg-background-elevated px-4 py-3"
            >
              <Text variant="label">{item.symbol}</Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                {item.name} · {item.marketType}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {academyHits.length > 0 ? (
        <View className="mt-6" testID="search-group-academy">
          <Text variant="label" className="mb-2 text-text-tertiary">
            Academy
          </Text>
          {academyHits.map((hit) => (
            <View key={hit.lesson.id}>
              <LessonCard lesson={hit.lesson} matchWhy={hit.why} />
            </View>
          ))}
        </View>
      ) : null}

      {exerciseHits.length > 0 ? (
        <View className="mt-6" testID="search-group-exercises">
          <Text variant="label" className="mb-2 text-text-tertiary">
            Exercises
          </Text>
          {exerciseHits.map((hit) => (
            <Pressable
              key={hit.exerciseId}
              accessibilityRole="button"
              accessibilityLabel={`Open lesson for ${hit.prompt}`}
              onPress={() => router.push(`/academy/lesson/${hit.lessonId}` as never)}
              className="mb-2 min-h-11 justify-center rounded-2xl bg-background-elevated px-4 py-3"
            >
              <Text variant="label">{hit.lessonTitle}</Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                {hit.why}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {glossaryHits.length > 0 ? (
        <View className="mt-6" testID="search-group-glossary">
          <Text variant="label" className="mb-2 text-text-tertiary">
            Glossary
          </Text>
          {glossaryHits.map((hit) => (
            <Surface key={hit.term} padding="sm" className="mb-2">
              <Text variant="label">{hit.term}</Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {hit.short}
              </Text>
            </Surface>
          ))}
        </View>
      ) : null}

      {practiceHits.length > 0 ? (
        <View className="mt-6" testID="search-group-practice">
          <Text variant="label" className="mb-2 text-text-tertiary">
            Practice
          </Text>
          {practiceHits.map((hit) => (
            <Pressable
              key={hit.drill.id}
              accessibilityRole="button"
              accessibilityLabel={`Open practice: ${hit.drill.title}`}
              onPress={() => router.push(`/practice?drill=${hit.drill.id}` as never)}
              className="mb-2 min-h-11 justify-center rounded-2xl bg-background-elevated px-4 py-3"
            >
              <Text variant="label">{hit.drill.title}</Text>
              <Text variant="caption" className="mt-0.5 text-text-secondary">
                {hit.why}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {journalHits.length > 0 ? (
        <View className="mt-6" testID="search-group-journal">
          <Text variant="label" className="mb-2 text-text-tertiary">
            My journal
          </Text>
          {journalHits.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onDelete={(id) => void deleteEntry(id)}
            />
          ))}
        </View>
      ) : null}
    </ScreenScaffold>
  );
}
