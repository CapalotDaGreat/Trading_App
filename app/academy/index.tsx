import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CategoryChips, type CategoryFilter } from '@/features/academy/components/CategoryChips';
import {
  AcademyDisciplineCard,
  NextLessonCard,
} from '@/features/academy/components/CurriculumCards';
import { LessonCard } from '@/features/academy/components/LessonCard';
import { PathCard } from '@/features/academy/components/PathCard';
import { TradingChecklist } from '@/features/academy/components/TradingChecklist';
import {
  useAcademy,
  useAcademyChecklists,
  useLearningPaths,
  useNextAcademyLesson,
} from '@/features/academy/hooks/useAcademy';
import { searchEducation } from '@/features/academy/services/educational-search.service';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { useTraderMemory } from '@/features/decision/hooks/useDecision';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';
import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';
import type { LessonDifficulty } from '@/features/academy/types/academy.types';
import { buildDecisionDebt } from '@/features/decision/services/decision-os.service';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { FilterChip } from '@/shared/components/ui/FilterChip';
import { Input } from '@/shared/components/ui/Input';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

export default function AcademyScreen() {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [difficulty, setDifficulty] = useState<'all' | LessonDifficulty>('all');
  const [progressFilter, setProgressFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>(
    'all',
  );
  const [query, setQuery] = useState('');
  const { lessons, completedCount, practicedCount, totalCount, isLoading } = useAcademy();
  const { paths, isLoading: pathsLoading } = useLearningPaths();
  const { checklists } = useAcademyChecklists();
  const memoryQuery = useTraderMemory();
  const { summary: logSummary } = useDecisionLog();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const discipline = useAcademyProgressStore((s) => s.getDisciplineStreak());
  const savedLessonIds = useAcademyProgressStore((s) => s.savedLessonIds);

  const debt = useMemo(
    () =>
      buildDecisionDebt({
        unreviewedSetups: 0,
        incompleteJournals: Math.max(
          0,
          (logSummary?.researched ?? 0) - (logSummary?.journaled ?? 0),
        ),
        unfinishedLessons: Math.max(0, totalCount - practicedCount),
        unfinishedReplay: 0,
        ignoredAlerts: 0,
      }),
    [logSummary, totalCount, practicedCount],
  );

  const { recommendation, isPersonalized } = useNextAcademyLesson({
    memory: memoryQuery.data,
    debt,
  });
  const intelligence = usePersonalIntelligence();
  const reinforcementRec = useMemo((): CurriculumRecommendation | null => {
    const mapped = intelligence.data?.reinforcement;
    if (!mapped?.enabled || !mapped.academyLesson?.lessonId) return null;
    const lesson = lessons.find((item) => item.id === mapped.academyLesson?.lessonId);
    if (!lesson) return null;
    return {
      lesson,
      reason: mapped.academyLesson.reason,
      evidence: ['Decision reinforcement · existing Academy lesson'],
      source: 'dna',
      isPersonalized: true,
    };
  }, [intelligence.data?.reinforcement, lessons]);
  const nextLesson =
    recommendation?.source === 'weakness' ? recommendation : reinforcementRec ?? recommendation;

  const searchHits = useMemo(() => searchEducation(lessons, query), [lessons, query]);
  const savedLessons = useMemo(
    () => lessons.filter((lesson) => savedLessonIds.includes(lesson.id)),
    [lessons, savedLessonIds],
  );

  const isRead = useAcademyProgressStore((s) => s.isRead);
  const isPracticed = useAcademyProgressStore((s) => s.isPracticed);

  const filteredLessons = useMemo(() => {
    let next = lessons;
    if (filter === 'decision' || filter === 'classic') {
      next = next.filter((l) => l.track === filter);
    } else if (filter !== 'all') {
      next = next.filter((l) => l.category === filter);
    }
    if (difficulty !== 'all') {
      next = next.filter((l) => l.difficulty === difficulty);
    }
    if (progressFilter === 'not_started') {
      next = next.filter((l) => !isRead(l.id) && !isPracticed(l.id));
    } else if (progressFilter === 'in_progress') {
      next = next.filter((l) => isRead(l.id) && !isPracticed(l.id));
    } else if (progressFilter === 'completed') {
      next = next.filter((l) => isPracticed(l.id) || isRead(l.id));
    }
    return next;
  }, [difficulty, filter, isPracticed, isRead, lessons, progressFilter]);

  const primaryPaths = paths.filter((p) => !p.isSupporting);
  const supportingPaths = paths.filter((p) => p.isSupporting);

  if (isLoading || pathsLoading) {
    return (
      <ScreenScaffold title="Learn" scrollable={false} contentClassName="justify-center">
        <StatusState
          status="loading"
          title="Loading lessons"
          description="Preparing the next lesson."
        />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      title="Academy"
      subtitle="Learn by path, topic, difficulty, and progress. Search a question, not a ticker."
      contentClassName="pb-10"
      headerAction={
        <Button size="sm" variant="ghost" onPress={() => router.push('/search' as never)}>
          Search all
        </Button>
      }
    >
      <View className="gap-4">
        <EducationalModeBadge />

        <Input
          accessibilityLabel="Search Academy lessons, exercises, and glossary"
          placeholder="Why does RSI stay overbought?"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {query.trim() ? (
          <View testID="academy-search-results">
            {searchHits.lessons.length === 0 &&
            searchHits.exercises.length === 0 &&
            searchHits.glossary.length === 0 &&
            searchHits.practice.length === 0 ? (
              <StatusState
                status="empty"
                title="Nothing matched that question yet"
                description="Try the idea, not the ticker. Examples: “how do I size a position?”, “what does drawdown actually mean?”, “why did my breakout fail?”"
                actionLabel="Clear search"
                onAction={() => setQuery('')}
              />
            ) : (
              <>
                {searchHits.lessons.length > 0 ? (
                  <>
                    <Text variant="label" className="mb-2 text-text-tertiary">
                      Lessons
                    </Text>
                    {searchHits.lessons.map((hit) => (
                      <LessonCard key={hit.lesson.id} lesson={hit.lesson} matchWhy={hit.why} />
                    ))}
                  </>
                ) : null}
                {searchHits.exercises.length > 0 ? (
                  <View className="mt-3">
                    <Text variant="label" className="mb-2 text-text-tertiary">
                      Exercises
                    </Text>
                    {searchHits.exercises.map((hit) => (
                      <Button
                        key={hit.exerciseId}
                        variant="ghost"
                        onPress={() => router.push(`/academy/lesson/${hit.lessonId}` as never)}
                      >
                        {hit.lessonTitle}
                      </Button>
                    ))}
                  </View>
                ) : null}
                {searchHits.practice.length > 0 ? (
                  <View className="mt-3">
                    <Text variant="label" className="mb-2 text-text-tertiary">
                      Practice drills
                    </Text>
                    {searchHits.practice.map((hit) => (
                      <Button
                        key={hit.drill.id}
                        variant="ghost"
                        onPress={() => router.push(`/practice?drill=${hit.drill.id}` as never)}
                      >
                        {hit.drill.title}
                      </Button>
                    ))}
                  </View>
                ) : null}
                {searchHits.glossary.length > 0 ? (
                  <View className="mt-3">
                    <Text variant="label" className="mb-2 text-text-tertiary">
                      Glossary
                    </Text>
                    {searchHits.glossary.map((hit) => (
                      <Surface key={hit.term} padding="sm" className="mb-2">
                        <Text variant="label">{hit.term}</Text>
                        <Text variant="body-sm" className="mt-1 text-text-secondary">
                          {hit.short}
                        </Text>
                      </Surface>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}

        {savedLessons.length > 0 && !query.trim() ? (
          <CollapsibleSection title="Saved for later" description="Lessons you bookmarked.">
            {savedLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </CollapsibleSection>
        ) : null}

        {!isOnline ? (
          <Text variant="caption" className="text-text-tertiary">
            Academy lessons are stored on this device. You can keep practising offline.
          </Text>
        ) : null}

        {!query.trim() ? (
          <>
            <Surface padding="sm" tone="subtle" testID="academy-progress-strip">
              <Text variant="label">Path standing</Text>
              <Text variant="caption" className="mt-1 text-text-tertiary">
                Labels come from lessons read, practised, and quiz scores — not XP.
              </Text>
              {primaryPaths.map((path) => (
                <Text key={path.id} variant="body-sm" className="mt-1.5 text-text-secondary">
                  {path.title}: {path.masteryLabel}
                </Text>
              ))}
              <Text variant="caption" className="mt-2 text-text-tertiary">
                {completedCount} read · {practicedCount} practised · {discipline.days}d discipline
              </Text>
            </Surface>

            {completedCount === 0 && practicedCount === 0 ? (
              <Surface tone="accent" emphasis="outlined" testID="academy-empty-start">
                <Text variant="label" className="text-text-tertiary">
                  First path
                </Text>
                <Text variant="h3" headingLevel={3} className="mt-2">
                  Start with the Foundations path
                </Text>
                <Text variant="body-sm" className="mt-2 text-text-secondary">
                  Markets, charts, and risk literacy before tactics. Then Practice and Simulate.
                </Text>
                <Button
                  className="mt-3"
                  size="sm"
                  onPress={() => router.push('/academy/path/path-foundations' as never)}
                >
                  Start Learning
                </Button>
              </Surface>
            ) : nextLesson ? (
              <View testID="academy-recommended">
                <Text variant="label" className="mb-2 text-text-tertiary">
                  {nextLesson.source === 'weakness' ? 'Recommended refresher' : 'Continue Learning'}
                </Text>
                <NextLessonCard
                  recommendation={nextLesson}
                  showPremiumBadge={
                    isPersonalized && isPremium && !reinforcementRec && nextLesson.source !== 'weakness'
                  }
                />
              </View>
            ) : null}

            <CollapsibleSection
              title="Learning paths"
              description="Pick a course track. Foundations first, then charts, risk, psychology, research, decisions, and portfolio."
              defaultExpanded
            >
              {primaryPaths.map((path) => (
                <PathCard key={path.id} {...path} />
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="Practice this"
              description="Rehearse the same short process before your next research decision."
              defaultExpanded={false}
              testID="academy-practice-this"
            >
              <Text variant="h3" headingLevel={3}>
                Pre-decision checklist
              </Text>
              <TradingChecklist compact />
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onPress={() => router.push('/academy/checklist/pre-trade-checklist' as never)}
              >
                Open full checklist
              </Button>
            </CollapsibleSection>

            <CollapsibleSection
              title="Supporting curriculum"
              description="Shorter tracks and desk checklists."
              defaultExpanded={false}
            >
              {supportingPaths.map((path) => (
                <PathCard key={path.id} {...path} isSupporting />
              ))}
              {checklists
                .filter((list) => list.id !== 'pre-trade-checklist')
                .map((list) => (
                  <Button
                    key={list.id}
                    variant="ghost"
                    onPress={() => router.push(`/academy/checklist/${list.id}` as never)}
                  >
                    {list.title}
                  </Button>
                ))}
              {isPremium ? null : (
                <PremiumOsGate feature="tradingDnaInsights">
                  <Text variant="body-sm" className="text-text-secondary">
                    Premium can rank supporting lessons from Trading DNA and waiting reviews — only
                    from activity you already have.
                  </Text>
                </PremiumOsGate>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Browse all lessons"
              description={`${filteredLessons.length} lessons in this filter. The course paths above are the intended sequence.`}
              defaultExpanded={false}
            >
              <CategoryChips value={filter} onChange={setFilter} />
              <View className="mb-3 flex-row flex-wrap gap-2">
                {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <FilterChip
                    key={level}
                    label={level === 'all' ? 'All difficulty' : level}
                    selected={difficulty === level}
                    onPress={() => setDifficulty(level)}
                  />
                ))}
              </View>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {(
                  [
                    ['all', 'All progress'],
                    ['not_started', 'Not started'],
                    ['in_progress', 'In progress'],
                    ['completed', 'Completed'],
                  ] as const
                ).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    label={label}
                    selected={progressFilter === value}
                    onPress={() => setProgressFilter(value)}
                  />
                ))}
              </View>
              {filteredLessons.length === 0 ? (
                <StatusState
                  status="empty"
                  title="No lessons in this filter"
                  description="Try All, or search a concept such as RSI, risk, or candlesticks."
                  actionLabel="Show all lessons"
                  onAction={() => {
                    setFilter('all');
                    setDifficulty('all');
                    setProgressFilter('all');
                  }}
                />
              ) : (
                filteredLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Discipline details"
              description="Today’s brief, lesson, and journal loop."
            >
              <AcademyDisciplineCard days={discipline.days} today={discipline.today} />
            </CollapsibleSection>
            <LoopCtaRow current="learn" title="After a lesson" />
          </>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}
