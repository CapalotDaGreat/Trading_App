import {
  DEFAULT_SIMULATION_CURRENCY,
  DEFAULT_STARTING_BALANCE,
  SIMULATION_FEE_RATE,
  SYNTHETIC_UNIVERSE,
  challengeById,
  isListedSimulationSymbol,
  listedSimulationInstrument,
} from '../constants/simulation.constants';
import type {
  IsoCurrencyCode,
  SimulationAccount,
  SimulationAssetType,
  SimulationChallengeConstraints,
  SimulationCloseReview,
  SimulationDecision,
  SimulationMode,
  SimulationOrder,
  SimulationPosition,
  SimulationResetSnapshot,
  SimulationResult,
  SimulationSide,
  SimulationTradeInput,
  SimulationTradePreview,
  SimulationTransaction,
} from '../types/simulation.types';
import { unitPriceInAccountCurrency } from './fx-conversion.service';
import { appendDecisionCheckpoint } from './scenario-checkpoint.service';
import {
  fromQtyTicks,
  grossValueMinor,
  toMajor,
  toMinor,
  toQtyTicks,
  weightedAveragePriceMajor,
} from './simulation-money.service';

export function roundMoney(value: number): number {
  return toMajor(toMinor(value));
}

export function roundQty(value: number): number {
  return fromQtyTicks(toQtyTicks(value));
}

function err(
  code: import('../types/simulation.types').SimulationErrorCode,
  message: string,
): SimulationResult<never> {
  return { ok: false, code, message };
}

function ok<T>(value: T): SimulationResult<T> {
  return { ok: true, value };
}

function ledgerPrice(symbol: string, nativePrice: number, accountCurrency: string): number {
  return roundMoney(unitPriceInAccountCurrency(symbol, nativePrice, accountCurrency));
}

export function assetTypeFor(symbol: string, explicit?: SimulationAssetType): SimulationAssetType {
  if (explicit) return explicit;
  const listed =
    SYNTHETIC_UNIVERSE.find((item) => item.symbol === symbol.toUpperCase()) ??
    listedSimulationInstrument(symbol);
  return listed?.assetType ?? 'equity';
}

function isActive(account: SimulationAccount): boolean {
  return account.status === 'active' || account.status === 'challenge_failed';
}

function recompute(account: SimulationAccount, now: string): SimulationAccount {
  const positions = account.positions.map((position) => {
    const marketValue = toMajor(grossValueMinor(position.quantity, position.currentPrice));
    const cost = toMajor(grossValueMinor(position.quantity, position.averageEntryPrice));
    return {
      ...position,
      marketValue,
      unrealizedPnL: roundMoney(marketValue - cost),
      portfolioWeight: 0,
    };
  });

  const investedAmount = roundMoney(positions.reduce((sum, position) => sum + position.marketValue, 0));
  const unrealizedPnL = roundMoney(positions.reduce((sum, position) => sum + position.unrealizedPnL, 0));
  const equity = roundMoney(account.cashBalance + investedAmount);
  const peakEquity = roundMoney(Math.max(account.peakEquity, equity));
  const currentDrawdown = peakEquity > 0 ? (equity - peakEquity) / peakEquity : 0;
  const maxDrawdown = Math.min(account.maxDrawdown, currentDrawdown);
  const drawdown = Math.abs(currentDrawdown);
  const totalReturn =
    account.startingBalance > 0 ? (equity - account.startingBalance) / account.startingBalance : 0;

  const withWeight: SimulationPosition[] = positions.map((position) => ({
    ...position,
    portfolioWeight: equity > 0 ? position.marketValue / equity : 0,
  }));

  return {
    ...account,
    positions: withWeight,
    investedAmount,
    equity,
    buyingPower: account.cashBalance,
    unrealizedPnL,
    totalReturn,
    peakEquity,
    currentDrawdown,
    maxDrawdown,
    drawdown,
    updatedAt: now,
  };
}

