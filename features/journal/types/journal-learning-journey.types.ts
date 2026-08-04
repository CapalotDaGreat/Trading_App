import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';
import type { WeeklyReviewInsight, JournalCoachInsight } from '@/features/decision/types/decision.types';
import type {
  LearningInsight,
  WeeklyGameTape,
} from '@/features/decision-replay/services/decision-replay.service';
import type { DecisionTimelineEvent } from '@/features/decision-log/services/decision-log.service';
import type { PassportPeriodSummary } from '@/features/decision-passport/types/passport.types';
import type {
  DecisionGraphSnapshot,
  DnaEvolutionPoint,
  TradingDnaProfile,
} from '@/features/personal-intelligence/types/personal-intelligence.types';

import type { TradeEmotion } from './journal.types';

export type JournalHubTab = 'timeline' | 'reviews' | 'insights' | 'entries';

export interface JournalPsychologyPoint {
  key: string;
  label: string;
  /** Share of tagged emotions that are stress states (fearful/fomo/greedy). */
  stressShare: number;
  dominantEmotion: TradeEmotion | null;
  taggedCount: number;
}

export interface JournalPsychologyTrends {
  narrative: string;
  dominantEmotion: TradeEmotion | null;
  stressShare: number;
  weeklyPoints: JournalPsychologyPoint[];
  improvementHint: string;
}

export interface JournalStrategyInsight {
  strategy: string;
  count: number;
  withLessons: number;
  planAdherenceRate: number;
  tip: string;
}

export interface JournalLearningLink {
  label: string;
  href: string;
  reason: string;
}

export interface JournalLearningJourney {
  generatedAt: number;
  headline: string;
  processCoverage: {
    entries: number;
    emotionTaggedRate: number;
    lessonsRate: number;
    planAdherenceRate: number;
  };
  timeline: DecisionTimelineEvent[];
  weeklyReview: WeeklyReviewInsight | null;
  weeklyTape: WeeklyGameTape | null;
  monthly: PassportPeriodSummary[];
  quarterly: PassportPeriodSummary[];
  yearly: PassportPeriodSummary[];
  behaviorInsights: LearningInsight[];
  psychology: JournalPsychologyTrends;
  strategyInsights: JournalStrategyInsight[];
  coach: JournalCoachInsight | null;
  improvements: string[];
  replayReferences: JournalLearningLink[];
  academyRecommendations: Array<{
    lessonId: string;
    title: string;
    reason: string;
  }>;
  dna: TradingDnaProfile | null;
  dnaEvolution: DnaEvolutionPoint[];
  decisionGraph: DecisionGraphSnapshot | null;
  curriculumHint: CurriculumRecommendation | null;
}
