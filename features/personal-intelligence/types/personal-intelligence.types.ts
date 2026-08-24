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
  | 'learningMomentum'
  | 'confirmationResistance'
  | 'decisionStamina'
  | 'uncertaintyHandling';

export type TraitTrend = 'up' | 'flat' | 'down';
export type TraitConfidenceLevel = 'low' | 'medium' | 'high';
export type TraitScoreStatus = 'scored' | 'insufficient';
export type LongitudinalTrend = 'improving' | 'stable' | 'declining' | 'insufficient';

/** Structured journal signals for DNA — never raw journal bodies. */
export interface DnaJournalEvidence {
  id: string;
  createdAtMs: number;
  hasPsychology: boolean;
  hasLesson: boolean;
  planAdhered?: boolean | null;
  emotion?: string | null;
  mistakeCategory?: string | null;
}

export type DnaObservedTendencyId =
  | 'over_analysis'
  | 'confirmation_seeking'
  | 'decision_fatigue';

export type ObservedTendencyLevel = 'not_observed' | 'mild' | 'clear';

export interface DnaObservedTendency {
  id: DnaObservedTendencyId;
  label: string;
  level: ObservedTendencyLevel;
  /** Always "Observed tendency" — never a diagnosis. */
  framing: 'Observed tendency';
  detail: string;
  whySummary: string;
  evidence: DnaEvidenceItem[];
}

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
  /** Snapshot of this trait as of ~30 days ago (null if insufficient then). */
  score30dAgo: number | null;
  /** Snapshot of this trait as of ~90 days ago (null if insufficient then). */
  score90dAgo: number | null;
  allTimeScore: number | null;
  trend: TraitTrend;
  longitudinalTrend: LongitudinalTrend;
  detail: string;
  /** Expandable "Why do you think this?" — counts only, never raw journal text. */
  whySummary: string;
  /** Optional ratio sentence, e.g. invalidation recorded in 18 of last 22 decisions. */
  ratioSentence?: string;
  /** Longitudinal observation, e.g. "You increasingly define invalidation before committing." */
  insightSentence?: string;
  /** Count-only evidence lines — never journal bodies. */
  whyBullets?: string[];
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

export type DnaWindowId = 'now' | '30d' | '90d' | 'all';

/** Explainable process observation — counts only, never a personality label. */
export interface DnaProcessInsight {
  id: string;
  traitId: TradingDnaTraitId;
  observation: string;
  whySummary: string;
  whyBullets: string[];
  evidence: DnaEvidenceItem[];
}

/** Focus area wired to one practice, then measured on later Decision Log events. */
export interface DnaFocusPractice {
  traitId: TradingDnaTraitId;
  observation: string;
  practice: DnaCoachingAction;
  change: LongitudinalTrend;
  measurement: string;
}

export interface TradingDnaProfile {
  styleLabel: string;
  becomingLabel: string;
  /** Answers "How do I make decisions?" from observable process, never P&L. */
  decisionStyleSummary: string;
  styleFingerprint: DnaStyleFingerprint;
  traits: TradingDnaTraitScore[];
  strengths: string[];
  /** 2–3 habit lines for the strengths strip. */
  strengthHabits: string[];
  /** Improving habits that are not yet top strengths. */
  developingHabits: string[];
  growthEdges: string[];
  /** Max 1–2 coaching lines — never a pile of weaknesses. */
  focusAreas: string[];
  /** Same focus areas with a Replay / Academy / Journal / Mentor practice + change measurement. */
  focusPractices: DnaFocusPractice[];
  /** Meaningful longitudinal observations with explainable evidence. */
  processInsights: DnaProcessInsight[];
  observedTendencies: DnaObservedTendency[];
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
  /** At most one quiet Today cue — omitted when the related trait is improving. */
  todayCue?: string | null;
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

export interface DnaPracticeLink {
  label: string;
  href: string;
  kind: 'replay' | 'academy' | 'journal';
}

export interface DnaMonthlyReview {
  windows: DnaMonthlyWindow[];
  comparison: string;
  hasEnoughEvidence: boolean;
  /** Monthly evolution — self vs self, never vs other traders. */
  improved: string[];
  becameInconsistent: string[];
  learned: string[];
  practiceNext: DnaPracticeLink[];
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

export const DNA_CORE_QUESTIONS = {
  howIDecide: 'How do I make decisions?',
  howIChange: 'How am I changing over time?',
} as const;

export interface PersonalIntelligenceSnapshot {
  generatedAt: number;
  becomingQuestion: string;
  coreQuestions: typeof DNA_CORE_QUESTIONS;
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