export function createSimulationAccount(input: {
  userId: string;
  mode?: SimulationMode;
  startingBalance?: number;
  currency?: IsoCurrencyCode;
  challengeId?: string;
  now?: string;
  scenario?: SimulationAccount['scenario'];
}): SimulationAccount {
  const now = input.now ?? new Date().toISOString();
  const startingBalance = roundMoney(input.startingBalance ?? DEFAULT_STARTING_BALANCE);
  const mode = input.mode ?? 'standard';
  const id = `sim_${input.userId}_${now}`;
  const account: SimulationAccount = {
    id,
    accountId: id,
    userId: input.userId,
    currency: (input.currency ?? DEFAULT_SIMULATION_CURRENCY).toUpperCase(),
    mode,
    startingBalance,
    cashBalance: startingBalance,
    investedAmount: 0,
    equity: startingBalance,
    buyingPower: startingBalance,
    positions: [],
    transactions: [],
    orders: [],
    decisions: [],
    checkpoints: [],
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalReturn: 0,
    peakEquity: startingBalance,
    currentDrawdown: 0,
    maxDrawdown: 0,
    drawdown: 0,
    createdAt: now,
    updatedAt: now,
    status: 'active',
    challengeId: input.challengeId ?? (mode === 'challenge' ? 'one-percent-risk' : undefined),
    scenario: input.scenario,
  };
  return recompute(account, now);
}

export function markToMarket(
  account: SimulationAccount,
  prices: Record<string, number>,
  now = new Date().toISOString(),
): SimulationAccount {
  const next: SimulationAccount = {
    ...account,
    positions: account.positions.map((position) => ({
      ...position,
      currentPrice:
        prices[position.symbol] != null
          ? ledgerPrice(position.symbol, prices[position.symbol]!, account.currency)
          : position.currentPrice,
    })),
  };
  return applyChallengeStatus(recompute(next, now));
}

function nextId(prefix: string, count: number): string {
  return `${prefix}_${count + 1}`;
}

function constraintFor(account: SimulationAccount): SimulationChallengeConstraints | undefined {
  if (account.mode === 'beginner') return challengeById('beginner-diversify');
  if (account.mode !== 'challenge') return undefined;
  return challengeById(account.challengeId);
}

function thesisText(input: SimulationTradeInput): string {
  return (input.thesis ?? input.reason ?? '').trim();
}

const GENERIC_PROCESS = /^(simulated entry|test|n\/a|na|none|-|\.|todo|tbd)$/i;

export function educationalProcessGate(input: SimulationTradeInput): string | undefined {
  const thesis = thesisText(input);
  const invalidation = (input.invalidation ?? '').trim();
  if (thesis.length < 8 || GENERIC_PROCESS.test(thesis)) {
    return 'Write a specific thesis before recording a simulated entry. A generic fill note is not a thesis.';
  }
  if (invalidation.length < 8 || GENERIC_PROCESS.test(invalidation)) {
    return 'Write what would prove the idea wrong before recording a simulated entry.';
  }
  return undefined;
}

function riskPercentOfEquity(
  input: SimulationTradeInput,
  equity: number,
  entry: number,
  stop: number | undefined,
): number | undefined {
  if (stop == null || equity <= 0) return undefined;
  const distance = Math.abs(entry - stop);
  if (distance <= 0) return undefined;
  return (distance * input.quantity) / equity;
}

function challengeBuyViolation(
  account: SimulationAccount,
  input: SimulationTradeInput,
  nextMarketValue: number,
  nextEquity: number,
  entry: number,
  stop: number | undefined,
): string | undefined {
  const rules = constraintFor(account);
  if (!rules) return undefined;

  if (rules.requireThesis && !input.decisionId && !thesisText(input)) {
    return 'This challenge requires a recorded thesis before a simulated buy.';
  }

  if (rules.maxRiskPercentPerDecision != null) {
    if (stop == null) {
      return 'This challenge requires a stop so risk per decision can be measured.';
    }
    const risk = riskPercentOfEquity(input, account.equity, entry, stop);
    if (risk == null || risk > rules.maxRiskPercentPerDecision + 1e-9) {
      return `Risk per decision exceeds ${(rules.maxRiskPercentPerDecision * 100).toFixed(0)}% of equity.`;
    }
  }

  if (rules.maxSingleAssetExposure != null && nextEquity > 0) {
    const weight = nextMarketValue / nextEquity;
    if (weight > rules.maxSingleAssetExposure + 1e-9) {
      return `Single-asset weight would exceed ${(rules.maxSingleAssetExposure * 100).toFixed(0)}% of equity.`;
    }
  }

  return undefined;
}

