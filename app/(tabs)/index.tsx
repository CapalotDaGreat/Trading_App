import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ALL_LESSONS } from '@/features/academy/content';
import { useAcademy } from '@/features/academy/hooks/useAcademy';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useMarketEvents } from '@/features/events/hooks/useMarketEvents';
import { FocusAreaList } from '@/features/learning-engine/components/FocusAreaList';
import { TodaysTrainingCard } from '@/features/learning-engine/components/TodaysTrainingCard';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { buildSkillModel } from '@/features/progress/services/skill-model.service';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';
import { SKILL_DOMAIN_LABELS } from '@/shared/constants/skill-domains';

const BEGINNER = new Set(['completely_new', 'beginner']);

export default function HomeScreen() {
  const router = useRouter();
  const { completedCount, practicedCount } = useAcademy();
  const lessonProgress = useAcademyProgressStore((state) => state.lessons);
  const disciplineDays = useAcademyProgressStore((state) => state.disciplineStreakDays);
  const { account, start } = useSimulation();
  const { entries } = useJournal();
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const { profile } = useCoachProfile();
  const hideEvents = !profile.experience || BEGINNER.has(profile.experience);

  const skill = useMemo(
    () =>
      buildSkillModel({
        lessons: ALL_LESSONS,
        lessonProgress,
        attempts,
        journalCount: entries.length,
        thesisDecisionCount: account?.decisions.filter((item) => item.thesis.trim().length >= 8).length ?? 0,
      }),
    [account?.decisions, attempts, entries.length, lessonProgress],
  );

  const { today, skip, defer, bookmark, openItem, isBookmarked } = useLearningEngine();
  const { briefing } = useMarketEvents({ weakness: skill.weakest });
  const noAcademyProgress = completedCount === 0 && practicedCount === 0;
  const showEventCard = !hideEvents && Boolean(briefing);

  return (
    <ScreenScaffold
      eyebrow={BRAND.product}
      title="Your training center"
      subtitle="One next practice. Then review. Not a market terminal."
      contentClassName="pb-12"
      testID="home-screen"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        {noAcademyProgress ? (
          <Surface testID="home-continue-learning">
            <Text variant="label" className="text-text-tertiary">
              Where to start
            </Text>
            <Text variant="h3" headingLevel={3} className="mt-2">
              Start with the Foundations path
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Literacy, risk, and simple charts first. Events stay a small learning calendar, not a news feed.
            </Text>
            <Button
              className="mt-3"
              size="sm"
              onPress={() => router.push('/academy/path/path-foundations' as never)}
            >
              Start Learning
            </Button>
          </Surface>
        ) : null}

        <TodaysTrainingCard
          plan={today}
          onSkip={skip}
          onDefer={defer}
          onBookmark={bookmark}
          onOpen={openItem}
          isBookmarked={isBookmarked}
        />

        {today.focusAreas.length > 0 ? <FocusAreaList areas={today.focusAreas} /> : null}

        <Surface testID="home-simulation">
          <Text variant="label" className="text-text-tertiary">
            Simulation · {BRAND.simulatedLabel}
          </Text>
          {account ? (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                Day {account.scenario?.clockDay ?? 0} · process over paper profit
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                {account.decisions.filter((item) => item.thesis.trim().length >= 8).length} thesis-backed fills ·{' '}
                {account.decisions.filter((item) => item.closeReview).length} close reviews. Simulated equity is
                context, not a grade.
              </Text>
              <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/simulate' as never)}>
                Open simulation
              </Button>
            </>
          ) : (
            <>
              <Text variant="h3" headingLevel={3} className="mt-2">
                Practice uncertainty with $100,000 paper capital
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                A unique fictional path. Not a brokerage. Simulated P/L does not grade a decision.
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

        {showEventCard && briefing ? (
          <Surface testID="home-upcoming-event">
            <Text variant="label" className="text-text-tertiary">
              Event context
            </Text>
            <Text variant="h3" headingLevel={3} className="mt-2">
              {briefing.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {briefing.whyMarketsMayCare} Preparation, not a trade instruction.
            </Text>
            <Button className="mt-3" size="sm" variant="outline" onPress={() => router.push('/events' as never)}>
              Open Events
            </Button>
          </Surface>
        ) : null}

        <CollapsibleSection
          title="More training"
          description="Review, readiness, and Ask — after the next practice."
          defaultExpanded={false}
        >
          <Surface testID="home-recent-decision">
            <Text variant="label" className="text-text-tertiary">
              Review
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {entries[0]
                ? `${entries[0].symbol} — grade the reasoning, not the paper result.`
                : 'Journal a decision when you have one to review.'}
            </Text>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onPress={() => router.push((entries[0] ? '/review' : '/journal') as never)}
            >
              {entries[0] ? 'Open Review' : 'Open Journal'}
            </Button>
          </Surface>
          <Surface tone="subtle" className="mt-3" testID="home-progress">
            <Text variant="caption" className="text-text-tertiary">
              {completedCount} lessons read · {practicedCount} practised · {disciplineDays}d discipline
              {skill.strongest ? ` · emerging strength in ${SKILL_DOMAIN_LABELS[skill.strongest]}` : ''}.
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <Button size="sm" variant="ghost" onPress={() => router.push('/readiness' as never)}>
                Training readiness
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push('/you' as never)}>
                You
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push('/ai' as never)}>
                Ask
              </Button>
            </View>
          </Surface>
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
  );
}
