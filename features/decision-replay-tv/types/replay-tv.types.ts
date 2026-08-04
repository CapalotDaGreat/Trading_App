import type { DataSourceKind } from '@/features/markets/constants/data-source';
import type { Candle, CandleInterval } from '@/shared/types/market';

export type ReplayTvDifficulty = 'foundation' | 'intermediate' | 'advanced';

export type ReplayTvCollectionId =
  | 'crashes'
  | 'manias'
  | 'policy'
  | 'earnings'
  | 'crypto'
  | 'featured';

export type ReplayTvPhase =
  | 'intro'
  | 'context'
  | 'watching'
  | 'decision'
  | 'mentor'
  | 'reveal'
  | 'coaching'
  | 'complete';

/** Process decision at a freeze — never a trade instruction. */
export type ReplayTvDecision =
  | 'research_more'
  | 'write_thesis'
  | 'wait'
  | 'skip'
  | 'protect_attention';

export interface ReplayTvCheckpoint {
  id: string;
  /** Bar index (inclusive) where future is still hidden. */
  freezeIndex: number;
  prompt: string;
  mentorFollowUp: string;
  /** Spoiler-free teaching hint after reveal only. */
  teachingNote: string;
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
}

export interface ReplayTvDecisionRecord {
  checkpointId: string;
  decision: ReplayTvDecision;
  reasoning: string;
  at: number;
}

export interface ReplayTvScores {
  processQuality: number;
  reasoningQuality: number;
  checklistIntegrity: number;
  patience: number;
  overall: number;
  coaching: string[];
  journalPrompt: string;
  academyHint?: { lessonId: string; reason: string };
}

export interface ReplayTvSession {
  id: string;
  episodeId: string;
  phase: ReplayTvPhase;
  createdAt: number;
  fullCandles: Candle[];
  /** Index of current checkpoint in episode.checkpoints */
  checkpointIndex: number;
  decisions: ReplayTvDecisionRecord[];
  checklist: ReplayTvChecklist;
  mentorReply?: string;
  scores?: ReplayTvScores;
  revealed: boolean;
}

export interface ReplayTvProgress {
  completedEpisodeIds: string[];
  attemptCount: number;
  streakDays: number;
  lastCompletedDayKey: string | null;
  masteryByCollection: Partial<Record<ReplayTvCollectionId, number>>;
  bestProcessByEpisode: Record<string, number>;
}
