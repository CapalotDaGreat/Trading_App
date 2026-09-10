import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { EducationalChart } from '@/features/academy/components/EducationalChart';
import { ChartExercise } from '@/features/academy/components/ChartExercise';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import {
  PRACTICE_DRILLS,
  LEARNING_TOPIC_LABELS,
  getPracticeDrill,
  type PracticeDrill,
} from '@/features/practice/content/practice-drills';
import {
  DEFAULT_PRACTICE_FILTERS,
  PRACTICE_TOPIC_FILTERS,
  filterPracticeDrills,
  parsePracticeTopicParam,
  type PracticeLibraryFilters,
} from '@/features/practice/services/practice-library.service';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { ingestPracticeAttempt } from '@/features/competency';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { useTrainingHandoff } from '@/features/learning-engine/hooks/useTrainingHandoff';
import { PlannerNextCard } from '@/features/training-planner/components/PlannerNextCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DEMO_USER_UID } from '@/firebase/config';
import { IA_GLOSSARY, PRACTICE_HUB_SECTIONS } from '@/features/navigation/config/navigation-ia.config';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { HubPathList } from '@/shared/components/patterns/HubPathList';
import { Button } from '@/shared/components/ui/Button';
import { FilterChip } from '@/shared/components/ui/FilterChip';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import type { LearningTopic } from '@/shared/constants/learning-topics';

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-3">
      <Text variant="caption" className="mb-2 text-text-tertiary">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-4">{children}</View>
      </ScrollView>
    </View>
  );
}

function DrillCard({ drill }: { drill: PracticeDrill }) {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const handoff = useTrainingHandoff();
  const recordAttempt = usePracticeProgressStore((state) => state.recordAttempt);
  const attemptCount = usePracticeProgressStore(
    (state) => state.attempts.reduce((count, item) => count + (item.drillId === drill.id ? 1 : 0), 0),
  );
  const correctCount = usePracticeProgressStore(
    (state) =>
      state.attempts.reduce((count, item) => count + (item.drillId === drill.id && item.correct ? 1 : 0), 0),
  );
  const [lastResult, setLastResult] = useState<{ correct: boolean } | null>(null);
  const stats = {
    attempts: attemptCount,
    accuracy: attemptCount ? correctCount / attemptCount : 0,
  };

  return (
    <Surface className="mb-3" testID={`practice-drill-${drill.id}`}>
      <Text variant="caption" className="text-text-tertiary">
        {LEARNING_TOPIC_LABELS[drill.topic]} · {drill.difficulty} · ~{drill.estimatedMinutes} min
        {stats.attempts > 0
          ? ` · ${stats.attempts} attempt${stats.attempts === 1 ? '' : 's'} · ${Math.round(stats.accuracy * 100)}% correct`
          : ''}
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-1">
        {handoff?.concealConcept ? 'Assess this situation' : drill.title}
      </Text>
      {handoff?.showHints === false ? null : (
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {drill.whyItMatters}
        </Text>
      )}
      {drill.chartKind ? (
        <View className="mt-3">
          <EducationalChart
            spec={{
              id: `practice-${drill.id}`,
              kind: drill.chartKind,
              title: drill.title,
              caption: 'Educational tape — not a live market.',
            }}
          />
        </View>
      ) : null}
      <ChartExercise
        exercise={{
          prompt: drill.prompt,
          choices: drill.choices,
          correctIndex: drill.correctIndex,
          explanation: drill.explanation,
        }}
        onAttempt={(result) => {
          setLastResult({ correct: result.correct });
          recordAttempt({
            drillId: drill.id,
            correct: result.correct,
            selectedIndex: result.selectedIndex,
          });
          ingestPracticeAttempt(uid, drill.id, result.correct, Date.now(), {
            asTransfer:
              handoff?.priority === 'transfer_practice' ||
              (handoff?.transferStep != null &&
                handoff.transferStep !== 'same_format' &&
                handoff.transferStep !== 'new_example'),
          });
        }}
      />
      {lastResult ? (
        <View className="mt-3" testID={`practice-next-${drill.id}`}>
          <Text variant="caption" className="text-text-secondary">
            {lastResult.correct
              ? 'Demonstrated. Next: a historical room, then an uncertain paper book, then a journal note.'
              : 'Missed — that is useful evidence. Re-read the idea, then try once more. Reading still is not mastery.'}
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {lastResult.correct ? (
              <>
                <Button
                  size="sm"
                  onPress={() => router.push('/decision/replay-tv' as never)}
                >
                  Replay a historical example
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => router.push((drill.simulateHref ?? '/simulate?start=1') as never)}
                >
                  Apply in simulation
                </Button>
                <Button size="sm" variant="ghost" onPress={() => router.push('/journal' as never)}>
                  Journal the reasoning
                </Button>
              </>
            ) : drill.lessonId ? (
              <Button
                size="sm"
                onPress={() => router.push(`/academy/lesson/${drill.lessonId}` as never)}
              >
                Review the lesson
              </Button>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {drill.lessonId ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => router.push(`/academy/lesson/${drill.lessonId}` as never)}
            >
              Related lesson
            </Button>
          ) : null}
        </View>
      )}
    </Surface>
  );
}

