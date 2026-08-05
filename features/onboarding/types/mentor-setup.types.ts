/** AI Mentor Setup answers — Phase X personalisation profile. */

export type TradingMotive =
  | 'long_term_wealth'
  | 'supplement_income'
  | 'full_time_trader'
  | 'learn_skill'
  | 'personal_challenge'
  | 'other';

export type MentorExperienceLevel =
  | 'completely_new'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'professional';

export type MarketInterest =
  | 'stocks'
  | 'forex'
  | 'crypto'
  | 'indices'
  | 'etfs'
  | 'commodities'
  | 'options'
  | 'futures';

export type TradeFrequency =
  | 'daily'
  | 'several_times_week'
  | 'weekly'
  | 'monthly'
  | 'long_term_investing';

export type TradingStyleInterest =
  | 'swing'
  | 'day_trading'
  | 'scalping'
  | 'position'
  | 'trend_following'
  | 'momentum'
  | 'value_investing'
  | 'growth_investing';

export type TradingStruggle =
  | 'finding_opportunities'
  | 'overtrading'
  | 'emotions'
  | 'risk_management'
  | 'knowing_when_to_exit'
  | 'following_plan'
  | 'confidence'
  | 'consistency'
  | 'patience'
  | 'fomo'
  | 'revenge_trading'
  | 'creating_plan';

export type ResearchBudgetMinutes = 5 | 10 | 20 | 30 | 45 | 60;

export type CoachTone = 'gentle' | 'balanced' | 'direct' | 'highly_analytical' | 'educational';

export type SuccessDefinition =
  | 'consistent_decisions'
  | 'less_emotional'
  | 'better_discipline'
  | 'learn_faster'
  | 'build_confidence'
  | 'repeatable_process';

export type ResearchTimeOfDay = 'morning' | 'lunch' | 'evening' | 'late_night' | 'weekend';

export const RESEARCH_UNIVERSE_MAX = 10;
export const RESEARCH_UNIVERSE_MIN = 1;

export const MENTOR_SETUP_DRAFT_VERSION = 2 as const;

export interface CoachProfileAnswers {
  motive: TradingMotive | null;
  experience: MentorExperienceLevel | null;
  markets: MarketInterest[];
  frequency: TradeFrequency | null;
  styles: TradingStyleInterest[];
  struggles: TradingStruggle[];
  timeBudgetMinutes: ResearchBudgetMinutes | null;
  coachTone: CoachTone | null;
  successDefinitions: SuccessDefinition[];
  researchTimeOfDay: ResearchTimeOfDay | null;
  researchUniverse: string[];
}

export interface CoachProfileDerived {
  learningProfileLabel: string;
  primaryMarketsLabel: string;
  primaryStylesLabel: string;
  focusStruggle: TradingStruggle | null;
  focusStruggleLabel: string | null;
  timeBudgetLabel: string;
}

export interface CoachProfile extends CoachProfileAnswers, CoachProfileDerived {
  uid: string;
  mentorSetupCompleted: boolean;
  mentorSetupCompletedAt: number | null;
  mentorSetupInviteDismissedAt: number | null;
  updatedAt: number;
}

export interface MentorSetupDraft {
  version: typeof MENTOR_SETUP_DRAFT_VERSION;
  uid: string;
  answers: Partial<CoachProfileAnswers>;
  /** 0 = intro, 1–10 = questions, 11 = universe, 12 = ready */
  currentStep: number;
  updatedAt: number;
}

export const EMPTY_COACH_ANSWERS: CoachProfileAnswers = {
  motive: null,
  experience: null,
  markets: [],
  frequency: null,
  styles: [],
  struggles: [],
  timeBudgetMinutes: null,
  coachTone: null,
  successDefinitions: [],
  researchTimeOfDay: null,
  researchUniverse: [],
};

export const TRADING_MOTIVE_LABELS: Record<TradingMotive, string> = {
  long_term_wealth: 'Build long-term wealth',
  supplement_income: 'Supplement my income',
  full_time_trader: 'Become a full-time trader',
  learn_skill: 'Learn a valuable skill',
  personal_challenge: 'Personal challenge',
  other: 'Other',
};

export const MENTOR_EXPERIENCE_LABELS: Record<MentorExperienceLevel, string> = {
  completely_new: 'Completely new',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  professional: 'Professional',
};

export const MARKET_INTEREST_LABELS: Record<MarketInterest, string> = {
  stocks: 'Stocks',
  forex: 'Forex',
  crypto: 'Crypto',
  indices: 'Indices',
  etfs: 'ETFs',
  commodities: 'Commodities',
  options: 'Options',
  futures: 'Futures',
};

export const TRADE_FREQUENCY_LABELS: Record<TradeFrequency, string> = {
  daily: 'Daily',
  several_times_week: 'Several times a week',
  weekly: 'Weekly',
  monthly: 'Monthly',
  long_term_investing: 'Long-term investing',
};

export const TRADING_STYLE_INTEREST_LABELS: Record<TradingStyleInterest, string> = {
  swing: 'Swing Trading',
  day_trading: 'Day Trading',
  scalping: 'Scalping',
  position: 'Position Trading',
  trend_following: 'Trend Following',
  momentum: 'Momentum',
  value_investing: 'Value Investing',
  growth_investing: 'Growth Investing',
};

export const TRADING_STRUGGLE_LABELS: Record<TradingStruggle, string> = {
  finding_opportunities: 'Finding opportunities',
  overtrading: 'Overtrading',
  emotions: 'Emotions',
  risk_management: 'Risk management',
  knowing_when_to_exit: 'Knowing when to exit',
  following_plan: 'Following my plan',
  confidence: 'Confidence',
  consistency: 'Consistency',
  patience: 'Patience',
  fomo: 'FOMO',
  revenge_trading: 'Revenge trading',
  creating_plan: 'Creating a trading plan',
};

export const COACH_TONE_LABELS: Record<CoachTone, string> = {
  gentle: 'Gentle',
  balanced: 'Balanced',
  direct: 'Direct',
  highly_analytical: 'Highly analytical',
  educational: 'Educational',
};

export const SUCCESS_DEFINITION_LABELS: Record<SuccessDefinition, string> = {
  consistent_decisions: 'More consistent decisions',
  less_emotional: 'Less emotional trading',
  better_discipline: 'Better discipline',
  learn_faster: 'Learning faster',
  build_confidence: 'Building confidence',
  repeatable_process: 'Creating a repeatable process',
};

export const RESEARCH_TIME_OF_DAY_LABELS: Record<ResearchTimeOfDay, string> = {
  morning: 'Morning',
  lunch: 'Lunch',
  evening: 'Evening',
  late_night: 'Late Night',
  weekend: 'Weekend',
};
