import type { SkillDomain } from '@/shared/constants/skill-domains';

/**
 * High-level competency families. Extensible: add a family here, then register
 * concepts against it. Existing SkillDomain remains the reporting domain.
 */
export type CompetencyFamily =
  | 'risk_management'
  | 'technical_analysis'
  | 'fundamental_research'
  | 'psychology'
  | 'thesis_decision_making'
  | 'event_risk'
  | 'review_process';

/**
 * Demonstrated process skill inside TradeAcademy’s educational environment.
 * Never “certified”, “qualified”, “ready”, or “live-ready”.
 */
export type CompetencyMasteryState =
  | 'not_started'
  | 'learning'
  | 'practiced'
  | 'demonstrated'
  | 'needs_remediation'
  | 'due_for_redemonstration';

/**
 * Primary, label-first representation of demonstrated skill.
 * Internal `CompetencyMasteryState` remains for planner transitions.
 * Never a single mastery percentage.
 */
export type CompetenceState =
  | 'not_started'
  | 'learning'
  | 'developing'
  | 'demonstrated'
  | 'strong'
  | 'needs_revisit'
  | 'transfer_unproven';

export type CompetencyUserLabel =
  | 'Not started'
  | 'Learning'
  | 'Developing'
  | 'Practiced'
  | 'Demonstrated'
  | 'Strong'
  | 'Needs Revisit'
  | 'Transfer Unproven'
  | 'Needs more practice'
  | 'Due for review';

/**
 * Practice transfer ladder. Used when selecting the next activity.
 * 1 same format → 2 new example → 3 new condition → 4 new asset → 5 mixed → 6 concealed.
 */
export type TransferKind =
  | 'same_format'
  | 'new_example'
  | 'new_condition'
  | 'new_asset'
  | 'mixed_concept'
  | 'concealed_scenario'
  | 'new_presentation';

export type RevisitKind = 'remediation' | 'retention' | 'transfer';

export type CompetencyEvidenceType =
  | 'lesson_completion'
  | 'knowledge_check'
  | 'calculation_exercise'
  | 'practice_drill'
  | 'applied_exercise'
  | 'event_exercise'
  | 'replay_decision'
  | 'simulation_decision'
  | 'simulation_checkpoint'
  | 'journal_reflection'
  | 'review_finding'
  | 'remediation_exercise'
  | 're_demonstration'
  | 'transfer_exercise'
  | 'surprise_assessment';

/**
 * What kind of learning the record can support.
 * Completion is never independent application. Historical records are not upgraded.
 */
export type EvidenceLayer =
  | 'completion'
  | 'recognition'
  | 'guided_application'
  | 'independent_application'
  | 'repeated_application'
  | 'transfer'
  | 'retention'
  | 'historical';

export type TransferDistance = 'none' | 'near' | 'far';

export type ThesisSpecificity = 'absent' | 'vague' | 'specific';

/** Structured journal flags only — never free-form notes. */
export interface JournalEvidenceSignals {
  thesisPresent: boolean;
  thesisSpecificity: ThesisSpecificity;
  invalidationPresent: boolean;
  riskConsidered: boolean;
  uncertaintyAcknowledged: boolean;
  reflectionCompleted: boolean;
}

export type EvidenceResult = 'pass' | 'fail' | 'partial' | 'observed';

export type EvidenceDifficulty = 'foundations' | 'applied' | 'complex';

/** Scaffolding used on an attempt. Never a shame signal. */
export type HelpLevel = 'none' | 'hint' | 'example' | 'worked_solution' | 'repeated_explanation';

export type CompetencyAssetClass = 'equity' | 'fx' | 'index' | 'commodity' | 'crypto' | 'unknown';

export type EvidenceRole =
  | 'knowledge'
  | 'calculation'
  | 'practice'
  | 'application'
  | 'reflection'
  | 'remediation'
  | 'redemonstration';

export type ConceptImportance = 'core' | 'supporting' | 'specialist';

export type CompetencyScenarioContext =
  | 'trend'
  | 'high_volatility'
  | 'low_volatility'
  | 'earnings'
  | 'losing_position'
  | 'concentrated_portfolio'
  | 'regime_change'
  | 'range'
  | 'event_window'
  | 'ambiguous_setup'
  | 'standard';

export interface CompetencyConcept {
  id: string;
  title: string;
  family: CompetencyFamily;
  /** Optional extra families when a concept is taught in more than one track. */
  secondaryFamilies?: CompetencyFamily[];
  skillDomain: SkillDomain;
  relatedIds: string[];
  /** Legacy Academy / graph IDs that resolve to this concept. */
  aliases: string[];
  description: string;
}

export interface ProcessFlags {
  exceededRiskLimit?: boolean;
  movedInvalidation?: boolean;
  missingInvalidation?: boolean;
  missingThesis?: boolean;
  missingEvidence?: boolean;
  fomoEntry?: boolean;
}

export interface ProcessMetrics {
  /** 0–100 process quality. Never a P/L grade. */
  processQuality?: number;
  thesis?: number;
  evidence?: number;
  invalidation?: number;
  risk?: number;
  discipline?: number;
  positionSizing?: number;
  uncertainty?: number;
  confirmation?: number;
  eventAwareness?: number;
  emotionalDiscipline?: number;
  reflection?: number;
  /** Simulated P/L is context only and must not drive mastery. */
  simulatedPnl?: number;
  simulatedProfitable?: boolean;
  flags?: ProcessFlags;
}

