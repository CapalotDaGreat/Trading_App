import { DEFAULT_SIMULATION_CURRENCY, SYNTHETIC_UNIVERSE } from '../constants/simulation.constants';
import type { SimulationScenario } from '../types/scenario.types';
import { isScenarioDifficulty } from './scenario-difficulty.service';
import { generateSimulationScenario } from './scenario-generator.service';
import type {
  SimulationAccount,
  SimulationAssetType,
  SimulationCloseReview,
  SimulationDecision,
  SimulationDecisionCheckpoint,
  SimulationMode,
  SimulationOrder,
  SimulationPosition,
  SimulationStatus,
  SimulationTransaction,
} from '../types/simulation.types';

export interface SimulationPersistState {
  accountsByUser: Record<string, SimulationAccount>;
  archivesByUser: Record<string, SimulationAccount[]>;
}

function fallbackAssetType(symbol: string): SimulationAssetType {
  return SYNTHETIC_UNIVERSE.find((item) => item.symbol === symbol)?.assetType ?? 'equity';
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function migrateStatus(raw: unknown): SimulationStatus {
  const value = asString(raw, 'active');
  if (value === 'archived' || value === 'challenge_failed' || value === 'active') return value;
  if (value === 'reset') return 'archived';
  return 'active';
}

function migrateMode(raw: unknown): SimulationMode {
  const value = asString(raw, 'standard');
  if (value === 'beginner' || value === 'standard' || value === 'challenge') return value;
  return 'standard';
}

export function migrateSimulationPosition(raw: Record<string, unknown>): SimulationPosition {
  const symbol = asString(raw.symbol).toUpperCase();
  const averageEntryPrice = asNumber(raw.averageEntryPrice ?? raw.averageEntry);
  const quantity = asNumber(raw.quantity);
  const currentPrice = asNumber(raw.currentPrice, averageEntryPrice);
  const marketValue = asNumber(raw.marketValue, quantity * currentPrice);
  return {
    symbol,
    assetType: (asString(raw.assetType) as SimulationAssetType) || fallbackAssetType(symbol),
    quantity,
    averageEntryPrice,
    currentPrice,
    marketValue,
    unrealizedPnL: asNumber(raw.unrealizedPnL),
    realizedPnL: asNumber(raw.realizedPnL),
    portfolioWeight: asNumber(raw.portfolioWeight ?? raw.exposurePercent),
  };
}

export function migrateSimulationTransaction(
  raw: Record<string, unknown>,
  accountId: string,
): SimulationTransaction {
  const executionPrice = asNumber(raw.executionPrice ?? raw.price);
  const grossValue = asNumber(raw.grossValue ?? raw.totalValue);
  const fees = asNumber(raw.fees);
  const side = asString(raw.side, 'buy') === 'sell' ? 'sell' : 'buy';
  const netValue =
    typeof raw.netValue === 'number'
      ? raw.netValue
      : side === 'buy'
        ? grossValue + fees
        : grossValue - fees;
  const symbol = asString(raw.symbol).toUpperCase();
  return {
    id: asString(raw.id, `txn_migrated_${asString(raw.timestamp, '0')}`),
    accountId: asString(raw.accountId, accountId),
    timestamp: asString(raw.timestamp),
    symbol,
    assetType: (asString(raw.assetType) as SimulationAssetType) || fallbackAssetType(symbol),
    side,
    quantity: asNumber(raw.quantity),
    executionPrice,
    grossValue,
    fees,
    netValue,
    resultingCashBalance: asNumber(raw.resultingCashBalance),
    resultingPositionQuantity: asNumber(raw.resultingPositionQuantity),
    decisionId: typeof raw.decisionId === 'string' ? raw.decisionId : undefined,
    journalEntryId: typeof raw.journalEntryId === 'string' ? raw.journalEntryId : undefined,
    orderId: typeof raw.orderId === 'string' ? raw.orderId : undefined,
    reason: typeof raw.reason === 'string' ? raw.reason : undefined,
  };
}

function migrateDecision(raw: Record<string, unknown>, accountId: string): SimulationDecision {
  return {
    id: asString(raw.id, `dec_migrated`),
    accountId: asString(raw.accountId, accountId),
    symbol: asString(raw.symbol).toUpperCase(),
    thesis: asString(raw.thesis, asString(raw.reasonForEntry, 'Migrated decision')),
    setup: typeof raw.setup === 'string' ? raw.setup : undefined,
    evidence: typeof raw.evidence === 'string' ? raw.evidence : undefined,
    confidence:
      raw.confidence === 'low' || raw.confidence === 'medium' || raw.confidence === 'high'
        ? raw.confidence
        : undefined,
    invalidation: typeof raw.invalidation === 'string' ? raw.invalidation : undefined,
    expectedRisk: typeof raw.expectedRisk === 'string' ? raw.expectedRisk : undefined,
    intendedPositionSize: typeof raw.intendedPositionSize === 'string' ? raw.intendedPositionSize : undefined,
    expectedScenarios: typeof raw.expectedScenarios === 'string' ? raw.expectedScenarios : undefined,
    managementChange: typeof raw.managementChange === 'string' ? raw.managementChange : undefined,
    exitReasoning: typeof raw.exitReasoning === 'string' ? raw.exitReasoning : undefined,
    reasonForEntry: typeof raw.reasonForEntry === 'string' ? raw.reasonForEntry : undefined,
    createdAt: asString(raw.createdAt),
    closedAt: typeof raw.closedAt === 'string' ? raw.closedAt : undefined,
    closeReview:
      raw.closeReview && typeof raw.closeReview === 'object'
        ? (raw.closeReview as SimulationCloseReview)
        : undefined,
  };
}

function migrateOrder(raw: Record<string, unknown>, accountId: string): SimulationOrder {
  return {
    id: asString(raw.id, 'ord_migrated'),
    accountId: asString(raw.accountId, accountId),
    type: raw.type === 'limit' || raw.type === 'stop' || raw.type === 'take_profit' ? raw.type : 'market',
    side: asString(raw.side, 'buy') === 'sell' ? 'sell' : 'buy',
    symbol: asString(raw.symbol).toUpperCase(),
    assetType: (asString(raw.assetType) as SimulationAssetType) || 'equity',
    quantity: asNumber(raw.quantity),
    status:
      raw.status === 'rejected' || raw.status === 'pending' || raw.status === 'cancelled'
        ? raw.status
        : 'filled',
    createdAt: asString(raw.createdAt),
    filledAt: typeof raw.filledAt === 'string' ? raw.filledAt : undefined,
    filledTransactionId: typeof raw.filledTransactionId === 'string' ? raw.filledTransactionId : undefined,
  };
}

export function migrateSimulationAccount(raw: Record<string, unknown>): SimulationAccount {
  const id = asString(raw.id ?? raw.accountId, `sim_migrated`);
  const positions = Array.isArray(raw.positions)
    ? raw.positions
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map(migrateSimulationPosition)
    : [];
  const transactions = Array.isArray(raw.transactions)
    ? raw.transactions
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => migrateSimulationTransaction(item, id))
    : [];
  const investedAmount =
    typeof raw.investedAmount === 'number'
      ? raw.investedAmount
      : positions.reduce((sum, position) => sum + position.marketValue, 0);
  const currentDrawdown =
    typeof raw.currentDrawdown === 'number' ? raw.currentDrawdown : -Math.abs(asNumber(raw.drawdown));
  const maxDrawdown =
    typeof raw.maxDrawdown === 'number' ? raw.maxDrawdown : currentDrawdown;

  return {
    id,
    accountId: asString(raw.accountId, id),
    userId: asString(raw.userId),
    currency: asString(raw.currency, DEFAULT_SIMULATION_CURRENCY).toUpperCase(),
    mode: migrateMode(raw.mode),
    startingBalance: asNumber(raw.startingBalance),
    cashBalance: asNumber(raw.cashBalance),
    investedAmount,
    equity: asNumber(raw.equity),
    buyingPower: asNumber(raw.buyingPower, asNumber(raw.cashBalance)),
    positions,
    transactions,
    orders: Array.isArray(raw.orders)
      ? raw.orders
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => migrateOrder(item, id))
      : [],
    decisions: Array.isArray(raw.decisions)
      ? raw.decisions
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map((item) => migrateDecision(item, id))
      : [],
    realizedPnL: asNumber(raw.realizedPnL),
    unrealizedPnL: asNumber(raw.unrealizedPnL),
    totalReturn: asNumber(raw.totalReturn),
    peakEquity: asNumber(raw.peakEquity, asNumber(raw.equity)),
    currentDrawdown,
    maxDrawdown,
    drawdown: Math.abs(currentDrawdown),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    resetAt: typeof raw.resetAt === 'string' ? raw.resetAt : undefined,
    status: migrateStatus(raw.status ?? raw.simulationStatus),
    challengeId: typeof raw.challengeId === 'string' ? raw.challengeId : undefined,
    lastChallengeViolation:
      typeof raw.lastChallengeViolation === 'string' ? raw.lastChallengeViolation : undefined,
    scenario: migrateScenario(raw.scenario),
    checkpoints: Array.isArray(raw.checkpoints)
      ? (raw.checkpoints.filter((item) => Boolean(item) && typeof item === 'object') as SimulationDecisionCheckpoint[])
      : [],
  };
}

