import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import { useTrainingHandoff, handoffConceptTitle } from '../hooks/useTrainingHandoff';

const LOOP_LABEL: Record<string, string> = {
  learn: 'Learn',
  demonstrate: 'Demonstrate',
  practice: 'Practice',
  apply: 'Apply',
  review: 'Review',
  remediate: 'Remediate',
  redemonstrate: 'Re-demonstrate',
};

/**
 * Preserves Today’s Training concept context on Learn / Practice / Replay / Simulate / Journal / Review.
 */
export function TrainingHandoffBanner() {
  const handoff = useTrainingHandoff();
  if (!handoff) return null;

  const loop = LOOP_LABEL[handoff.loopStep] ?? 'Practice';
  const body = handoff.concealConcept
    ? 'Assess this situation and make your decision. Process quality is the grade — not simulated P/L.'
    : handoff.whyToday
      ? handoff.whyToday
      : `Today’s training continues ${handoffConceptTitle(handoff)} (${loop}).`;

  return (
    <Surface tone="subtle" className="mb-4" testID="training-handoff-banner">
      <Text variant="label" className="text-accent">
        {handoff.concealConcept ? 'Today’s training' : `Today’s training · ${loop}`}
      </Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        {body}
      </Text>
    </Surface>
  );
}
