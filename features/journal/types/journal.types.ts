export type TradeDirection = 'long' | 'short';
export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'open';
export type TradeEmotion = 'confident' | 'fearful' | 'greedy' | 'neutral' | 'fomo';

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
  notes: string;
  lessonsLearned?: string;
  screenshotUrls?: string[];
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
  notes: string;
  lessonsLearned?: string;
  screenshotUrls?: string[];
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
  notes: string;
  lessonsLearned?: string;
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
  notes?: string;
  lessonsLearned?: string;
  closedAt?: string;
}

export interface JournalStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
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
  notes: string;
  tradedAt: string;
  closedAt: string | null;
}