function applyChallengeStatus(account: SimulationAccount): SimulationAccount {
  const rules = constraintFor(account);
  if (!rules?.maxDrawdownMagnitude) return account;
  if (Math.abs(account.maxDrawdown) + 1e-12 >= rules.maxDrawdownMagnitude) {
    return {
      ...account,
      status: 'challenge_failed',
      lastChallengeViolation: `Drawdown reached ${(rules.maxDrawdownMagnitude * 100).toFixed(0)}% of peak equity.`,
    };
  }
  return account;
}

function validateTradeBasics(
  account: SimulationAccount,
  input: SimulationTradeInput,
): SimulationResult<never> | null {
  if (!account?.id || !account.userId) {
    return err('invalid_account', 'This simulated account is invalid.');
  }
  if (account.status === 'archived') {
    return err('account_inactive', 'This simulation was archived. Open a new paper account to trade.');
  }
  if (!isActive(account)) {
    return err('invalid_account', 'This simulated account cannot accept trades.');
  }
  if (!input.symbol.trim() || !isListedSimulationSymbol(input.symbol)) {
    return err('invalid_symbol', 'Choose a listed simulated instrument.');
  }
  if (!(roundQty(input.quantity) > 0)) {
    return err('invalid_quantity', 'Quantity must be greater than zero.');
  }
  if (!(roundMoney(input.price) > 0)) {
    return err('invalid_price', 'Price must be greater than zero.');
  }
  if (input.stopPrice != null && !(input.stopPrice > 0)) {
    return err('invalid_stop', 'Stop price must be greater than zero when provided.');
  }
  return null;
}

function attachDecision(
  account: SimulationAccount,
  input: SimulationTradeInput,
  symbol: string,
  now: string,
): { account: SimulationAccount; decisionId?: string } {
  if (input.decisionId) {
    return { account, decisionId: input.decisionId };
  }
  const thesis = thesisText(input);
  if (!thesis && !input.setup && !input.evidence) {
    return { account, decisionId: undefined };
  }
  const decision: SimulationDecision = {
    id: nextId('dec', account.decisions.length),
    accountId: account.id,
    symbol,
    thesis: thesis,
    setup: input.setup,
    evidence: input.evidence,
    confidence: input.confidence,
    invalidation: input.invalidation,
    expectedRisk: input.expectedRisk,
    intendedPositionSize: input.intendedPositionSize,
    expectedScenarios: input.expectedScenarios,
    managementChange: input.managementChange,
    exitReasoning: input.exitReasoning,
    reasonForEntry: input.reason ?? thesis,
    createdAt: now,
  };
  return {
    account: { ...account, decisions: [...account.decisions, decision] },
    decisionId: decision.id,
  };
}

export function previewBuy(
  account: SimulationAccount,
  input: SimulationTradeInput,
): SimulationResult<SimulationTradePreview> {
  const invalid = validateTradeBasics(account, input);
  if (invalid) return invalid;
  const symbol = input.symbol.toUpperCase();
  const quantity = roundQty(input.quantity);
  const price = ledgerPrice(symbol, input.price, account.currency);
  const stop = input.stopPrice != null ? ledgerPrice(symbol, input.stopPrice, account.currency) : undefined;
  const fees = roundMoney(input.fees ?? roundMoney(toMajor(grossValueMinor(quantity, price)) * SIMULATION_FEE_RATE));
  const gross = toMajor(grossValueMinor(quantity, price));
  const net = roundMoney(gross + fees);
  if (net > account.cashBalance + 1e-9) {
    return err('insufficient_cash', 'Not enough simulated cash for this buy.');
  }
  const existing = account.positions.find((position) => position.symbol === symbol);
  const nextQty = roundQty((existing?.quantity ?? 0) + quantity);
  const cashAfter = roundMoney(account.cashBalance - net);
  const positionValue = toMajor(grossValueMinor(nextQty, price));
  const equityAfter = roundMoney(cashAfter + account.investedAmount - (existing?.marketValue ?? 0) + positionValue);
  const violation = challengeBuyViolation(
    account,
    { ...input, quantity, price },
    positionValue,
    equityAfter,
    price,
    stop,
  );
  if (violation) return err('challenge_violation', violation);
  const processMissing = educationalProcessGate({ ...input, quantity, price });
  if (processMissing) return err('process_required', processMissing);

  return ok({
    side: 'buy',
    symbol,
    assetType: assetTypeFor(symbol, input.assetType),
    quantity,
    executionPrice: price,
    estimatedPositionValue: toMajor(grossValueMinor(quantity, price)),
    fees,
    cashBefore: account.cashBalance,
    cashAfter,
    portfolioWeightAfter: equityAfter > 0 ? positionValue / equityAfter : 0,
    riskPercent: riskPercentOfEquity({ ...input, quantity, price }, account.equity, price, stop),
    simulationWarning:
      'SIMULATED TRADING. This is paper capital, not real money. A profitable fill is not automatically a good decision.',
  });
}

