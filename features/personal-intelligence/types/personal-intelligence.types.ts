import type { TodaySection } from '@/features/decision/services/today-sections.service';

/** Continuous Trading DNA traits — process identity, never P&L. */
export type TradingDnaTraitId =
  | 'patience'
  | 'discipline'
  | 'risk'
  | 'research'
  | 'consistency'
  | 'confidence'
  | 'emotionalControl'
  | 'trendFollowing'
  | 'breakoutPreference'
  | 'swingPreference'
  | 'scalpingPreference'
  | 'riskManagement'
  | 'decisionQuality';

export type TraitTrend = 'up' | 'flat' | 'down';

export interface TradingDnaTraitScore {
  id: TradingDnaTraitId;
  label: string;
  score: number;
  trend: TraitTrend;
  detail: string;
}

export interface TradingDnaProfile {
  styleLabel: string;
  becomingLabel: string;
  traits: TradingDnaTraitScore[];
  strengths: string[];
  growthEdges: string[];
  updatedAt: number;
}

export interface DnaEvolutionPoint {
  /** Month key YYYY-MM */
  monthKey: string;
  label: string;
  styleLabel: string;
  summary: string;
  dominantTraits: string[];
}

export type DecisionGraphMetricId =
  | 'consistency'
  | 'research'
  | 'patience'
  | 'learning'
  | 'risk'
  | 'journal'
  | 'replay'
  | 'academy'
  | 'mentor';

export type DecisionGraphPeriod = 'weekly' | 'monthly' | 'yearly';

export interface DecisionGraphSeriesPoint {
  key: string;
  label: string;
  value: number;
}

export interface DecisionGraphMetric {
  id: DecisionGraphMetricId;
  label: string;
  score: number;
  points: DecisionGraphSeriesPoint[];
  href: string;
}

export interface DecisionGraphSnapshot {
  period: DecisionGraphPeriod;
  metrics: DecisionGraphMetric[];
  overallScore: number;
  insight: string;
  generatedAt: number;
}

export type MemoryTimelineKind =
  | 'patience'
  | 'discipline'
  | 'replay'
  | 'research'
  | 'learning'
  | 'identity'
  | 'risk';

export interface AiMemoryTimelineEvent {
  id: string;
  at: number;
  kind: MemoryTimelineKind;
  title: string;
  detail: string;
  href?: string;
}

export type AdaptiveGoalId =
  | 'replay_sessions'
  | 'patience'
  | 'academy_lesson'
  | 'reduce_overtrading'
  | 'journal'
  | 'research_loop'
  | 'dna_growth';

export interface AdaptiveGoal {
  id: AdaptiveGoalId;
  title: string;
  detail: string;
  progress: number;
  target: number;
  href: string;
  priority: 'high' | 'medium' | 'low';
}

export type TodayArchetype =
  | 'new_trader'
  | 'experienced'
  | 'poor_discipline'
  | 'high_consistency'
  | 'balanced';

export interface PersonalizedTodayFocus {
  archetype: TodayArchetype;
  eyebrow: string;
  headline: string;
  detail: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  sectionOrder: TodaySection[];
}

export type CoachingReferenceId =
  | 'passport'
  | 'replay'
  | 'academy'
  | 'journal'
  | 'decisionGraph'
  | 'dna'
  | 'heatmap'
  | 'decisionLog';

export interface CoachingReference {
  id: CoachingReferenceId;
  label: string;
  reason: string;
  href: string;
}

export interface PersonalIntelligenceSnapshot {
  generatedAt: number;
  becomingQuestion: string;
  today: PersonalizedTodayFocus;
  dna: TradingDnaProfile;
  evolution: DnaEvolutionPoint[];
  graph: DecisionGraphSnapshot;
  memoryTimeline: AiMemoryTimelineEvent[];
  goals: AdaptiveGoal[];
  coachingReferences: CoachingReference[];
}
