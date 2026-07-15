import type {
  PositionSizingInput,
  PositionSizingResult,
  RiskRewardInput,
  RiskRewardResult,
} from '../types/portfolio.types';

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
}

export function calculatePositionSize(input: PositionSizingInput): PositionSizingResult {
  const { accountBalance, riskPercent, entryPrice, stopLossPrice } = input;

  assertPositive(accountBalance, 'Account balance');
  assertPositive(riskPercent, 'Risk percent');
  assertPositive(entryPrice, 'Entry price');
  assertPositive(stopLossPrice, 'Stop loss price');

  if (riskPercent > 100) {
    throw new Error('Risk percent cannot exceed 100%.');
  }

  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  if (riskPerShare === 0) {
    throw new Error('Entry price and stop loss must differ.');
  }

  const riskAmount = accountBalance * (riskPercent / 100);
  const positionSize = Math.floor(riskAmount / riskPerShare);
  const positionValue = positionSize * entryPrice;
  const maxLoss = positionSize * riskPerShare;

  return {
    riskAmount,
    riskPerShare,
    positionSize,
    positionValue,
    maxLoss,
  };
}

export function calculateRiskReward(input: RiskRewardInput): RiskRewardResult {
  const { entryPrice, stopLossPrice, takeProfitPrice, positionSize } = input;

  assertPositive(entryPrice, 'Entry price');
  assertPositive(stopLossPrice, 'Stop loss price');
  assertPositive(takeProfitPrice, 'Take profit price');
  assertPositive(positionSize, 'Position size');

  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  const rewardPerShare = Math.abs(takeProfitPrice - entryPrice);

  if (riskPerShare === 0) {
    throw new Error('Entry price and stop loss must differ.');
  }

  const riskAmount = positionSize * riskPerShare;
  const rewardAmount = positionSize * rewardPerShare;
  const riskRewardRatio = rewardAmount / riskAmount;

  return {
    riskAmount,
    rewardAmount,
    riskRewardRatio,
    breakEvenPrice: entryPrice,
  };
}

export function calculateKellyFraction(
  winRate: number,
  avgWinLossRatio: number,
): number {
  if (winRate <= 0 || winRate >= 1 || avgWinLossRatio <= 0) {
    return 0;
  }

  const kelly = winRate - (1 - winRate) / avgWinLossRatio;
  return Math.max(0, Math.min(kelly, 1));
}
