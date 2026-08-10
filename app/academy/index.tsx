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
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { PremiumOsGate } from '@/features/decision/components/PremiumOsGate';
import { useTraderMemory } from '@/features/decision/hooks/useDecision';
import { buildDecisionDebt } from '@/features/decision/services/decision-os.service';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

export default function AcademyScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const { lessons, completedCount, practicedCount, totalCount, isLoading } = useAcademy();
  const { paths, isLoading: pathsLoading } = useLearningPaths();
  const { checklists } = useAcademyChecklists();
  const memoryQuery = useTraderMemory();
  const { summary: logSummary } = useDecisionLog();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const discipline = useAcademyProgressStore((s) => s.getDisciplineStreak());

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

  const filteredLessons = useMemo(() => {
    if (filter === 'all') return lessons;
    if (filter === 'decision' || filter === 'classic') {
      return lessons.filter((l) => l.track === filter);
    }
    return lessons.filter((l) => l.category === filter);
  }, [filter, lessons]);

  const primaryPaths = paths.filter((p) => !p.isSupporting);
  const supportingPaths = paths.filter((p) => p.isSupporting);

  if (isLoading || pathsLoading) {
    return (
      <ScreenScaffold title="Academy" scrollable={false} contentClassName="justify-center">
        <StatusState
          status="loading"
          title="Loading Academy"
          description="Preparing continue, recommended, and practice paths."
        />
      </ScreenScaffold>
    );
  }

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <ScreenScaffold
      title="Academy"
      subtitle="Learn one process skill, practise it, then bring the lesson back to your decisions."
      contentClassName="pb-10"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        <Surface padding="sm" tone="subtle" testID="academy-progress-strip">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text variant="label">Progress</Text>
              <Text variant="body-sm" className="mt-1 text-text-secondary">
                {completedCount} read · {practicedCount} practised · {discipline.days}d discipline
              </Text>
            </View>
            <Text variant="label" className="text-accent">{progressPct}%</Text>
          </View>
          <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <View className="h-full rounded-full bg-accent" style={{ width: `${progressPct}%` }} />
          </View>
        </Surface>

        {recommendation ? (
          <View>
            <Text variant="label" className="mb-2 text-text-tertiary">CONTINUE LEARNING</Text>
            <NextLessonCard
              recommendation={recommendation}
              showPremiumBadge={isPersonalized && isPremium}
            />
          </View>
        ) : null}

        {recommendation ? (
          <Surface emphasis="outlined" testID="academy-recommended">
            <Text variant="label" className="text-accent">RECOMMENDED FOR YOU</Text>
            <Text variant="h2" headingLevel={2} className="mt-2">
              {recommendation.lesson.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {recommendation.reason}
            </Text>
            <Button
              className="mt-3"
              size="sm"
              onPress={() =>
                router.push(`/academy/lesson/${recommendation.lesson.id}` as never)
              }
            >
              Open recommendation
            </Button>
          </Surface>
        ) : null}

        <Surface emphasis="outlined" testID="academy-practice-this">
          <Text variant="label" className="text-accent">PRACTICE THIS</Text>
          <Text variant="h2" headingLevel={2} className="mt-2">
            Pre-decision checklist
          </Text>
          <Text variant="body-sm" className="mb-4 mt-2 text-text-secondary">
            Rehearse the same short process before your next research decision.
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
        </Surface>

        <CollapsibleSection
          title="Paths"
          description="Structured Decision Operator learning paths."
        >
          {primaryPaths.map((path) => (
            <PathCard key={path.id} {...path} />
          ))}
        </CollapsibleSection>

        <CollapsibleSection
          title="Supporting curriculum"
          description="Classic mechanics and additional desk checklists."
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
                Premium ranks supporting lessons from Trading DNA and Decision Debt.
              </Text>
            </PremiumOsGate>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Browse all lessons"
          description={`${filteredLessons.length} lessons available in the current filter.`}
        >
          <CategoryChips value={filter} onChange={setFilter} />
          {filteredLessons.length === 0 ? (
            <Text variant="body-sm">No lessons in this filter.</Text>
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
      </View>
    </ScreenScaffold>
  );
}
