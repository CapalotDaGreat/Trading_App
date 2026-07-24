import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

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
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

export default function AcademyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Screen>
    );
  }

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header
        title="Learn"
        subtitle="Practice trading concepts in a risk-free learning environment"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-6">
        <EducationalModeBadge />

        <View className="rounded-2xl bg-background-elevated p-4">
          <Text variant="label" className="text-text-tertiary">
            EDUCATIONAL ACADEMY
          </Text>
          <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
            Lessons teach process and research habits — not guaranteed profits, buy/sell signals, or
            personalised investment advice.
          </Text>
        </View>

        <EducationalPanel
          variant="practice"
          body="Celebrate checklist completion and practiced lessons — never profit leaderboards."
        />

        <View className="rounded-2xl bg-background-elevated p-4">
          <Text variant="label" className="text-text-tertiary">
            YOUR PROGRESS
          </Text>
          <Text variant="h2" className="mt-1">
            {completedCount} read · {practicedCount} practiced
          </Text>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
            <View className="h-full rounded-full bg-accent" style={{ width: `${progressPct}%` }} />
          </View>
          <Text variant="caption" className="mt-2">
            Read ≠ practiced. Mark lessons complete anytime; mastery surfaces reward practice gates
            (Lab / Replay / Journal).
          </Text>
        </View>

        <AcademyDisciplineCard days={discipline.days} today={discipline.today} />

        {recommendation ? (
          <NextLessonCard
            recommendation={recommendation}
            showPremiumBadge={isPersonalized && isPremium}
          />
        ) : null}

        {isPremium ? null : (
          <PremiumOsGate feature="tradingDnaInsights">
            <View className="rounded-2xl bg-background-elevated p-4">
              <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
                PREMIUM · PERSONALIZED CURRICULUM
              </Text>
              <Text variant="body-sm" className="text-text-secondary">
                Foundations stay free. Premium ranks next lessons from Trading DNA and Decision Debt
                — coaching, not a content shelf.
              </Text>
            </View>
          </PremiumOsGate>
        )}

        <View>
          <Text variant="h3" className="mb-1">
            Decision Operator
          </Text>
          <Text variant="body-sm" className="mb-3 text-text-secondary">
            Start here. Classic TA is supporting curriculum below.
          </Text>
          {primaryPaths.map((path) => (
            <PathCard
              key={path.id}
              id={path.id}
              title={path.title}
              description={path.description}
              icon={path.icon}
              track={path.track}
              completedCount={path.completedCount}
              practicedCount={path.practicedCount}
              totalCount={path.totalCount}
              isDefault={path.isDefault}
              isSupporting={path.isSupporting}
              masteryUnlocked={path.masteryUnlocked}
              unlockHint={path.unlockHint}
              iaHint={path.iaHint}
            />
          ))}
        </View>

        <View>
          <Text variant="h3" className="mb-1">
            Supporting school
          </Text>
          <Text variant="body-sm" className="mb-3 text-text-secondary">
            Mechanics after your filter is sharp — Lab challenges unlock mastery badges.
          </Text>
          {supportingPaths.map((path) => (
            <PathCard
              key={path.id}
              id={path.id}
              title={path.title}
              description={path.description}
              icon={path.icon}
              track={path.track}
              completedCount={path.completedCount}
              practicedCount={path.practicedCount}
              totalCount={path.totalCount}
              isSupporting
              masteryUnlocked={path.masteryUnlocked}
              unlockHint={path.unlockHint}
              iaHint={path.iaHint}
            />
          ))}
        </View>

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text variant="h3">Desk checklists</Text>
            <Pressable
              onPress={() => router.push('/academy/checklist/pre-trade-checklist' as never)}
            >
              <Text variant="caption" className="text-accent">
                Open full
              </Text>
            </Pressable>
          </View>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {checklists.map((list) => (
              <Pressable
                key={list.id}
                onPress={() => router.push(`/academy/checklist/${list.id}` as never)}
                className="flex-row items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"
              >
                <Ionicons name="checkbox-outline" size={14} color={colors.accent.primary} />
                <Text variant="caption" className="text-text-primary">
                  {list.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <TradingChecklist compact />
        </View>

        <View>
          <Text variant="h3" className="mb-2">
            All lessons
          </Text>
          <CategoryChips value={filter} onChange={setFilter} />
          {filteredLessons.length === 0 ? (
            <Text variant="body-sm">No lessons in this filter.</Text>
          ) : (
            filteredLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
          )}
        </View>
      </View>
    </Screen>
  );
}
