import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { NextLessonCard } from '@/features/academy/components/CurriculumCards';
import { useAcademy, useNextAcademyLesson } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { LEARNING_TOPIC_LABELS } from '@/features/practice/content/practice-drills';
import { recommendPracticeDrill } from '@/features/practice/services/practice-library.service';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { IA_GLOSSARY } from '@/features/navigation/config/navigation-ia.config';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';
import { formatPercent, formatPrice } from '@/shared/utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const { completedCount, practicedCount } = useAcademy();
  const { recommendation } = useNextAcademyLesson();
  const disciplineDays = useAcademyProgressStore((state) => state.disciplineStreakDays);
  const { account, start } = useSimulation();
  const { summary, records } = useDecisionLog();
  const { entries } = useJournal();
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const recommendedDrill = useMemo(
    () =>
      recommendPracticeDrill({
        attempts,
        nextLessonId: recommendation?.lesson.id,
      }),
    [attempts, recommendation?.lesson.id],
  );

  const weakLabel = useMemo(() => {
    const misses = new Map<string, number>();
    for (const attempt of attempts) {
      if (attempt.correct) continue;
      misses.set(attempt.drillId, (misses.get(attempt.drillId) ?? 0) + 1);
    }
    const repeatedId = [...misses.entries()].find(([, count]) => count >= 2)?.[0];
    return recommendedDrill.id === repeatedId ? recommendedDrill.title : null;
  }, [attempts, recommendedDrill]);

  const recentDecision = records?.length ? records[records.length - 1]! : null;
  const recentJournal = entries[0] ?? null;
  const noAcademyProgress = completedCount === 0 && practicedCount === 0;

  return (
    <ScreenScaffold
      eyebrow={BRAND.product}
      title="What should I do next?"
      subtitle={BRAND.loop}
      contentClassName="pb-12"
      testID="home-screen"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        <Surface tone="accent" emphasis="outlined" testID="home-continue-learning">
          <Text variant="label" className="text-text-tertiary">
            Continue Learning
          </Text>
          {noAcademyProgress ? (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                Start with the Foundations path
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Literacy before tactics. No live prices, no brokerage.
              </Text>
              <Button
                className="mt-3"
                size="sm"
                onPress={() => router.push('/academy/path/path-foundations' as never)}
              >
                Start Learning
              </Button>
            </>
          ) : recommendation ? (
            <View className="mt-3">
              <NextLessonCard recommendation={recommendation} />
            </View>
          ) : (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                Open Learn
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Paths, topics, and search live in the Academy.
              </Text>
              <Button className="mt-3" size="sm" onPress={() => router.push('/learn' as never)}>
                Go to Learn
              </Button>
            </>
          )}
        </Surface>

        <Surface testID="home-recommended-practice">
          <Text variant="label" className="text-text-tertiary">
            Recommended Practice
          </Text>
          <Text variant="h3" headingLevel={3} className="mt-2">
            {recommendedDrill.title}
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {LEARNING_TOPIC_LABELS[recommendedDrill.topic]} · ~{recommendedDrill.estimatedMinutes} min.{' '}
            {recommendedDrill.whyItMatters}
          </Text>
          <Button
            className="mt-3"
            size="sm"
            onPress={() => router.push(`/practice?drill=${recommendedDrill.id}` as never)}
          >
            Open drill
          </Button>
        </Surface>

        <Surface testID="home-simulation">
          <Text variant="label" className="text-text-tertiary">
            Simulation Snapshot · {BRAND.simulatedLabel}
          </Text>
          {account ? (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                {formatPrice(account.equity, account.currency)}
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Cash {formatPrice(account.cashBalance, account.currency)} · Exposure{' '}
                {formatPrice(account.investedAmount, account.currency)} · Drawdown{' '}
                {formatPercent(account.drawdown * 100, { showSign: false })} · {account.positions.length}{' '}
                position{account.positions.length === 1 ? '' : 's'}. Simulated P/L does not grade the
                decision.
              </Text>
              <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/simulate' as never)}>
                Open simulation
              </Button>
            </>
          ) : (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                Start with $100,000 in simulated capital
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Paper book only. Not a brokerage. Not real money.
              </Text>
              <Button
                className="mt-3"
                size="sm"
                onPress={() => {
                  start();
                  router.push('/simulate' as never);
                }}
              >
                Start Simulation
              </Button>
            </>
          )}
        </Surface>

        <Surface testID="home-recent-decision">
          <Text variant="label" className="text-text-tertiary">
            Recent Decision
          </Text>
          {recentJournal || recentDecision ? (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                {recentJournal?.symbol ?? recentDecision?.symbol ?? 'Logged process'}
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                {recentJournal?.notes?.slice(0, 140) ??
                  recentDecision?.note ??
                  'A recorded action is waiting for a journal note.'}
              </Text>
              <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/review' as never)}>
                Open Review
              </Button>
            </>
          ) : (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                Your decisions will appear here
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Journal a thesis, or size a simulated position with a reason.
              </Text>
              <Button className="mt-3" size="sm" onPress={() => router.push('/journal' as never)}>
                Make Your First Decision
              </Button>
            </>
          )}
        </Surface>

        <Surface testID="home-weak-area">
          <Text variant="label" className="text-text-tertiary">
            Weak Area
          </Text>
          {weakLabel ? (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                {weakLabel}
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Repeated practice miss. Re-do the drill, then read the related lesson. Outcome is not the
                grade.
              </Text>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onPress={() => router.push(`/practice?drill=${recommendedDrill.id}` as never)}
              >
                Practice this again
              </Button>
            </>
          ) : (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                No repeated miss yet
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                Weak areas show up from drills and journal notes — not from simulated P/L.
              </Text>
            </>
          )}
        </Surface>

        <Surface tone="subtle" testID="home-progress">
          <Text variant="label" className="text-text-tertiary">
            Progress
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {completedCount} lessons read · {practicedCount} practised · {disciplineDays}d discipline loop
            {summary ? ` · ${summary.journaled} journal notes` : ''}.
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Progress counts learning and process work, not how many simulated trades you took.
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Button size="sm" variant="ghost" onPress={() => router.push('/you' as never)}>
              {IA_GLOSSARY.you}
            </Button>
            <Button size="sm" variant="ghost" onPress={() => router.push('/ai' as never)}>
              {IA_GLOSSARY.ask}
            </Button>
          </View>
        </Surface>
      </View>
    </ScreenScaffold>
  );
}
