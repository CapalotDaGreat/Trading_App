export type TradeDirection = 'long' | 'short';
export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'open';
export type TradeEmotion = 'confident' | 'fearful' | 'greedy' | 'neutral' | 'fomo';

/** Process mistake categories — educational, never buy/sell labels. */
export type JournalMistakeCategory =
  | 'invalidation'
  | 'fomo'
  | 'size'
  | 'revenge'
  | 'no_plan'
  | 'regime_mismatch'
  | 'other';

export type EmotionIntensity = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  outcome: TradeOutcome;
  pnl?: number;
  pnlPercent?: number;
  strategy?: string;
  tags: string[];
  emotion?: TradeEmotion;
  emotionIntensity?: EmotionIntensity;
  notes: string;
  lessonsLearned?: string;
  screenshotUrls?: string[];
  /** Did the written plan / checklist hold? */
  planAdhered?: boolean;
  mistakeCategory?: JournalMistakeCategory;
  regimeNote?: string;
  improvementCommitment?: string;
  /** Durable cross-links into the learning OS. */
  linkedDecisionRecordId?: string;
  linkedReplayHref?: string;
  linkedAcademyLessonIds?: string[];
  tradedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryDocument {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  outcome: TradeOutcome;
  pnl?: number;
  pnlPercent?: number;
  strategy?: string;
  tags: string[];
  emotion?: TradeEmotion;
  emotionIntensity?: EmotionIntensity;
  notes: string;
  lessonsLearned?: string;
  screenshotUrls?: string[];
  planAdhered?: boolean;
  mistakeCategory?: JournalMistakeCategory;
  regimeNote?: string;
  improvementCommitment?: string;
  linkedDecisionRecordId?: string;
  linkedReplayHref?: string;
  linkedAcademyLessonIds?: string[];
  tradedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryInput {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  outcome?: TradeOutcome;
  strategy?: string;
  tags?: string[];
  emotion?: TradeEmotion;
  emotionIntensity?: EmotionIntensity;
  notes: string;
  lessonsLearned?: string;
  planAdhered?: boolean;
  mistakeCategory?: JournalMistakeCategory;
  regimeNote?: string;
  improvementCommitment?: string;
  linkedDecisionRecordId?: string;
  linkedReplayHref?: string;
  linkedAcademyLessonIds?: string[];
  tradedAt?: string;
  closedAt?: string;
}

export interface UpdateJournalEntryInput {
  exitPrice?: number;
  outcome?: TradeOutcome;
  pnl?: number;
  pnlPercent?: number;
  strategy?: string;
  tags?: string[];
  emotion?: TradeEmotion;
  emotionIntensity?: EmotionIntensity;
  notes?: string;
  lessonsLearned?: string;
  planAdhered?: boolean;
  mistakeCategory?: JournalMistakeCategory;
  regimeNote?: string;
  improvementCommitment?: string;
  linkedDecisionRecordId?: string;
  linkedReplayHref?: string;
  linkedAcademyLessonIds?: string[];
  closedAt?: string;
}

export interface JournalStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  /** Process coverage — not a performance trophy. */
  emotionTaggedRate: number;
  lessonsRate: number;
  planAdherenceRate: number;
}

export interface JournalExportRow {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  outcome: TradeOutcome;
  pnl: number | null;
  pnlPercent: number | null;
  strategy: string | null;
  tags: string;
  emotion: TradeEmotion | null;
  lessonsLearned: string | null;
  planAdhered: boolean | null;
  mistakeCategory: JournalMistakeCategory | null;
  notes: string;
  tradedAt: string;
  closedAt: string | null;
}