export default function PracticeScreen() {
  const { drill: drillParam, topic: topicParam } = useLocalSearchParams<{ drill?: string; topic?: string }>();
  const { isOnline } = useOnlineStatus();
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const { primary, openItem, defer } = useLearningEngine();
  const topicFromQuery = parsePracticeTopicParam(topicParam);
  const [filters, setFilters] = useState<PracticeLibraryFilters>(() =>
    topicFromQuery ? { ...DEFAULT_PRACTICE_FILTERS, topic: topicFromQuery } : DEFAULT_PRACTICE_FILTERS,
  );

  useEffect(() => {
    if (!topicFromQuery) return;
    setFilters((prev) => (prev.topic === topicFromQuery ? prev : { ...prev, topic: topicFromQuery }));
  }, [topicFromQuery]);
  const plannerDrillId =
    primary?.activityType === 'practice' ? new URLSearchParams(primary.href.split('?')[1] ?? '').get('drill') : null;
  const featuredId =
    typeof drillParam === 'string'
      ? drillParam
      : plannerDrillId ?? (attempts.length === 0 ? PRACTICE_DRILLS[0]?.id : undefined);
  const featured = useMemo(
    () => (featuredId ? getPracticeDrill(featuredId) : undefined),
    [featuredId],
  );

  const visible = useMemo(
    () => filterPracticeDrills(PRACTICE_DRILLS, filters, attempts),
    [attempts, filters],
  );
  const library = featured ? visible.filter((item) => item.id !== featured.id) : visible;
  const filtersActive =
    filters.topic !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.time !== 'all' ||
    filters.completion !== 'all';

  const setFilter = <K extends keyof PracticeLibraryFilters>(
    key: K,
    value: PracticeLibraryFilters[K],
  ) => setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <ScreenScaffold
      eyebrow={IA_GLOSSARY.practice}
      title="Exercise library"
      subtitle="Train judgment. A correct answer is the reasoning, not a predicted tick."
      contentClassName="pb-12"
      testID="practice-screen"
    >
      <TrainingHandoffBanner />
      {!isOnline ? (
        <Text variant="caption" className="mb-3 text-text-tertiary" testID="practice-offline-caption">
          Drills run on this device. No live quotes are used.
        </Text>
      ) : null}

      {primary && primary.activityType !== 'practice' ? (
        <View className="mb-4">
          <PlannerNextCard
            recommendation={primary}
            onOpen={() => openItem(primary)}
            onDefer={defer}
            eyebrow="Train next"
            testID="practice-planner-next"
          />
        </View>
      ) : null}

      {attempts.length === 0 ? (
        <Surface tone="subtle" className="mb-4" testID="practice-empty-intro">
          <Text variant="label" className="text-text-tertiary">
            First practice
          </Text>
          <Text variant="h3" headingLevel={3} className="mt-2">
            Complete your first drill
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Start with the highlighted exercise. After that, Simulate with $100,000 paper capital is next — not a live book.
          </Text>
        </Surface>
      ) : null}

      <FilterRow label="Topic">
        {PRACTICE_TOPIC_FILTERS.map((topic) => (
          <FilterChip
            key={topic}
            label={topic === 'all' ? 'All topics' : LEARNING_TOPIC_LABELS[topic as LearningTopic]}
            selected={filters.topic === topic}
            onPress={() => setFilter('topic', topic)}
            accessibilityLabel={`Filter topic ${topic === 'all' ? 'all' : LEARNING_TOPIC_LABELS[topic as LearningTopic]}`}
          />
        ))}
      </FilterRow>
      <FilterRow label="Difficulty">
        {(['all', 'beginner', 'intermediate'] as const).map((difficulty) => (
          <FilterChip
            key={difficulty}
            label={difficulty === 'all' ? 'All levels' : difficulty}
            selected={filters.difficulty === difficulty}
            onPress={() => setFilter('difficulty', difficulty)}
          />
        ))}
      </FilterRow>
      <FilterRow label="Estimated time">
        <FilterChip label="Any time" selected={filters.time === 'all'} onPress={() => setFilter('time', 'all')} />
        <FilterChip
          label="~4 min"
          selected={filters.time === 'short'}
          onPress={() => setFilter('time', 'short')}
        />
        <FilterChip
          label="~5 min"
          selected={filters.time === 'medium'}
          onPress={() => setFilter('time', 'medium')}
        />
      </FilterRow>
      <FilterRow label="Progress">
        <FilterChip
          label="All"
          selected={filters.completion === 'all'}
          onPress={() => setFilter('completion', 'all')}
        />
        <FilterChip
          label="Not completed"
          selected={filters.completion === 'not_completed'}
          onPress={() => setFilter('completion', 'not_completed')}
        />
        <FilterChip
          label="Completed"
          selected={filters.completion === 'completed'}
          onPress={() => setFilter('completion', 'completed')}
        />
      </FilterRow>

      {featured ? <DrillCard drill={featured} /> : null}

      {library.length === 0 ? (
        <EmptyState
          title="No drills match these filters"
          description="Clear a filter or try another topic. Chart reading, risk, and decision drills are all here."
          actionLabel="Clear filters"
          onAction={() => setFilters(DEFAULT_PRACTICE_FILTERS)}
          className="px-4 py-8"
          testID="practice-empty-filters"
        />
      ) : (
        library.map((drill) => <DrillCard key={drill.id} drill={drill} />)
      )}

      {filtersActive ? (
        <Button size="sm" variant="ghost" onPress={() => setFilters(DEFAULT_PRACTICE_FILTERS)}>
          Clear filters
        </Button>
      ) : null}

      <CollapsibleSection
        title="Scenarios and replay"
        description="Longer rooms: Lab, chart replay, and hidden-future simulator."
        defaultExpanded={false}
      >
        <HubPathList sections={PRACTICE_HUB_SECTIONS} emphasizeFirst={false} />
      </CollapsibleSection>

      <LoopCtaRow
        current="practice"
        title="After a drill"
        followUp={
          primary?.isRemediation
            ? { label: 'Required practice', href: primary.href }
            : undefined
        }
      />
    </ScreenScaffold>
  );
}
