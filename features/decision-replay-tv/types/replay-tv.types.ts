import type { DataSourceKind } from '@/features/markets/constants/data-source';
import type { ReplayLicenseKind, ReplayPracticeDifficulty } from '@/features/decision-replay/types/replay-scenario.types';
import type { Candle, CandleInterval } from '@/shared/types/market';

export type ReplayTvDifficulty = 'foundation' | 'intermediate' | 'advanced' | 'expert';

export type ReplayTvCollectionId =
  | 'featured'
  | 'crashes'
  | 'manias'
  | 'policy'
  | 'earnings'
  | 'crypto'
  | 'regime_changes'
  | 'false_breakouts'
  | 'psychology'
  | 'risk_management'
  | 'uncertainty'
  | 'patterns'
  | 'volatility'
  | 'failed_setups'
  | 'patience'
  | 'recoveries'
  | 'bull_markets'
  | 'corrections'
  | 'employment'
  | 'sector_rotation';

export type ReplayTvEpisodeKind =
  | 'pattern'
  | 'macro_event'
  | 'regime_transition'
  | 'volatility'
  | 'failed_setup'
  | 'false_breakout'
  | 'patience'
  | 'risk_management';

export type ReplayTvMarketFocus =
  | 'stocks'
  | 'forex'
  | 'crypto'
  | 'macro'
  | 'indices'
  | 'commodities';

export type ReplayTvTradingStyle = 'swing' | 'day' | 'position' | 'scalp' | 'any';

export type ReplayTvScoringEmphasis =
  | 'evidence'
  | 'risk'
  | 'invalidation'
  | 'alternatives'
  | 'patience'
  | 'information_use'
  | 'process';

export type ReplayTvPhase =
  | 'intro'
  | 'context'
  | 'watching'
  | 'research'
  | 'reasoning'
  | 'risk'
  | 'sizing'
  | 'decision'
  | 'mentor'
  | 'reveal'
  | 'coaching'
  | 'complete'
  | 'skill';

export type ReplayTvTopic =
  | 'bull'
  | 'bear'
  | 'crash'
  | 'recovery'
  | 'bubble'
  | 'correction'
  | 'volatility'
  | 'breakout'
  | 'failed_breakout'
  | 'reversal'
  | 'earnings'
  | 'macro'
  | 'rates'
  | 'inflation'
  | 'employment'
  | 'sector_rotation'
  | 'company';

export type ReplayTvEventKind =
  | 'earnings'
  | 'rate_decision'
  | 'inflation'
  | 'employment'
  | 'geopolitical'
  | 'company'
  | 'liquidity'
  | 'none';

/** Process decision at a freeze — never a broker order or buy/sell signal. */
export type ReplayTvDecision =
  | 'research_more'
  | 'write_thesis'
  | 'wait'
  | 'skip'
  | 'no_trade'
  | 'enter'
  | 'exit'
  | 'reduce'
  | 'protect_attention'
  | 'mark_invalidation'
  | 'review_other';

export interface ReplayTvNewsItem {
  id: string;
  /** Bar index at which this headline becomes available (inclusive). */
  availableAtIndex: number;
  headline: string;
  detail: string;
}

export interface ReplayTvEducationalLink {
  kind: 'academy' | 'checklist' | 'mentor';
  label: string;
  href: string;
}

export interface ReplayTvCheckpoint {
  id: string;
  /** Bar index (inclusive) where future is still hidden. */
  freezeIndex: number;
  prompt: string;
  mentorFollowUp: string;
  /** Spoiler-free teaching hint after reveal only. */
  teachingNote: string;
  /** What the user may know at this freeze — never future facts. */
  availableDataNotes?: string[];
  /** News item ids visible at this checkpoint (must already be available). */
  newsIdsVisible?: string[];
  /** Optional subset of decisions offered at this pause. */
  choices?: ReplayTvDecision[];
  hypothesisPrompt?: string;
}

export interface ReplayTvEpisode {
  id: string;
  title: string;
  subtitle: string;
  /** Spoiler-safe teaser — never reveals the outcome. */
  teaser: string;
  /** Shown only after reveal. */
  historicalOutcome: string;
  collectionIds: ReplayTvCollectionId[];
  symbol: string;
  symbolLabel: string;
  interval: CandleInterval;
  difficulty: ReplayTvDifficulty;
  skills: string[];
  eraLabel: string;
  /** Educational reconstruction — always sample/approximate provenance. */
  dataKind: DataSourceKind;
  provenanceNote: string;
  contextBullets: string[];
  checkpoints: ReplayTvCheckpoint[];
  /** Seed for deterministic educational candle path. */
  pathSeed: number;
  /** Target path shape for generator. */
  pathShape: 'crash' | 'meltup' | 'whipsaw' | 'gap_down' | 'slow_bleed' | 'squeeze';
  barCount: number;
  academyLessonIds: string[];
  durationMinutes: number;
  estimatedDecisionCount: number;
  markets: ReplayTvMarketFocus[];
  tradingStyles: ReplayTvTradingStyle[];
  availableNews: ReplayTvNewsItem[];
  scoringEmphasis: ReplayTvScoringEmphasis[];
  educationalLinks: ReplayTvEducationalLink[];
  /** Optional explicit episode types; inferred from collections when omitted. */
  kinds?: ReplayTvEpisodeKind[];
  /**
   * When true, waiting / skipping / protecting attention is the intended process lesson.
   * Never grades P&L — only that inaction can be the correct research decision.
   */
  inactionIsValidProcess?: boolean;
  /** Premium-only when true (advanced library / expert rooms). */
  premiumOnly?: boolean;
  topics?: ReplayTvTopic[];
  eventKind?: ReplayTvEventKind;
  scenarioStartIndex?: number;
  revealWindowEndIndex?: number;
  fundamentals?: ReplayTvFundamentalNote[];
  revealBeats?: ReplayTvRevealBeat[];
  /** Overlay for library filters. Defaults from `difficulty`. */
  practiceDifficulty?: ReplayPracticeDifficulty;
  /** Hide the competency being tested (advanced/mixed default). */
  concealCompetency?: boolean;
  conceptIds?: string[];
  license?: ReplayLicenseKind;
}

