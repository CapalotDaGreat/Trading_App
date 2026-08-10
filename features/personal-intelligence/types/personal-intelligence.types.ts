import type { TodaySection } from '@/features/decision/services/today-sections.service';

/** Continuous Trading DNA traits — process identity, never P&L. */
export type TradingDnaTraitId =
  | 'evidenceDiscipline'
  | 'riskAwareness'
  | 'patience'
  | 'thesisClarity'
  | 'invalidationDiscipline'
  | 'processConsistency'
  | 'emotionalAwareness'
  | 'fomoResistance'
  | 'overtradingResistance'
  | 'adaptability'
  | 'researchEfficiency'
  | 'reflectionQuality'
  | 'learningMomentum';

export type TraitTrend = 'up' | 'flat' | 'down';
export type TraitConfidenceLevel = 'low' | 'medium' | 'high';
export type TraitScoreStatus = 'scored' | 'insufficient';

export type DnaEvidenceSource =
  | 'decision_log'
  | 'journal'
  | 'replay'
  | 'lab'
  | 'academy'
  | 'heatmap'
  | 'memory'
  | 'mentor_setup'
  | 'checklist';

export interface DnaEvidenceItem {
  source: DnaEvidenceSource;
  count: number;
  label: string;
  href?: string;
}

export interface TradingDnaTraitScore {
  id: TradingDnaTraitId;
  label: string;
  /** Null when status is insufficient. */
  score: number | null;
  previousScore: number | null;
  trend: TraitTrend;
  detail: string;
  status: TraitScoreStatus;
  confidence: TraitConfidenceLevel;
  confidenceValue: number;
  evidence: DnaEvidenceItem[];
  lastUpdated: number;
}

export interface DnaStyleFingerprint {
  labels: string[];
  tradingStyle: string;
  riskTolerance: string;
}

export interface TradingDnaProfile {
  styleLabel: string;
  becomingLabel: string;
  styleFingerprint: DnaStyleFingerprint;
  traits: TradingDnaTraitScore[];
  strengths: string[];
  growthEdges: string[];
  updatedAt: number;
  evidenceCount: number;
}

export interface DnaEvolutionPoint {
  /** Month key YYYY-MM */
  monthKey: string;
  label: string;
  styleLabel: string;
  summary: string;
  dominantTraits: string[];
  /** False when the point is inferred only from thin activity. */
  hasEvidence: boolean;
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

/** User-selected process goals (1–2). Aligned to DNA traits. */
export type ProcessGoalId =
  | 'improve_patience'
  | 'improve_risk_awareness'
  | 'reduce_fomo'
  | 'improve_thesis_clarity'
  | 'research_efficiency'
  | 'build_consistency'
  | 'improve_invalidation'
  | 'improve_reflection';

export type AdaptiveGoalId =
  | 'replay_sessions'
  | 'patience'
  | 'academy_lesson'
  | 'reduce_overtrading'
  | 'journal'
  | 'research_loop'
  | 'dna_growth'
  | ProcessGoalId;

export interface AdaptiveGoal {
  id: AdaptiveGoalId;
  title: string;
  detail: string;
  progress: number;
  target: number;
  href: string;
  priority: 'high' | 'medium' | 'low';
  selected?: boolean;
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
  /** Soft DNA adaptations applied (for tests / mentor context). */
  dnaAdaptations?: string[];
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

export type DnaPatternId =
  | 'research_too_quickly'
  | 'ignoring_invalidation'
  | 'thesis_churn'
  | 'over_research_low_value'
  | 'skipping_strong_setups'
  | 'repeated_fomo'
  | 'emotional_reactivity'
  | 'consistent_evidence'
  | 'improving_patience'
  | 'improving_invalidation';

export interface DnaBehaviourPattern {
  id: DnaPatternId;
  title: string;
  detail: string;
  tone: 'strength' | 'growth' | 'neutral';
  evidence: DnaEvidenceItem[];
}

export interface DnaChangeInsight {
  id: string;
  title: string;
  detail: string;
  traitId?: TradingDnaTraitId;
  trend: TraitTrend;
}

export interface DnaWeeklyReview {
  improved: string[];
  declined: string[];
  repeated: string[];
  practise: string[];
  stopDoing: string[];
  learn: string[];
  summary: string;
  hasEnoughEvidence: boolean;
}

export interface DnaMonthlyWindow {
  days: 30 | 60 | 90;
  label: string;
  traitAverages: Partial<Record<TradingDnaTraitId, number>>;
  activityCount: number;
  insight: string;
}

export interface DnaMonthlyReview {
  windows: DnaMonthlyWindow[];
  comparison: string;
  hasEnoughEvidence: boolean;
}

export interface DnaCoachingAction {
  id: string;
  traitId: TradingDnaTraitId;
  title: string;
  detail: string;
  kind: 'replay' | 'academy' | 'journal' | 'mentor' | 'checklist';
  href: string;
}

/** Compact DNA summary for Mentor / AI — never includes raw journal text. */
export interface DnaMentorSummary {
  becomingLabel: string;
  strengths: string[];
  growthEdges: string[];
  selectedGoals: string[];
  whatsChanging: string[];
  evidenceCounts: Partial<Record<DnaEvidenceSource, number>>;
  observationKey: string;
  observationLine: string;
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
  patterns: DnaBehaviourPattern[];
  whatsChanging: DnaChangeInsight[];
  weeklyReview: DnaWeeklyReview;
  monthlyReview: DnaMonthlyReview;
  coachingActions: DnaCoachingAction[];
  mentorSummary: DnaMentorSummary;
}
