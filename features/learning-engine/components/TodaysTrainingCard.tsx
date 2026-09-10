import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { TodaysTraining, TrainingQueueItem } from '../types/learning-engine.types';
import type { TrainingRecommendation } from '@/features/training-planner/types/training-planner.types';

const KIND_LABEL: Record<TrainingQueueItem['kind'], string> = {
  continue_lesson: 'Continue lesson',
  review_concept: 'Review concept',
  chart_exercise: 'Chart exercise',
  historical_replay: 'Historical replay',
  simulation_challenge: 'Simulation challenge',
  journal_review: 'Journal review',
  spaced_review: 'Spaced practice',
  event_prep: 'Event prep',
  remediation: 'Required practice',
  redemonstration: 'Re-demonstration',
};

const STAGE_COPY: Record<TodaysTraining['stage'], string> = {
  foundation: 'Foundation — learn core market concepts.',
  application: 'Application — apply concepts in guided exercises.',
  integration: 'Integration — combine concepts in simulation and replay.',
  deliberate: 'Deliberate practice — mixed scenarios, less prompting.',
  maintenance: 'Maintenance — re-demonstrate important skills over time.',
};

export function TodaysTrainingCard({
  plan,
  primary,
  whyThis,
  nextStepCaption,
  onSkip,
  onDefer,
  onBookmark,
  onOpen,
  isBookmarked,
}: {
  plan: TodaysTraining;
  primary?: TrainingRecommendation | null;
  whyThis?: string;
  nextStepCaption?: string;
  onSkip: (id: string, conceptId?: string) => void;
  onDefer: (id: string, conceptId?: string) => void;
  onBookmark: (id: string) => void;
  onOpen?: (item: TrainingQueueItem) => void;
  isBookmarked: (id: string) => boolean;
}) {
  const router = useRouter();
  const lead = plan.items[0];
  const reason = whyThis ?? lead?.whyToday ?? lead?.reason ?? plan.coachLine;

  const open = (item: TrainingQueueItem) => {
    onOpen?.(item);
    router.push(item.href as never);
  };

  return (
    <Surface tone="accent" emphasis="outlined" testID="home-todays-training">
      <Text variant="label" className="text-accent">
        Today&apos;s Training
      </Text>
      <Text variant="caption" className="mt-1 text-text-tertiary">
        {STAGE_COPY[plan.stage]}
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-2">
        {primary?.title ?? plan.headline}
      </Text>

      {lead ? (
        <View className="mt-3" testID="home-suggested-next">
          <Text variant="caption" className="text-text-tertiary">
            {KIND_LABEL[lead.kind]}
            {lead.estimatedMinutes ? ` · ~${lead.estimatedMinutes} min` : ''}
          </Text>
          <Text variant="label" className="mt-2 text-accent" testID="home-why-this">
            Why this?
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {reason}
          </Text>
          {lead.evidence[0] && !lead.concealConcept ? (
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Evidence: {lead.evidence[0]}
            </Text>
          ) : null}
          {nextStepCaption ? (
            <Text variant="caption" className="mt-2 text-text-tertiary" testID="home-next-step">
              Next meaningful step after this: {nextStepCaption}
            </Text>
          ) : null}
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Button size="sm" onPress={() => open(lead)}>
              Start this training
            </Button>
            {lead.deferralEligible !== false ? (
              <Button size="sm" variant="outline" onPress={() => onDefer(lead.id, lead.conceptId)}>
                Defer
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onPress={() => onSkip(lead.id, lead.conceptId)}>
              Skip
            </Button>
            <Button size="sm" variant="ghost" onPress={() => onBookmark(lead.id)}>
              {isBookmarked(lead.id) ? 'Bookmarked' : 'Bookmark'}
            </Button>
          </View>
        </View>
      ) : (
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {plan.coachLine}
        </Text>
      )}

      <View className="mt-4 flex-row flex-wrap gap-2">
        <Button size="sm" variant="ghost" onPress={() => router.push('/learn' as never)}>
          Choose another topic
        </Button>
        <Button size="sm" variant="ghost" onPress={() => router.push('/practice' as never)}>
          Browse exercises
        </Button>
      </View>
    </Surface>
  );
}
