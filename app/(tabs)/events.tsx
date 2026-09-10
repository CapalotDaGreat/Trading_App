import { View } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { scoreAllCompetencyMastery, useCompetencyEvidenceStore, weakestSkillDomainFromMastery } from '@/features/competency';
import { EventTrainingPlanCard } from '@/features/events/components/EventTrainingPlanCard';
import { MarketEventCard } from '@/features/events/components/MarketEventCard';
import { useMarketEvents } from '@/features/events/hooks/useMarketEvents';
import { cardsForLifecycle } from '@/features/events/services/event-hub.service';
import { collectPracticeGapConceptIds } from '@/features/events/services/event-personalization.service';
import { LIFECYCLE_LABELS } from '@/features/events/services/event-status.service';
import type { MarketEventLifecycle } from '@/features/events/types/events.types';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { useLearningEngine } from '@/features/learning-engine/hooks/useLearningEngine';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';
import { DEMO_USER_UID } from '@/firebase/config';

const EMPTY_EVIDENCE: import('@/features/competency').CompetencyEvidenceRecord[] = [];

const SECTIONS: MarketEventLifecycle[] = ['upcoming', 'developing', 'released', 'historical'];

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const attempts = usePracticeProgressStore((state) => state.attempts);
  const evidence = useCompetencyEvidenceStore((state) => state.recordsByUser[uid]) ?? EMPTY_EVIDENCE;
  const { profile } = useCoachProfile();
  const { primary } = useLearningEngine();
  const beginner = !profile.experience || profile.experience === 'completely_new' || profile.experience === 'beginner';
  const mastery = useMemo(() => scoreAllCompetencyMastery(evidence), [evidence]);
  const weakness = useMemo(() => weakestSkillDomainFromMastery(mastery), [mastery]);
  const gapConceptIds = useMemo(
    () =>
      collectPracticeGapConceptIds({
        attempts,
        mastery,
      }),
    [attempts, mastery],
  );
  const {
    cards,
    briefing,
    trainingPlan,
    learningCalendar,
    calendarUnavailable,
    calendarDegraded,
    freshnessNote,
    fetchedAt,
    refetchCalendar,
  } = useMarketEvents({ weakness, gapConceptIds, mastery });

  return (
    <ScreenScaffold
      title="Market Events"
      subtitle={
        beginner
          ? 'What is this event and why does it matter? Never what the market will do next.'
          : 'What market event should I understand and practice? Never what to trade because of this event.'
      }
      contentClassName="pb-12"
      testID="events-screen"
    >
      <TrainingHandoffBanner />
      {beginner ? (
        <Surface tone="accent" emphasis="outlined" className="mb-4" testID="events-beginner-path">
          <Text variant="label" className="text-accent">
            Learning calendar
          </Text>
          <Text variant="h3" headingLevel={3} className="mt-2">
            What is this event and why does it matter?
          </Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            A few study objects — not a professional terminal. Understand the event, the classroom it belongs
            to, and why a headline is not a signal.
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
        learningCalendar.length === 0 ? (
          <EmptyState
            title="Nothing on the learning calendar yet"
            description="Waiting is a valid state. Start with the event-risk lesson, then Practice."
            actionLabel="Open the event-risk lesson"
            onAction={() => router.push('/academy/lesson/fund-calendar' as never)}
          />
        ) : (
          <View className="mb-4" testID="events-learning-calendar">
            <Text variant="label" className="mb-2">
              Upcoming study objects
            </Text>
            {learningCalendar.map((event) => (
              <MarketEventCard key={event.id} event={event} variant="beginner" />
            ))}
          </View>
        )
      ) : cards.length === 0 ? (
        <EmptyState
          title="Nothing to study yet"
          description="Waiting is a valid state. Practice and Simulation still work."
          actionLabel="Open Practice"
          onAction={() => router.push('/practice' as never)}
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
                <MarketEventCard
                  key={event.id}
                  event={event}
                  nextPractice={
                    primary
                      ? { label: primary.title, href: primary.href }
                      : undefined
                  }
                />
              ))}
            </View>
          );
        })
      )}

      <LoopCtaRow
        title="Use the event as study, not as a signal"
        plannerNext={primary ? { label: primary.title, href: primary.href } : null}
      />
    </ScreenScaffold>
  );
}