export function previewSell(
  account: SimulationAccount,
  input: SimulationTradeInput,
): SimulationResult<SimulationTradePreview> {
  const invalid = validateTradeBasics(account, input);
  if (invalid) return invalid;
  const quantity = roundQty(input.quantity);
  const symbol = input.symbol.toUpperCase();
  const price = ledgerPrice(symbol, input.price, account.currency);
  const existing = account.positions.find((position) => position.symbol === symbol);
  if (!existing || existing.quantity + 1e-9 < quantity) {
    return err('insufficient_quantity', 'Not enough simulated quantity to sell.');
  }
  const fees = roundMoney(input.fees ?? roundMoney(toMajor(grossValueMinor(quantity, price)) * SIMULATION_FEE_RATE));
  const gross = toMajor(grossValueMinor(quantity, price));
  const net = roundMoney(gross - fees);
  const cost = toMajor(grossValueMinor(quantity, existing.averageEntryPrice));
  const realized = roundMoney(gross - cost - fees);
  const remaining = roundQty(existing.quantity - quantity);
  const cashAfter = roundMoney(account.cashBalance + net);
  const remainingValue = remaining > 0 ? toMajor(grossValueMinor(remaining, price)) : 0;
  const otherInvested = roundMoney(account.investedAmount - existing.marketValue);
  const equityAfter = roundMoney(cashAfter + otherInvested + remainingValue);

  return ok({
    side: 'sell',
    symbol,
    assetType: existing.assetType,
    quantity,
    executionPrice: price,
    estimatedPositionValue: gross,
    fees,
    cashBefore: account.cashBalance,
    cashAfter,
    portfolioWeightAfter: equityAfter > 0 ? remainingValue / equityAfter : 0,
    estimatedRealizedPnL: realized,
    remainingQuantity: remaining,
    simulationWarning:
      'SIMULATED TRADING. Closing a paper position is a chance to review process, not a win/loss trophy.',
  });
}

