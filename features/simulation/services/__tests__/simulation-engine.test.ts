import {
  DEFAULT_STARTING_BALANCE,
  DISCIPLINE_CHALLENGE,
  DIVERSIFY_CHALLENGE,
  DRAWDOWN_CHALLENGE,
  RISK_CHALLENGE,
} from '../../constants/simulation.constants';
import {
  archiveSimulationAccount,
  createSimulationAccount,
  executeBuy,
  executeSell,
  markToMarket,
  previewBuy,
  quantityForRisk,
  recordCloseReview,
  resetSimulationAccount,
  resetSnapshot,
  riskAmount,
  transactionsAreImmutable,
} from '../simulation-engine.service';

const PROCESS = {
  thesis: 'Defined educational thesis for the test',
  invalidation: 'Invalid if the written level breaks',
} as const;

function buy(
  account: ReturnType<typeof createSimulationAccount>,
  input: Parameters<typeof executeBuy>[1],
) {
  return executeBuy(account, { ...PROCESS, ...input });
}

describe('simulation engine', () => {
  const now = '2026-09-08T10:00:00.000Z';

  it('creates an account with 100,000 starting cash in the default currency', () => {
    const account = createSimulationAccount({ userId: 'user-a', now });
    expect(account.id).toBe(account.accountId);
    expect(account.userId).toBe('user-a');
    expect(account.currency).toBe('USD');
    expect(account.startingBalance).toBe(DEFAULT_STARTING_BALANCE);
    expect(account.cashBalance).toBe(DEFAULT_STARTING_BALANCE);
    expect(account.equity).toBe(DEFAULT_STARTING_BALANCE);
    expect(account.buyingPower).toBe(DEFAULT_STARTING_BALANCE);
    expect(account.status).toBe('active');
    expect(account.positions).toEqual([]);
    expect(account.transactions).toEqual([]);
    expect(account.checkpoints).toEqual([]);
    expect(account.currentDrawdown).toBe(0);
    expect(account.maxDrawdown).toBe(0);
  });

  it('accepts a non-USD currency without changing ledger math', () => {
    const account = createSimulationAccount({ userId: 'user-a', currency: 'EUR', now });
    expect(account.currency).toBe('EUR');
    expect(account.startingBalance).toBe(DEFAULT_STARTING_BALANCE);
  });

  it('buys with auditable cash reduction and average entry', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const bought = buy(started, {
      symbol: 'NESN',
      quantity: 100,
      price: 90,
      now,
      thesis: 'Lesson: position sizing',
    });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.value.cashBalance).toBe(91_000);
    expect(bought.value.investedAmount).toBe(9_000);
    expect(bought.value.equity).toBe(100_000);
    expect(bought.value.positions[0]?.quantity).toBe(100);
    expect(bought.value.positions[0]?.averageEntryPrice).toBe(90);
    expect(bought.value.positions[0]?.assetType).toBe('equity');
    expect(bought.value.positions[0]?.marketValue).toBe(9_000);
    expect(bought.value.positions[0]?.portfolioWeight).toBeCloseTo(0.09);
    expect(bought.value.transactions).toHaveLength(1);
    expect(bought.value.orders).toHaveLength(1);
    expect(bought.value.orders[0]?.type).toBe('market');
    expect(bought.value.transactions[0]?.side).toBe('buy');
    expect(bought.value.transactions[0]?.executionPrice).toBe(90);
    expect(bought.value.transactions[0]?.grossValue).toBe(9_000);
    expect(bought.value.transactions[0]?.netValue).toBe(9_000);
    expect(bought.value.transactions[0]?.resultingCashBalance).toBe(91_000);
    expect(bought.value.transactions[0]?.resultingPositionQuantity).toBe(100);
    expect(bought.value.decisions[0]?.thesis).toBe('Lesson: position sizing');
    expect(bought.value.transactions[0]?.decisionId).toBe(bought.value.decisions[0]?.id);
    expect(bought.value.checkpoints).toHaveLength(1);
    expect(bought.value.checkpoints?.[0]?.kind).toBe('entry');
    expect(bought.value.checkpoints?.[0]?.snapshot.cashBalance).toBe(91_000);
    expect(bought.value.checkpoints?.[0]?.snapshot.equity).toBe(100_000);
  });

  it('averages entry across adds', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const first = buy(started, { symbol: 'AAPL', quantity: 10, price: 100, now });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = buy(first.value, { symbol: 'AAPL', quantity: 10, price: 120, now });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.positions[0]?.quantity).toBe(20);
    expect(second.value.positions[0]?.averageEntryPrice).toBe(110);
  });

  it('supports etf, crypto, and forex symbols', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const etf = buy(started, { symbol: 'SPY', quantity: 1, price: 510, now });
    const crypto = buy(etf.ok ? etf.value : started, { symbol: 'BTC', quantity: 0.1, price: 64_000, now });
    const fx = buy(crypto.ok ? crypto.value : started, { symbol: 'EURUSD', quantity: 10_000, price: 1.08, now });
    expect(etf.ok && crypto.ok && fx.ok).toBe(true);
    if (!fx.ok) return;
    expect(fx.value.positions.map((item) => item.assetType).sort()).toEqual(['crypto', 'etf', 'forex']);
  });

  it('rejects a buy when cash is insufficient', () => {
    const started = createSimulationAccount({ userId: 'user-a', now, startingBalance: 1_000 });
    const result = buy(started, { symbol: 'SPY', quantity: 10, price: 510, now });
    expect(result).toEqual({
      ok: false,
      code: 'insufficient_cash',
      message: 'Not enough simulated cash for this buy.',
    });
    expect(started.cashBalance).toBe(1_000);
    expect(started.transactions).toHaveLength(0);
  });

  it('rejects invalid quantity, price, symbol, and archived accounts', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const qty = executeBuy(started, { symbol: 'NESN', quantity: 0, price: 90, now });
    const price = executeBuy(started, { symbol: 'NESN', quantity: 1, price: 0, now });
    const symbol = executeBuy(started, { symbol: 'NOTALISTED', quantity: 1, price: 90, now });
    const archived = executeBuy(archiveSimulationAccount(started, now), { symbol: 'NESN', quantity: 1, price: 90, now });
    const invalid = executeBuy({ ...started, id: '', accountId: '' }, { symbol: 'NESN', quantity: 1, price: 90, now });
    expect(qty.ok).toBe(false);
    expect(!qty.ok && qty.code).toBe('invalid_quantity');
    expect(!price.ok && price.code).toBe('invalid_price');
    expect(!symbol.ok && symbol.code).toBe('invalid_symbol');
    expect(!archived.ok && archived.code).toBe('account_inactive');
    expect(!invalid.ok && invalid.code).toBe('invalid_account');
  });

  it('rejects a sell when quantity is insufficient', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const result = executeSell(started, { symbol: 'NESN', quantity: 1, price: 90, now });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('insufficient_quantity');
  });

  it('realizes P/L on a full close, including fees, and keeps history', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const bought = buy(started, { symbol: 'NESN', quantity: 10, price: 100, fees: 1, now });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const sold = executeSell(bought.value, { symbol: 'NESN', quantity: 10, price: 110, fees: 1, now });
    expect(sold.ok).toBe(true);
    if (!sold.ok) return;
    expect(sold.value.positions).toEqual([]);
    expect(sold.value.realizedPnL).toBe(99);
    expect(sold.value.cashBalance).toBe(DEFAULT_STARTING_BALANCE + 98);
    expect(sold.value.transactions.map((item) => item.side)).toEqual(['buy', 'sell']);
  });

  it('keeps average entry on a partial sell and allocates remaining weight', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const bought = buy(started, { symbol: 'NESN', quantity: 10, price: 100, now });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const sold = executeSell(bought.value, { symbol: 'NESN', quantity: 4, price: 110, now });
    expect(sold.ok).toBe(true);
    if (!sold.ok) return;
    expect(sold.value.positions[0]?.quantity).toBe(6);
    expect(sold.value.positions[0]?.averageEntryPrice).toBe(100);
    expect(sold.value.realizedPnL).toBe(40);
    expect(sold.value.positions[0]?.portfolioWeight).toBeGreaterThan(0);
  });

  it('marks unrealized P/L and equity from provider prices', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const bought = buy(started, { symbol: 'NESN', quantity: 10, price: 100, now });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const marked = markToMarket(bought.value, { NESN: 90 }, now);
    expect(marked.unrealizedPnL).toBe(-100);
    expect(marked.equity).toBe(DEFAULT_STARTING_BALANCE - 100);
    expect(marked.positions[0]?.unrealizedPnL).toBe(-100);
  });

  it('computes return and drawdown from peak equity', () => {
    const started = createSimulationAccount({ userId: 'user-a', now, startingBalance: 10_000 });
    const bought = buy(started, { symbol: 'NESN', quantity: 10, price: 100, now });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const up = markToMarket(bought.value, { NESN: 200 }, now);
    expect(up.peakEquity).toBe(11_000);
    expect(up.totalReturn).toBeCloseTo(0.1);
    const down = markToMarket(up, { NESN: 100 }, now);
    expect(down.equity).toBe(10_000);
    expect(down.currentDrawdown).toBeCloseTo((10_000 - 11_000) / 11_000);
    expect(down.maxDrawdown).toBe(down.currentDrawdown);
    expect(down.drawdown).toBeCloseTo(1_000 / 11_000);
  });

  it('previews a buy without mutating the account', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const snapshot = structuredClone(started);
    const preview = previewBuy(started, { symbol: 'NESN', quantity: 10, price: 100, now, ...PROCESS });
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.value.cashAfter).toBe(99_000);
    expect(preview.value.simulationWarning).toContain('SIMULATED TRADING');
    expect(started).toEqual(snapshot);
  });

  it('archives on reset instead of deleting history', () => {
    const alice = createSimulationAccount({ userId: 'alice', now });
    const bob = createSimulationAccount({ userId: 'bob', now });
    const aliceBought = buy(alice, { symbol: 'AAPL', quantity: 5, price: 100, now });
    expect(aliceBought.ok).toBe(true);
    if (!aliceBought.ok) return;
    expect(bob.cashBalance).toBe(DEFAULT_STARTING_BALANCE);
    expect(bob.userId).not.toBe(aliceBought.value.userId);

    const { archived, next } = resetSimulationAccount(aliceBought.value, {
      now: '2026-09-09T00:00:00.000Z',
    });
    expect(archived.status).toBe('archived');
    expect(archived.resetAt).toBe('2026-09-09T00:00:00.000Z');
    expect(archived.transactions).toHaveLength(1);
    expect(next.userId).toBe('alice');
    expect(next.cashBalance).toBe(DEFAULT_STARTING_BALANCE);
    expect(next.positions).toEqual([]);
    expect(next.transactions).toEqual([]);
    expect(resetSnapshot(archived).tradeCount).toBe(1);
  });

  it('does not rewrite historical transactions after a later fill', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const bought = buy(started, { symbol: 'NESN', quantity: 10, price: 100, now, thesis: 'First educational fill' });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const firstTxn = structuredClone(bought.value.transactions[0]);
    const sold = executeSell(bought.value, { symbol: 'NESN', quantity: 10, price: 110, now });
    expect(sold.ok).toBe(true);
    if (!sold.ok) return;
    expect(sold.value.transactions[0]).toEqual(firstTxn);
    expect(transactionsAreImmutable(bought.value.transactions, sold.value.transactions)).toBe(true);
  });

  it('sizes a position from 1% account risk', () => {
    expect(riskAmount(100_000, 0.01)).toBe(1_000);
    expect(quantityForRisk({ equity: 100_000, entry: 100, stop: 90, riskPercent: 0.01 })).toBe(100);
  });

  it('enforces the 1% risk challenge', () => {
    const account = createSimulationAccount({
      userId: 'user-a',
      mode: 'challenge',
      challengeId: RISK_CHALLENGE.id,
      now,
    });
    const tooMuchRisk = executeBuy(account, {
      symbol: 'NESN',
      quantity: 500,
      price: 100,
      stopPrice: 90,
      now,
    });
    expect(tooMuchRisk.ok).toBe(false);
    if (tooMuchRisk.ok) return;
    expect(tooMuchRisk.code).toBe('challenge_violation');

    const sized = buy(account, {
      symbol: 'NESN',
      quantity: 100,
      price: 100,
      stopPrice: 90,
      now,
    });
    expect(sized.ok).toBe(true);
  });

  it('enforces the 20% diversification challenge against post-trade equity', () => {
    const account = createSimulationAccount({
      userId: 'user-a',
      mode: 'challenge',
      challengeId: DIVERSIFY_CHALLENGE.id,
      now,
    });
    const tooConcentrated = executeBuy(account, { symbol: 'NESN', quantity: 250, price: 100, now });
    expect(tooConcentrated.ok).toBe(false);
    if (tooConcentrated.ok) return;
    expect(tooConcentrated.code).toBe('challenge_violation');

    const allowed = buy(account, { symbol: 'NESN', quantity: 200, price: 100, now });
    expect(allowed.ok).toBe(true);
  });

  it('fails the drawdown challenge when peak-to-trough reaches 5%', () => {
    const account = createSimulationAccount({
      userId: 'user-a',
      mode: 'challenge',
      challengeId: DRAWDOWN_CHALLENGE.id,
      now,
    });
    const bought = buy(account, { symbol: 'NESN', quantity: 1_000, price: 100, now });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const marked = markToMarket(bought.value, { NESN: 95 }, now);
    expect(marked.status).toBe('challenge_failed');
    expect(marked.lastChallengeViolation).toMatch(/5%/);
  });

  it('requires a thesis on the decision-discipline challenge', () => {
    const account = createSimulationAccount({
      userId: 'user-a',
      mode: 'challenge',
      challengeId: DISCIPLINE_CHALLENGE.id,
      now,
    });
    const missing = executeBuy(account, { symbol: 'NESN', quantity: 1, price: 90, now });
    expect(missing.ok).toBe(false);
    if (missing.ok) return;
    expect(missing.code).toBe('challenge_violation');

    const recorded = buy(account, {
      symbol: 'NESN',
      quantity: 1,
      price: 90,
      now,
      thesis: 'Breakout with defined invalidation under 88.',
    });
    expect(recorded.ok).toBe(true);
  });

  it('stores a close review on the original decision', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const bought = buy(started, { symbol: 'NESN', quantity: 1, price: 90, now, thesis: 'Defined setup' });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    const decisionId = bought.value.decisions[0]!.id;
    const sold = executeSell(bought.value, { symbol: 'NESN', quantity: 1, price: 92, now, decisionId });
    expect(sold.ok).toBe(true);
    if (!sold.ok) return;
    const reviewed = recordCloseReview(sold.value, decisionId, {
      whatHappened: 'Price reached the invalidation area.',
      thesisCorrect: 'Partially — the trigger was real, the hold was long.',
      wouldChange: 'Size smaller next time.',
    });
    expect(reviewed.decisions[0]?.closedAt).toBe(now);
    expect(reviewed.decisions[0]?.closeReview?.wouldChange).toContain('Size smaller');
  });

  it('does not mutate the original account object on a failed buy', () => {
    const started = createSimulationAccount({ userId: 'user-a', now, startingBalance: 500 });
    const snapshot = structuredClone(started);
    executeBuy(started, { symbol: 'SPY', quantity: 10, price: 510, now });
    expect(started).toEqual(snapshot);
  });

  it('does not allow cash to go negative', () => {
    const started = createSimulationAccount({ userId: 'user-a', now, startingBalance: 90 });
    const result = executeBuy(started, { symbol: 'NESN', quantity: 1, price: 90.01, now });
    expect(result.ok).toBe(false);
    expect(started.cashBalance).toBe(90);
  });

  it('converts a yen-quoted FX pair into a USD paper book', () => {
    const started = createSimulationAccount({ userId: 'user-a', now, currency: 'USD' });
    const bought = buy(started, {
      symbol: 'USDJPY',
      quantity: 1_000,
      price: 150,
      now,
      thesis: 'Lesson: quote currency is yen, ledger is dollars',
    });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.value.cashBalance).toBe(99_000);
    expect(bought.value.positions[0]?.averageEntryPrice).toBe(1);
    expect(bought.value.positions[0]?.assetType).toBe('forex');
  });

  it('converts EUR/USD notionals into a euro paper book', () => {
    const started = createSimulationAccount({ userId: 'user-a', now, currency: 'EUR' });
    const bought = buy(started, {
      symbol: 'EURUSD',
      quantity: 1_000,
      price: 1.08,
      now,
    });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.value.cashBalance).toBe(99_000);
    expect(bought.value.positions[0]?.averageEntryPrice).toBe(1);
  });

  it('requires thesis and invalidation and rejects a generic simulated entry', () => {
    const started = createSimulationAccount({ userId: 'user-a', now });
    const snapshot = structuredClone(started);
    const generic = executeBuy(started, {
      symbol: 'NESN',
      quantity: 1,
      price: 90,
      now,
      thesis: 'Simulated entry',
      invalidation: 'Invalid if the written level breaks',
    });
    expect(generic.ok).toBe(false);
    if (!generic.ok) expect(generic.code).toBe('process_required');
    expect(started).toEqual(snapshot);

    const noInvalidation = executeBuy(started, {
      symbol: 'NESN',
      quantity: 1,
      price: 90,
      now,
      thesis: 'Defined educational thesis for the test',
    });
    expect(noInvalidation.ok).toBe(false);
    if (!noInvalidation.ok) expect(noInvalidation.code).toBe('process_required');
    expect(started.transactions).toHaveLength(0);
  });
});
