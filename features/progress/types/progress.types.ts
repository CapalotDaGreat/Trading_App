import type { SkillDomain } from '@/shared/constants/skill-domains';

export type EvidenceLevel = 'none' | 'thin' | 'moderate' | 'strong';

export interface SkillDomainScore {
  domain: SkillDomain;
  /** 0–100 composite from observed work. Not a grade of simulated P/L. */
  score: number;
  evidence: EvidenceLevel;
  evidenceNote: string;
  trend: 'up' | 'flat' | 'down' | 'unknown';
}

export interface SkillModelSnapshot {
  domains: SkillDomainScore[];
  weakest: SkillDomain | null;
  strongest: SkillDomain | null;
  evidenceNote: string;
}

export type TrainingStepKind =
  | 'learn'
  | 'practice'
  | 'replay'
  | 'simulate'
  | 'review'
  | 'events'
  | 'journal';

export interface TrainingStep {
  kind: TrainingStepKind;
  title: string;
  reason: string;
  href: string;
}

export interface TrainingLoopPlan {
  suggestedNext: TrainingStep;
  chain: TrainingStep[];
  weaknessLabel: string | null;
  processReminder: string;
}

export type ReadinessDimensionId =
  | 'knowledge'
  | 'risk_discipline'
  | 'consistency'
  | 'decision_quality'
  | 'emotional_discipline'
  | 'simulation_behavior'
  | 'review_quality'
  | 'uncertainty';

export interface ReadinessDimension {
  id: ReadinessDimensionId;
  label: string;
  score: number;
  evidence: EvidenceLevel;
  note: string;
}

export interface TrainingReadiness {
  headline: string;
  /** Always false — this product never certifies live trading. */
  certifiesLiveTrading: false;
  disclaimer: string;
  strengths: string[];
  gaps: string[];
  dimensions: ReadinessDimension[];
  nextHref: string;
  nextLabel: string;
}

export interface WeeklyTrainingItem {
  order: number;
  title: string;
  href: string;
  kind: TrainingStepKind;
}

export interface WeeklyTrainingPlan {
  title: string;
  focusDomain: SkillDomain | null;
  items: WeeklyTrainingItem[];
  reminder: string;
}