export interface CompetencyEvidenceInput {
  uid: string;
  conceptId: string;
  sourceType: CompetencyEvidenceType;
  sourceId: string;
  occurredAt?: number;
  result?: EvidenceResult;
  difficulty?: EvidenceDifficulty;
  hintsUsed?: boolean;
  /** Richer than hintsUsed. Defaults to `hint` when hintsUsed is true, else `none`. */
  helpLevel?: HelpLevel;
  independent?: boolean;
  processMetrics?: ProcessMetrics;
  scenarioContext?: CompetencyScenarioContext;
  assetClass?: CompetencyAssetClass;
  /** Other concepts active in the same exercise. Structured ids only. */
  interactingConceptIds?: string[];
  transferDistance?: TransferDistance;
  evidenceLayer?: EvidenceLayer;
  journalSignals?: JournalEvidenceSignals;
  /** Prior independent passes on this concept — used to tag repeated application. */
  priorIndependentCount?: number;
  /** 0–1 reliability override. Defaults from source type. */
  reliability?: number;
  score?: number;
  eventKey?: string;
  id?: string;
}

export interface CompetencyEvidenceRecord {
  id: string;
  eventKey: string;
  uid: string;
  conceptId: string;
  sourceType: CompetencyEvidenceType;
  sourceId: string;
  occurredAt: number;
  result: EvidenceResult;
  difficulty: EvidenceDifficulty;
  hintsUsed: boolean;
  helpLevel: HelpLevel;
  independent: boolean;
  processMetrics?: ProcessMetrics;
  scenarioContext?: CompetencyScenarioContext;
  assetClass?: CompetencyAssetClass;
  interactingConceptIds?: string[];
  transferDistance: TransferDistance;
  evidenceLayer: EvidenceLayer;
  journalSignals?: JournalEvidenceSignals;
  reliability: number;
  score?: number;
  version: 1 | 2;
}

/** Internal 0–100 dimensions. Do not show as a single mastery percentage. */
export interface EvidenceQuality {
  knowledge: number | null;
  application: number | null;
  independence: number | null;
  consistency: number | null;
  difficulty: number | null;
  recency: number | null;
  /** Distinct scenario contexts with independent application. Null until any context is recorded. */
  variety: number | null;
}

export interface DemonstrationRequirement {
  role: EvidenceRole;
  minIndependent: number;
  sources?: CompetencyEvidenceType[];
  variedContexts?: number;
}

export interface DemonstrationRecipe {
  conceptId: string;
  importance: ConceptImportance;
  requirements: DemonstrationRequirement[];
  concealOnRetest: boolean;
}

export interface RemediationStep {
  kind: 'lesson' | 'calculation' | 'practice' | 'replay' | 'simulation' | 'redemonstration';
  title: string;
  reason: string;
  href: string;
  sourceId?: string;
  concealConcept?: boolean;
  /** Retry/application is expected after this step. */
  requiresRetry?: boolean;
}

export interface MisconceptionHint {
  conceptId: string;
  label: string;
  flags: string[];
}

export interface RemediationPlan {
  conceptId: string;
  diagnosis: string;
  misconception?: MisconceptionHint;
  steps: RemediationStep[];
  verifyInNewContext: boolean;
}

export interface DemonstrationPrompt {
  conceptId: string;
  context: CompetencyScenarioContext;
  sourceType: CompetencyEvidenceType;
  href: string;
  concealConcept: boolean;
  reason: string;
  transferKind?: TransferKind;
  assetClass?: CompetencyAssetClass;
}

export interface TransferEvidenceSummary {
  contexts: CompetencyScenarioContext[];
  assetClasses: CompetencyAssetClass[];
  formats: CompetencyEvidenceType[];
  mixedConceptSourceIds: string[];
  applicationCount: number;
  proven: boolean;
}

export interface CompetencyMastery {
  conceptId: string;
  title: string;
  family: CompetencyFamily | null;
  /** Machine transition used by the training planner. */
  state: CompetencyMasteryState;
  /** Primary representation — labels, not a percentage. */
  competenceState: CompetenceState;
  userLabel: CompetencyUserLabel;
  revisitKind?: RevisitKind;
  /** Internal only. Null when the only evidence is exposure. Do not show as a user score. */
  strength: number | null;
  quality: EvidenceQuality;
  transfer: TransferEvidenceSummary;
  /** Familiar success with unfamiliar failure. Demonstrated is kept; transfer stays unproven. */
  falseMastery: boolean;
  explanations: string[];
  demonstrationCount: number;
  independentDemonstrationCount: number;
  contextCount: number;
  recipeMet: boolean;
  missingRoles: EvidenceRole[];
  previouslyDemonstrated: boolean;
  lastEvidenceAt: number | null;
  lastIndependentSuccessAt: number | null;
  nextRedemonstrationAt: number | null;
  remediation: RemediationPlan | null;
  nextDemonstration: DemonstrationPrompt | null;
  disclaimer: string;
}

export type RecordEvidenceStatus = 'recorded' | 'duplicate' | 'rejected';

export interface RecordEvidenceResult {
  status: RecordEvidenceStatus;
  record?: CompetencyEvidenceRecord;
  reason?: string;
}

export interface TaxonomyValidation {
  ok: boolean;
  errors: string[];
}