export function executeBuy(
  account: SimulationAccount,
  input: SimulationTradeInput,
): SimulationResult<SimulationAccount> {
  const preview = previewBuy(account, input);
  if (!preview.ok) return preview;

  const quantity = roundQty(input.quantity);
  const symbol = preview.value.symbol;
  const price = preview.value.executionPrice;
  const fees = preview.value.fees;
  const gross = preview.value.estimatedPositionValue;
  const net = roundMoney(gross + fees);
  const now = input.now ?? new Date().toISOString();
  const withDecision = attachDecision(account, input, symbol, now);
  const working = withDecision.account;
  const existing = working.positions.find((position) => position.symbol === symbol);
  const nextQty = roundQty((existing?.quantity ?? 0) + quantity);
  const nextAvg = existing
    ? weightedAveragePriceMajor(existing.quantity, existing.averageEntryPrice, quantity, price)
    : price;
  const assetType = assetTypeFor(symbol, input.assetType);
  const nextPosition: SimulationPosition = {
    symbol,
    assetType,
    quantity: nextQty,
    averageEntryPrice: nextAvg,
    currentPrice: price,
    marketValue: toMajor(grossValueMinor(nextQty, price)),
    unrealizedPnL: 0,
    realizedPnL: existing?.realizedPnL ?? 0,
    portfolioWeight: 0,
  };

  const cashBalance = roundMoney(working.cashBalance - net);
  const orderId = nextId('ord', working.orders.length);
  const txnId = nextId('txn', working.transactions.length);
  const order: SimulationOrder = {
    id: orderId,
    accountId: working.id,
    type: 'market',
    side: 'buy',
    symbol,
    assetType,
    quantity,
    status: 'filled',
    createdAt: now,
    filledAt: now,
    filledTransactionId: txnId,
  };
  const transaction: SimulationTransaction = {
    id: txnId,
    accountId: working.id,
    timestamp: now,
    symbol,
    assetType,
    side: 'buy',
    quantity,
    executionPrice: price,
    grossValue: gross,
    fees,
    netValue: net,
    resultingCashBalance: cashBalance,
    resultingPositionQuantity: nextQty,
    decisionId: withDecision.decisionId ?? input.decisionId,
    journalEntryId: input.journalEntryId,
    orderId,
    reason: thesisText(input) || input.reason,
  };

  const draft: SimulationAccount = {
    ...working,
    cashBalance,
    positions: [...working.positions.filter((position) => position.symbol !== symbol), nextPosition],
    orders: [...working.orders, order],
    transactions: [...working.transactions, transaction],
  };

  const filled = applyChallengeStatus(recompute(draft, now));
  return ok(
    appendDecisionCheckpoint(
      filled,
      {
        kind: existing ? 'management' : 'entry',
        symbol,
        thesis: thesisText(input) || input.reason,
        evidence: input.evidence,
        confidence: input.confidence,
        invalidation: input.invalidation,
        positionSize: input.intendedPositionSize,
        risk: input.expectedRisk,
        expectedScenarios: input.expectedScenarios,
        managementChange: input.managementChange,
        decision: existing ? 'add' : 'enter',
      },
      now,
    ),
  );
}

export function executeSell(
  account: SimulationAccount,
  input: SimulationTradeInput,
): SimulationResult<SimulationAccount> {
  const preview = previewSell(account, input);
  if (!preview.ok) return preview;

  const quantity = roundQty(input.quantity);
  const symbol = preview.value.symbol;
  const price = preview.value.executionPrice;
  const existing = account.positions.find((position) => position.symbol === symbol)!;
  const fees = preview.value.fees;
  const gross = preview.value.estimatedPositionValue;
  const net = roundMoney(gross - fees);
  const realized = preview.value.estimatedRealizedPnL ?? 0;
  const remainingQty = roundQty(existing.quantity - quantity);
  const now = input.now ?? new Date().toISOString();

  const remainingPositions =
    remainingQty > 0
      ? account.positions.map((position) =>
          position.symbol === symbol
            ? {
                ...position,
                quantity: remainingQty,
                realizedPnL: roundMoney(position.realizedPnL + realized),
                currentPrice: price,
              }
            : position,
        )
      : account.positions.filter((position) => position.symbol !== symbol);

  const cashBalance = roundMoney(account.cashBalance + net);
  const orderId = nextId('ord', account.orders.length);
  const txnId = nextId('txn', account.transactions.length);
  const order: SimulationOrder = {
    id: orderId,
    accountId: account.id,
    type: 'market',
    side: 'sell',
    symbol,
    assetType: existing.assetType,
    quantity,
    status: 'filled',
    createdAt: now,
    filledAt: now,
    filledTransactionId: txnId,
  };
  const transaction: SimulationTransaction = {
    id: txnId,
    accountId: account.id,
    timestamp: now,
    symbol,
    assetType: existing.assetType,
    side: 'sell',
    quantity,
    executionPrice: price,
    grossValue: gross,
    fees,
    netValue: net,
    resultingCashBalance: cashBalance,
    resultingPositionQuantity: remainingQty,
    decisionId: input.decisionId,
    journalEntryId: input.journalEntryId,
    orderId,
    reason: input.reason,
  };

  let decisions = account.decisions;
  if (input.decisionId && remainingQty === 0) {
    decisions = decisions.map((decision) =>
      decision.id === input.decisionId ? { ...decision, closedAt: now } : decision,
    );
  } else if (remainingQty === 0) {
    const open = [...decisions].reverse().find((decision) => decision.symbol === symbol && !decision.closedAt);
    if (open) {
      decisions = decisions.map((decision) =>
        decision.id === open.id ? { ...decision, closedAt: now } : decision,
      );
    }
  }

  const draft: SimulationAccount = {
    ...account,
    cashBalance,
    realizedPnL: roundMoney(account.realizedPnL + realized),
    positions: remainingPositions,
    orders: [...account.orders, order],
    transactions: [...account.transactions, transaction],
    decisions,
  };

  const filled = applyChallengeStatus(recompute(draft, now));
  return ok(
    appendDecisionCheckpoint(
      filled,
      {
        kind: remainingQty === 0 ? 'exit' : 'management',
        symbol,
        thesis: input.thesis,
        evidence: input.evidence,
        confidence: input.confidence,
        invalidation: input.invalidation,
        positionSize: input.intendedPositionSize,
        risk: input.expectedRisk,
        expectedScenarios: input.expectedScenarios,
        managementChange: input.managementChange,
        exitReasoning: input.exitReasoning,
        decision: remainingQty === 0 ? 'exit' : 'reduce',
      },
      now,
    ),
  );
}