function migrateScenario(raw: unknown): SimulationScenario | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as SimulationScenario;
  if (typeof value.seed !== 'number' || !value.id || !Array.isArray(value.events)) return undefined;
  return {
    ...value,
    engineVersion: value.engineVersion === 2 ? 2 : 1,
    difficulty: isScenarioDifficulty(value.difficulty) ? value.difficulty : 'intermediate',
    segments: Array.isArray(value.segments) ? value.segments : [],
    climate: value.climate ?? { macro: 'uncertain', sentiment: 'mixed', liquidity: 'normal' },
    friction: value.friction ?? { spreadBps: 4, slippageBps: 3, feeBps: 2, gapRisk: 0.15, executionUncertainty: 0.18 },
    decisionWindows: Array.isArray(value.decisionWindows) ? value.decisionWindows : [],
    paths: value.paths && typeof value.paths === 'object' ? value.paths : {},
    marketPath: Array.isArray(value.marketPath) ? value.marketPath : [],
    horizonDays: value.horizonDays ?? 32,
    clockMode: value.clockMode ?? 'normal',
    complexity: {
      volatility: value.complexity?.volatility ?? 0.5,
      informationFriction: value.complexity?.informationFriction ?? 0.45,
      assetCount: value.complexity?.assetCount ?? value.assets?.length ?? 4,
      eventCount: value.complexity?.eventCount ?? value.events.length,
      regimeUncertainty: value.complexity?.regimeUncertainty ?? 0.35,
      timePressure: value.complexity?.timePressure ?? 0.4,
      psychologicalPressure: value.complexity?.psychologicalPressure ?? 0.35,
      incompleteInformation: value.complexity?.incompleteInformation ?? 0.45,
    },
    assets: (value.assets ?? []).map((asset) => ({
      ...asset,
      name: asset.name ?? asset.symbol,
      sector: asset.sector ?? 'index',
      beta: asset.beta ?? 1,
      liquidity: asset.liquidity ?? 0.7,
      meanReversion: asset.meanReversion ?? 0.2,
      momentumBias: asset.momentumBias ?? 0,
    })),
  };
}

