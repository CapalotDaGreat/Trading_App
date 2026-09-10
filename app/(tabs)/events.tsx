import { View } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';

import { ALL_LESSONS } from '@/features/academy/content';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { EventTrainingPlanCard } from '@/features/events/components/EventTrainingPlanCard';
import { MarketEventCard } from '@/features/events/components/MarketEventCard';
import { useMarketEvents } from '@/features/events/hooks/useMarketEvents';
import { cardsForLifecycle } from '@/features/events/services/event-hub.service';
import { LIFECYCLE_LABELS } from '@/features/events/services/event-status.service';
import type { MarketEventLifecycle } from '@/features/events/types/events.types';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { buildSkillModel } from '@/features/progress/services/skill-model.service';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { useSimulation } from '@/features/simulation/hooks/useSimulation';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

const SECTIONS: MarketEventLifecycle[] = ['upcoming', 'developing', 'released', 'historical'];

export default function EventsScreen() {
  const router = useRouter();
  const lessonProgress = useAcademyProgressStore((state) => state.lessons);
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const { entries } = useJournal();
  const { account } = useSimulation();
  const { profile } = useCoachProfile();
  const beginner = !profile.experience || profile.experience === 'completely_new' || profile.experience === 'beginner';
  const weakness = useMemo(
    () =>
      buildSkillModel({
        lessons: ALL_LESSONS,
        lessonProgress,
        attempts,
        journalCount: entries.length,
        thesisDecisionCount: account?.decisions.filter((item) => item.thesis.trim().length >= 8).length ?? 0,
      }).weakest,
    [account?.decisions, attempts, entries.length, lessonProgress],
  );
  const {
    cards,
    briefing,
    trainingPlan,
    calendarUnavailable,
    calendarDegraded,
    freshnessNote,
    fetchedAt,
    refetchCalendar,
  } = useMarketEvents({ weakness });

  return (
    <ScreenScaffold
      title="Market Events"
      subtitle="What is happening, what to understand, then practice — never a buy/sell call."
      contentClassName="pb-12"
      testID="events-screen"
    >
      {beginner ? (
        <Surface tone="accent" emphasis="outlined" className="mb-4" testID="events-beginner-path">
          <Text variant="label" className="text-accent">
            Start here
          </Text>
          <Text variant="h3" headingLevel={3} className="mt-2">
            Learn what an economic calendar is
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            The full event list can wait. First understand event risk, size, and why a headline is not a signal.
          </Text>
          <Button className="mt-3" size="sm" onPress={() => router.push('/academy/lesson/fund-calendar' as never)}>
            Open the event-risk lesson
          </Button>
        </Surface>
      ) : null}

      {calendarDegraded ? (
        <Surface tone="subtle" className="mb-4" testID="events-unavailable">
          <Text variant="label">Market Events are temporarily unavailable</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {calendarUnavailable
              ? 'The external calendar could not be reached. Educational stories below still work. Learn, Practice, Simulate, and Review are unaffected.'
              : 'The external calendar failed. Showing the last saved snapshot plus educational stories. This is not a live tape.'}
          </Text>
          <Button className="mt-3" size="sm" variant="outline" onPress={() => void refetchCalendar()}>
            Try calendar again
          </Button>
        </Surface>
      ) : null}

      <Text variant="caption" className="mb-4 text-text-tertiary">
        {freshnessNote} Updated {formatRelativeTime(fetchedAt)}.
      </Text>

      {!beginner && briefing ? (
        <Surface tone="accent" emphasis="outlined" className="mb-4" testID="events-briefing">
          <Text variant="label" className="text-accent">
            Here are the important things happening
          </Text>
          <Text variant="h3" headingLevel={3} className="mt-2">
            {briefing.title}
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {briefing.whyMarketsMayCare}
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Then: understand the concepts → a historical example → a practice exercise → a fictional simulation.
          </Text>
        </Surface>
      ) : null}

      {!beginner && trainingPlan ? <EventTrainingPlanCard plan={trainingPlan} /> : null}

      {beginner ? (
        <Text variant="caption" className="mb-4 text-text-tertiary">
          The full event desk waits until you have a foundations base. Learn, Practice, and Simulation still work.
        </Text>
      ) : cards.length === 0 ? (
        <EmptyState
          title="Nothing to study yet"
          description="Waiting is a valid state. The rest of TradeAcademy still works."
        />
      ) : (
        SECTIONS.map((lifecycle) => {
          const rows = cardsForLifecycle(cards, lifecycle);
          if (rows.length === 0) return null;
          return (
            <View key={lifecycle} className="mb-4">
              <Text variant="label" className="mb-2">
                {LIFECYCLE_LABELS[lifecycle]}
              </Text>
              {rows.map((event) => (
                <MarketEventCard key={event.id} event={event} />
              ))}
            </View>
          );
        })
      )}

      <LoopCtaRow title="Use the event as study, not as a signal" />
    </ScreenScaffold>
  );
}