export function recordCloseReview(
  account: SimulationAccount,
  decisionId: string,
  review: SimulationCloseReview,
  now = new Date().toISOString(),
): SimulationAccount {
  return {
    ...account,
    updatedAt: now,
    decisions: account.decisions.map((decision) =>
      decision.id === decisionId ? { ...decision, closeReview: review, closedAt: decision.closedAt ?? now } : decision,
    ),
  };
}

export function resetSnapshot(account: SimulationAccount): SimulationResetSnapshot {
  return {
    startingBalance: account.startingBalance,
    equity: account.equity,
    totalReturn: account.totalReturn,
    tradeCount: account.transactions.length,
    maxDrawdown: account.maxDrawdown,
    currency: account.currency,
  };
}

export function archiveSimulationAccount(
  account: SimulationAccount,
  now = new Date().toISOString(),
): SimulationAccount {
  return {
    ...account,
    status: 'archived',
    resetAt: now,
    updatedAt: now,
  };
}

export function resetSimulationAccount(
  account: SimulationAccount,
  input?: {
    startingBalance?: number;
    mode?: SimulationMode;
    challengeId?: string;
    currency?: IsoCurrencyCode;
    now?: string;
    scenario?: SimulationAccount['scenario'];
  },
): { archived: SimulationAccount; next: SimulationAccount } {
  const now = input?.now ?? new Date().toISOString();
  const archived = archiveSimulationAccount(account, now);
  const next = createSimulationAccount({
    userId: account.userId,
    mode: input?.mode ?? account.mode,
    startingBalance: input?.startingBalance ?? account.startingBalance,
    currency: input?.currency ?? account.currency,
    challengeId: input?.challengeId ?? account.challengeId,
    now,
    scenario: input && 'scenario' in input ? input.scenario : undefined,
  });
  return { archived, next };
}

export function quantityForRisk(input: {
  equity: number;
  entry: number;
  stop: number;
  riskPercent: number;
}): number {
  const distance = Math.abs(input.entry - input.stop);
  if (!(input.equity > 0) || !(distance > 0) || !(input.riskPercent > 0)) return 0;
  return roundQty((input.equity * input.riskPercent) / distance);
}

export function riskAmount(equity: number, riskPercent: number): number {
  return roundMoney(Math.max(0, equity) * Math.max(0, riskPercent));
}

export function concentration(account: SimulationAccount): SimulationPosition | undefined {
  return [...account.positions].sort((a, b) => b.portfolioWeight - a.portfolioWeight)[0];
}

export function transactionsAreImmutable(
  before: readonly SimulationTransaction[],
  after: readonly SimulationTransaction[],
): boolean {
  return before.every((txn, index) => after[index] === txn || JSON.stringify(after[index]) === JSON.stringify(txn));
}

export type { SimulationSide };
