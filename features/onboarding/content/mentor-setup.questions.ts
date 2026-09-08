import { MENTOR_EXPERIENCE_LABELS, SUCCESS_DEFINITION_LABELS } from '../types/mentor-setup.types';
import type { MentorExperienceLevel, SuccessDefinition } from '../types/mentor-setup.types';
import { LEARNING_TOPIC_LABELS, LEARNING_TOPICS, type LearningTopic } from '@/shared/constants/learning-topics';

export type MentorQuestionMode = 'single' | 'multi';

export interface MentorQuestionOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface MentorQuestionDefinition {
  id: number;
  title: string;
  why: string;
  mode: MentorQuestionMode;
  field: 'experience' | 'successDefinitions' | 'preferredTopics';
  options: MentorQuestionOption<string | number>[];
}

function entriesToOptions<T extends string>(
  labels: Record<T, string>,
): MentorQuestionOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

/** Short first-run questions. Extra coach fields stay optional in Settings. */
export const MENTOR_QUESTIONS: MentorQuestionDefinition[] = [
  {
    id: 1,
    title: 'How experienced are you with markets?',
    why: 'We start Academy language at the right depth. This is not a suitability test.',
    mode: 'single',
    field: 'experience',
    options: entriesToOptions<MentorExperienceLevel>(MENTOR_EXPERIENCE_LABELS),
  },
  {
    id: 2,
    title: 'What are your learning goals?',
    why: 'Progress is process quality — never predicted returns.',
    mode: 'multi',
    field: 'successDefinitions',
    options: entriesToOptions<SuccessDefinition>(SUCCESS_DEFINITION_LABELS),
  },
  {
    id: 3,
    title: 'Which topics do you want to practise first?',
    why: 'Learn, Practice, and Simulate will open in these areas. You can change this later.',
    mode: 'multi',
    field: 'preferredTopics',
    options: LEARNING_TOPICS.map((value: LearningTopic) => ({
      value,
      label: LEARNING_TOPIC_LABELS[value],
    })),
  },
];

export const MENTOR_SETUP_TOTAL_STEPS = 5; // intro + 3 questions + ready
