/**
 * Decision Reinforcement Layer — derived, non-authoritative.
 *
 * Source of truth remains the Decision Log (plus existing Replay progress,
 * structured Journal flags, Academy completion, DNA derivation, and Mentor Setup).
 * This module does not persist user behaviour and must never become a second event store.
 */

export const REINFORCEMENT_TRAIT_IDS = [
  'patience',
  'evidenceDiscipline',
  'invalidationDiscipline',
  'confirmationResistance',
  'decisionStamina',
  'researchEfficiency',
  'adaptability',
  'uncertaintyHandling',
] as const;

export type ReinforcementTraitId = (typeof REINFORCEMENT_TRAIT_IDS)[number];

export type ReinforcementDirection = 'strength' | 'developing' | 'focus';

export type ReinforcementSource = 'replay' | 'journal' | 'decision_log' | 'academy';

export type ReinforcementEvidenceQuality = 'high' | 'moderate' | 'limited' | 'insufficient';

export type ReinforcementPracticeKind = 'replay' | 'academy' | 'journal' | 'mentor';

export type ReinforcementPriority = 'now' | 'later' | 'none';

export const REINFORCEMENT_TRAIT_LABELS: Record<ReinforcementTraitId, string> = {
  patience: 'Patience',
  evidenceDiscipline: 'Evidence quality',
  invalidationDiscipline: 'Invalidation discipline',
  confirmationResistance: 'Confirmation resistance',
  decisionStamina: 'Decision stamina',
  researchEfficiency: 'Research efficiency',
  adaptability: 'Adaptability',
  uncertaintyHandling: 'Uncertainty handling',
};

export interface ReinforcementEvidenceRef {
  source: ReinforcementSource;
  count: number;
  /** Count-only label — never a journal body or private reasoning note. */
  label: string;
}

export interface ReinforcementObservation {
  traitId: ReinforcementTraitId;
  direction: ReinforcementDirection;
  evidenceRefs: ReinforcementEvidenceRef[];
  evidenceQuality: ReinforcementEvidenceQuality;
  source: ReinforcementSource;
  createdAt: number;
  /** Observed-tendency language only. Never a diagnosis or P&L claim. */
  explanation: string;
}

export interface PracticeRecommendation {
  traitId: ReinforcementTraitId;
  practiceType: ReinforcementPracticeKind;
  destination: { href: string; label: string };
  reason: string;
  priority: ReinforcementPriority;
  lessonId?: string;
  episodeId?: string;
  expiresAt?: number;
}

export interface ReinforcementTodayCue {
  id: string;
  text: string;
  traitId: ReinforcementTraitId;
  evidenceQuality: ReinforcementEvidenceQuality;
}

export interface ReinforcementMentorContext {
  known: string[];
  inference: string[];
  unknown: string[];
  observationLine: string | null;
}

export interface ReplayPracticeConnection {
  traitId: ReinforcementTraitId;
  evidenceQuality: ReinforcementEvidenceQuality;
  workingOn: string;
  nextPractice: string;
}

export interface ReinforcementAcademyProgress {
  lessonId: string;
  readAtMs?: number;
  practicedAtMs?: number;
}

export interface ReinforcementCoachPrefs {
  markets?: string[] | null;
  struggles?: string[] | null;
  experience?: string | null;
  coachTone?: string | null;
}

export interface DecisionReinforcementSnapshot {
  enabled: boolean;
  observations: ReinforcementObservation[];
  primaryPractice: PracticeRecommendation | null;
  academyLesson: PracticeRecommendation | null;
  todayCue: ReinforcementTodayCue | null;
  mentorContext: ReinforcementMentorContext;
  replayPracticeConnection: ReplayPracticeConnection | null;
  preferredMarkets: string[];
}
