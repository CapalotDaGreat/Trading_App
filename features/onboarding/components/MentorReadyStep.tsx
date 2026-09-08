import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';
import { LEARNING_TOPIC_LABELS } from '@/shared/constants/learning-topics';

import { deriveCoachProfile } from '../services/coach-profile.service';
import type { CoachProfileAnswers } from '../types/mentor-setup.types';
import { MENTOR_EXPERIENCE_LABELS } from '../types/mentor-setup.types';

interface MentorReadyStepProps {
  answers: CoachProfileAnswers;
}

export function MentorReadyStep({ answers }: MentorReadyStepProps) {
  const derived = deriveCoachProfile(answers);
  const experience = answers.experience ? MENTOR_EXPERIENCE_LABELS[answers.experience] : 'Learner';
  const topics = answers.preferredTopics
    .slice(0, 3)
    .map((topic) => LEARNING_TOPIC_LABELS[topic])
    .join(' · ');

  return (
    <View testID="onboarding-ready">
      <Text variant="h1" className="text-center">
        You are ready to learn
      </Text>
      <Text variant="body-sm" className="mt-2 text-center text-text-secondary">
        {BRAND.product} will use this to suggest lessons and drills — never buy/sell calls.
      </Text>

      <View className="mt-6 rounded-2xl bg-background-elevated p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          LEARNING PROFILE
        </Text>
        <Text variant="h3">{experience}</Text>
        <Text variant="body" className="mt-1 text-text-secondary">
          {topics || derived.primaryStylesLabel}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {BRAND.loop}
        </Text>
      </View>

      <View className="mt-5 rounded-2xl bg-surface p-4">
        <Text variant="label" className="mb-3 text-text-tertiary">
          WHAT HAPPENS NEXT
        </Text>
        <Text variant="body-sm" className="mb-2 text-text-primary">
          Learn — start the Foundations path
        </Text>
        <Text variant="body-sm" className="mb-2 text-text-primary">
          Practice — short drills on your topics
        </Text>
        <Text variant="body-sm" className="mb-2 text-text-primary">
          Simulate — $100,000 paper capital, labelled simulated
        </Text>
        <Text variant="body-sm" className="text-text-primary">
          Review — journal the decision, not the P/L
        </Text>
      </View>
    </View>
  );
}
