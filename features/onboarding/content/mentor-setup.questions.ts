import type {
  CoachTone,
  MarketInterest,
  MentorExperienceLevel,
  ResearchBudgetMinutes,
  ResearchTimeOfDay,
  SuccessDefinition,
  TradeFrequency,
  TradingMotive,
  TradingStruggle,
  TradingStyleInterest,
} from '../types/mentor-setup.types';
import {
  COACH_TONE_LABELS,
  MARKET_INTEREST_LABELS,
  MENTOR_EXPERIENCE_LABELS,
  RESEARCH_TIME_OF_DAY_LABELS,
  SUCCESS_DEFINITION_LABELS,
  TRADE_FREQUENCY_LABELS,
  TRADING_MOTIVE_LABELS,
  TRADING_STRUGGLE_LABELS,
  TRADING_STYLE_INTEREST_LABELS,
} from '../types/mentor-setup.types';

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
  field:
    | 'motive'
    | 'experience'
    | 'markets'
    | 'frequency'
    | 'styles'
    | 'struggles'
    | 'timeBudgetMinutes'
    | 'coachTone'
    | 'successDefinitions'
    | 'researchTimeOfDay';
  options: MentorQuestionOption<string | number>[];
}

function entriesToOptions<T extends string>(
  labels: Record<T, string>,
): MentorQuestionOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export const MENTOR_QUESTIONS: MentorQuestionDefinition[] = [
  {
    id: 1,
    title: 'Why are you trading?',
    why: 'This helps your AI Mentor prioritise what matters most.',
    mode: 'single',
    field: 'motive',
    options: entriesToOptions<TradingMotive>(TRADING_MOTIVE_LABELS),
  },
  {
    id: 2,
    title: 'How experienced are you?',
    why: 'We adapt language, Academy depth, and Replay difficulty to your level.',
    mode: 'single',
    field: 'experience',
    options: entriesToOptions<MentorExperienceLevel>(MENTOR_EXPERIENCE_LABELS),
  },
  {
    id: 3,
    title: 'Which markets interest you most?',
    why: 'Your Research Queue and Replay library will favour these markets.',
    mode: 'multi',
    field: 'markets',
    options: entriesToOptions<MarketInterest>(MARKET_INTEREST_LABELS),
  },
  {
    id: 4,
    title: 'How often do you trade?',
    why: 'This shapes how ambitious your daily research plan should feel.',
    mode: 'single',
    field: 'frequency',
    options: entriesToOptions<TradeFrequency>(TRADE_FREQUENCY_LABELS),
  },
  {
    id: 5,
    title: 'Which trading styles interest you?',
    why: 'Coaching examples and practice sessions will match how you actually trade.',
    mode: 'multi',
    field: 'styles',
    options: entriesToOptions<TradingStyleInterest>(TRADING_STYLE_INTEREST_LABELS),
  },
  {
    id: 6,
    title: 'What do you currently struggle with?',
    why: 'Your mentor will gently focus on these habits — not overwhelm you with everything.',
    mode: 'multi',
    field: 'struggles',
    options: entriesToOptions<TradingStruggle>(TRADING_STRUGGLE_LABELS),
  },
  {
    id: 7,
    title: 'How much time can you realistically spend researching each day?',
    why: 'We size your Decision Brief to a plan you can finish.',
    mode: 'single',
    field: 'timeBudgetMinutes',
    options: (
      [
        [5, '5 min'],
        [10, '10 min'],
        [20, '20 min'],
        [30, '30 min'],
        [45, '45 min'],
        [60, '60+ min'],
      ] as [ResearchBudgetMinutes, string][]
    ).map(([value, label]) => ({ value, label })),
  },
  {
    id: 8,
    title: 'How would you like your AI Mentor to coach you?',
    why: 'Tone matters — coaching should feel supportive, never salesy.',
    mode: 'single',
    field: 'coachTone',
    options: entriesToOptions<CoachTone>(COACH_TONE_LABELS),
  },
  {
    id: 9,
    title: 'What would success look like?',
    why: 'We measure progress by process quality, not predictions.',
    mode: 'multi',
    field: 'successDefinitions',
    options: entriesToOptions<SuccessDefinition>(SUCCESS_DEFINITION_LABELS),
  },
  {
    id: 10,
    title: 'What time of day do you usually research?',
    why: 'Your Today Brief can greet you in the right window and prioritise calmly.',
    mode: 'single',
    field: 'researchTimeOfDay',
    options: entriesToOptions<ResearchTimeOfDay>(RESEARCH_TIME_OF_DAY_LABELS),
  },
];

export const MENTOR_SETUP_TOTAL_STEPS = 13; // intro + 10 questions + universe + ready
