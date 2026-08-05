import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

import { deriveCoachProfile } from '../services/coach-profile.service';
import type { CoachProfileAnswers } from '../types/mentor-setup.types';
import {
  MENTOR_EXPERIENCE_LABELS,
  TRADING_STYLE_INTEREST_LABELS,
} from '../types/mentor-setup.types';

const PERSONALISATION_ITEMS = [
  'Markets',
  'Coaching',
  'Replay',
  'Academy',
  'Research Queue',
  'Daily Brief',
  'Learning Path',
  'Decision Coach',
  'Alerts',
] as const;

interface MentorReadyStepProps {
  answers: CoachProfileAnswers;
}

export function MentorReadyStep({ answers }: MentorReadyStepProps) {
  const derived = deriveCoachProfile(answers);
  const experience = answers.experience ? MENTOR_EXPERIENCE_LABELS[answers.experience] : 'Trader';
  const style = answers.styles[0]
    ? TRADING_STYLE_INTEREST_LABELS[answers.styles[0]]
    : 'Process-first';

  return (
    <View>
      <Text variant="h1" className="text-center">
        Your AI Mentor is ready
      </Text>
      <Text variant="body-sm" className="mt-2 text-center text-text-secondary">
        Here&apos;s what we&apos;ll personalise for you.
      </Text>

      <View className="mt-6 rounded-2xl bg-background-elevated p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          ESTIMATED LEARNING PROFILE
        </Text>
        <Text variant="h3">{experience}</Text>
        <Text variant="body" className="mt-1 text-text-secondary">
          {style}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {derived.primaryMarketsLabel}
        </Text>
        <Text variant="body-sm" className="mt-1 text-text-secondary">
          {derived.timeBudgetLabel}
        </Text>
        {derived.focusStruggleLabel ? (
          <Text variant="body-sm" className="mt-3 text-accent">
            Focus: {derived.focusStruggleLabel}
          </Text>
        ) : null}
      </View>

      <View className="mt-5 rounded-2xl bg-surface p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          PERSONALISED FOR YOU
        </Text>
        {PERSONALISATION_ITEMS.map((item) => (
          <Text key={item} variant="body-sm" className="mb-2 text-text-primary">
            ✓ {item}
          </Text>
        ))}
      </View>
    </View>
  );
}
