import type { DailyRiskConfig, ExecutionAccount, RiskGateResult } from '../types/intraday.types';

import { netSessionPnl, roundMoney } from './execution.service';

/**
 * Intraday risk controls for simulated sessions.
 *
 * Rules are explicit and testable. When the daily loss limit is reached, new
 * risk-increasing orders are blocked; reducing or closing a position is always
 * allowed, and nothing is silently closed at a fictional price.
 * These simulated limits do not protect a real brokerage account.
 */

export function riskBudgetPerTrade(config: DailyRiskConfig): number {
  return roundMoney(config.equity * config.maxRiskPercentPerTrade);
}

/**
 * Educational position sizing: size comes from the risk budget and the
 * distance to invalidation — never from conviction.
 * Example values only; no percentage is suitable for every person.
 */
export function sizeFromRiskBudget(input: {
  equity: number;
  riskPercent: number;
  entryPrice: number;
  invalidationPrice: number;
}): { quantity: number; riskBudget: number; riskPerUnit: number; reason?: string } {
  const riskBudget = riskBudgetPerTrade({
    equity: input.equity,
    maxRiskPercentPerTrade: input.riskPercent,
    maxDailyLoss: Number.POSITIVE_INFINITY,
  });
  const riskPerUnit = Math.abs(input.entryPrice - input.invalidationPrice);
  if (!(riskPerUnit > 0)) {
    return {
      quantity: 0,
      riskBudget,
      riskPerUnit,
      reason: 'Entry and invalidation are identical — no defined risk distance.',
    };
  }
  if (!(input.equity > 0) || !(input.riskPercent > 0)) {
    return {
      quantity: 0,
      riskBudget,
      riskPerUnit,
      reason: 'Equity and risk budget must be positive.',
    };
  }
  return { quantity: Math.floor(riskBudget / riskPerUnit), riskBudget, riskPerUnit };
}

export function evaluateRiskGate(input: {
  account: ExecutionAccount;
  config: DailyRiskConfig;
  markPrice?: number;
}): RiskGateResult {
  const sessionPnl = netSessionPnl(input.account, input.markPrice);
  const reasons: string[] = [];

  const hitDailyLoss = sessionPnl <= -Math.abs(input.config.maxDailyLoss);
  if (hitDailyLoss) {
    reasons.push(
      `Daily loss limit reached (simulated P/L ${sessionPnl.toFixed(2)}). New risk is blocked; you may still reduce or close positions and finish the review.`,
    );
  }
  if (input.config.maxTrades != null && input.account.tradesPlaced >= input.config.maxTrades) {
    reasons.push(
      `Maximum trades for this session reached (${input.config.maxTrades}). Observation is still practice.`,
    );
  }
  if (
    input.config.maxConsecutiveLosses != null &&
    input.account.consecutiveLosses >= input.config.maxConsecutiveLosses
  ) {
    reasons.push(
      `${input.config.maxConsecutiveLosses} consecutive losing simulated trades. The plan says stop and review, not trade faster.`,
    );
  }

  return {
    circuitBreakerActive: hitDailyLoss,
    canOpenRisk: reasons.length === 0,
    canReduceRisk: true,
    reasons,
    sessionPnl,
    riskBudgetPerTrade: riskBudgetPerTrade(input.config),
  };
}

/** A closing/reducing order never increases risk, so the breaker never blocks it. */
export function isRiskIncreasing(
  account: ExecutionAccount,
  side: 'buy' | 'sell',
  quantity: number,
): boolean {
  if (account.positionQty === 0) return true;
  const signed = side === 'buy' ? quantity : -quantity;
  return (
    Math.sign(signed) === Math.sign(account.positionQty) ||
    Math.abs(signed) > Math.abs(account.positionQty)
  );
}
