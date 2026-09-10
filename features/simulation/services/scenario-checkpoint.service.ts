import { visibleScenarioEvents } from './scenario-visibility.service';
import type {
  SimulationAccount,
  SimulationDecisionCheckpoint,
  SimulationLedgerSnapshot,
} from '../types/simulation.types';

export type CheckpointDraft = Omit<SimulationDecisionCheckpoint, 'id' | 'at' | 'snapshot'>;

export function ledgerSnapshotFromAccount(account: SimulationAccount): SimulationLedgerSnapshot {
  const visible = account.scenario ? visibleScenarioEvents(account.scenario).map((item) => item.id) : [];
  return {
    clockDay: account.scenario?.clockDay ?? 0,
    cashBalance: account.cashBalance,
    equity: account.equity,
    realizedPnL: account.realizedPnL,
    unrealizedPnL: account.unrealizedPnL,
    positions: account.positions.map((position) => ({
      symbol: position.symbol,
      quantity: position.quantity,
      averageEntryPrice: position.averageEntryPrice,
      portfolioWeight: position.portfolioWeight,
    })),
    visibleEventIds: visible,
  };
}

export function appendDecisionCheckpoint(
  account: SimulationAccount,
  draft: CheckpointDraft,
  now = new Date().toISOString(),
): SimulationAccount {
  const checkpoints = account.checkpoints ?? [];
  const checkpoint: SimulationDecisionCheckpoint = {
    ...draft,
    id: `chk_${checkpoints.length + 1}`,
    at: now,
    snapshot: ledgerSnapshotFromAccount(account),
  };
  return { ...account, checkpoints: [...checkpoints, checkpoint] };
}