export interface ReplayTvCollection {
  id: ReplayTvCollectionId;
  title: string;
  description: string;
}

export interface ReplayTvChecklist {
  namedInvalidation: boolean;
  notedRegime: boolean;
  consideredTimeBudget: boolean;
  wroteReasoning: boolean;
  consideredAlternative: boolean;
}

export interface ReplayTvReasoning {
  thesis: string;
  evidence: string;
  invalidation: string;
  /** Process confidence 1–5 — never a forecast of price direction. */
  confidence: number;
  mainUncertainty: string;
  why?: string;
  whatWouldChangeMind?: string;
  riskAssessment?: string;
  intendedSize?: string;
  expectedRisk?: string;
  alternatives?: string;
  /** After-the-fact process note. Graded as reflection, never as P/L. */
  reflection?: string;
  freeText?: string;
}

export interface ReplayTvInformationBoundary {
  scenarioStart: number;
  decisionTime: number;
  informationCutoff: number;
  revealWindowEnd: number;
}

export interface ReplayTvFundamentalNote {
  id: string;
  availableAtIndex: number;
  label: string;
  value: string;
}

export interface ReplayTvRevealBeat {
  untilIndex: number;
  whatHappened: string;
  whyKnown?: string;
  riskMaterialized?: string;
}

export interface ReplayTvAnnotation {
  id: string;
  type: 'level' | 'measure';
  price: number;
  secondPrice?: number;
  label: string;
}

export interface ReplayTvCoachNote {
  noticed: string;
  missed: string;
  changed: string | null;
  consistency: string;
  invalidationQuestion: string;
  /** Process comparison — never outcome-as-skill. */
  knew: string;
  believed: string;
  ignored: string;
  considered: string;
  /** What you decided at this freeze (process choice, not a prediction). */
  decided: string;
  /** Process strength — never “you were right because price moved.” */
  didWell: string;
  /** Next process skill to practise. */
  practiceNext: string;
  /** Optional one-block link into the Decision Reinforcement Layer. */
  practiceConnection?: {
    traitId: string;
    evidenceQuality: string;
    workingOn: string;
    nextPractice: string;
  } | null;
}

/** Post-reveal process comparison. Never treats P&L as proof of quality. */
export interface ReplayTvProcessComparison {
  knew: string;
  decided: string;
  changed: string;
  missed: string;
  didWell: string;
  practiceNext: string;
  practiceConnection?: {
    traitId: string;
    evidenceQuality: string;
    workingOn: string;
    nextPractice: string;
  } | null;
}

export interface ReplayTvDecisionRecord {
  checkpointId: string;
  decision: ReplayTvDecision;
  reasoning: string;
  structured?: ReplayTvReasoning;
  coach?: ReplayTvCoachNote;
  at: number;
  /** True when the commit happened while later tape was still hidden. */
  committedBlind?: boolean;
}

export interface ReplayTvScores {
  processQuality: number;
  reasoningQuality: number;
  checklistIntegrity: number;
  patience: number;
  evidenceQuality: number;
  riskAwareness: number;
  invalidationClarity: number;
  alternativeConsideration: number;
  adaptability: number;
  consistency: number;
  researchEfficiency: number;
  thesisQuality: number;
  uncertaintyRecognition: number;
  hindsightHygiene: number;
  reflectionQuality: number;
  /** DQS-compatible composite — never a profitability score. */
  overall: number;
  coaching: string[];
  journalPrompt: string;
  academyHint?: { lessonId: string; reason: string };
  processComparison: ReplayTvProcessComparison;
  knewThen: string;
  happenedAfter: string;
  outcomeNote: string;
}

export interface ReplayTvSession {
  id: string;
  episodeId: string;
  phase: ReplayTvPhase;
  createdAt: number;
  /** Full educational path kept in memory; UI must use visible slice helpers. */
  fullCandles: Candle[];
  /** Index of current checkpoint in episode.checkpoints */
  checkpointIndex: number;
  decisions: ReplayTvDecisionRecord[];
  checklist: ReplayTvChecklist;
  mentorReply?: string;
  lastCoach?: ReplayTvCoachNote;
  scores?: ReplayTvScores;
  revealed: boolean;
  /** Draft reasoning for the current freeze — persisted so kill/resume does not wipe notes. */
  draftReasoning?: ReplayTvReasoning;
  /** Set when the session was restored from persistence after backgrounding or app kill. */
  restoredFromPersist?: boolean;
  /** Inclusive bar index shown after reveal starts. Future beyond this stays hidden until advanced. */
  revealCursor?: number;
  annotations?: ReplayTvAnnotation[];
}

export interface ReplayTvProgress {
  completedEpisodeIds: string[];
  attemptCount: number;
  streakDays: number;
  lastCompletedDayKey: string | null;
  masteryByCollection: Partial<Record<ReplayTvCollectionId, number>>;
  bestProcessByEpisode: Record<string, number>;
  /** UTC month key YYYY-MM for monthly free session counters. */
  monthlyKey: string | null;
  monthlyCompletions: number;
}

export interface ReplayTvJournalReflection {
  title: string;
  body: string;
  episodeId: string;
  processScore: number;
  checkpointCount: number;
  skills: string[];
}