export function migrateSimulationPersist(persisted: unknown): SimulationPersistState {
  const root = persisted && typeof persisted === 'object' ? (persisted as Record<string, unknown>) : {};
  const accountsByUser: Record<string, SimulationAccount> = {};
  const incomingAccounts =
    root.accountsByUser && typeof root.accountsByUser === 'object'
      ? (root.accountsByUser as Record<string, unknown>)
      : {};
  for (const [userId, raw] of Object.entries(incomingAccounts)) {
    if (raw && typeof raw === 'object') {
      accountsByUser[userId] = migrateSimulationAccount(raw as Record<string, unknown>);
    }
  }

  const archivesByUser: Record<string, SimulationAccount[]> = {};
  const incomingArchives =
    root.archivesByUser && typeof root.archivesByUser === 'object'
      ? (root.archivesByUser as Record<string, unknown>)
      : {};
  for (const [userId, raw] of Object.entries(incomingArchives)) {
    if (!Array.isArray(raw)) continue;
    archivesByUser[userId] = raw
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map(migrateSimulationAccount);
  }

  return { accountsByUser, archivesByUser };
}

export const SIMULATION_TRANSACTION_PERSIST_CAP = 80;
export const SIMULATION_CHECKPOINT_PERSIST_CAP = 40;

/** Drop regenerated tape so AsyncStorage does not hold ~32-day multi-asset paths. */
export function slimScenarioForPersist(scenario: SimulationScenario): SimulationScenario {
  return { ...scenario, paths: {}, marketPath: [] };
}

export function estimatedScenarioTapeBytes(scenario: SimulationScenario): number {
  return JSON.stringify({ paths: scenario.paths, marketPath: scenario.marketPath }).length;
}

/**
 * Rebuild paths from the internal seed. Clock, answered windows, and book state stay as persisted.
 * Seed is never shown in the UI.
 */
export function hydrateScenarioTape(scenario: SimulationScenario): SimulationScenario {
  const hasTape =
    Array.isArray(scenario.marketPath) &&
    scenario.marketPath.length > 0 &&
    Boolean(scenario.paths) &&
    Object.keys(scenario.paths).length > 0;
  if (hasTape) return scenario;

  const regenerated = generateSimulationScenario({
    userId: 'hydrate',
    seed: scenario.seed,
    difficulty: scenario.difficulty,
    focus: scenario.focus,
    now: scenario.createdAt,
  });
  return {
    ...scenario,
    engineVersion: regenerated.engineVersion,
    paths: regenerated.paths,
    marketPath: regenerated.marketPath,
    assets: scenario.assets?.length ? scenario.assets : regenerated.assets,
    events: scenario.events?.length ? scenario.events : regenerated.events,
    segments: scenario.segments?.length ? scenario.segments : regenerated.segments,
  };
}

export function slimSimulationAccountForPersist(account: SimulationAccount): SimulationAccount {
  return {
    ...account,
    scenario: account.scenario ? slimScenarioForPersist(account.scenario) : undefined,
    transactions: (account.transactions ?? []).slice(-SIMULATION_TRANSACTION_PERSIST_CAP),
    checkpoints: (account.checkpoints ?? []).slice(-SIMULATION_CHECKPOINT_PERSIST_CAP),
  };
}

export function slimSimulationPersist(state: SimulationPersistState): SimulationPersistState {
  return {
    accountsByUser: Object.fromEntries(
      Object.entries(state.accountsByUser).map(([userId, account]) => [
        userId,
        slimSimulationAccountForPersist(account),
      ]),
    ),
    archivesByUser: Object.fromEntries(
      Object.entries(state.archivesByUser).map(([userId, accounts]) => [
        userId,
        accounts.map(slimSimulationAccountForPersist),
      ]),
    ),
  };
}
