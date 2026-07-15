export function calculateEma(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const multiplier = 2 / (period + 1);
  const result: number[] = [];

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  result.push(sum / period);

  for (let i = period; i < values.length; i++) {
    const ema = (values[i] - result[result.length - 1]) * multiplier + result[result.length - 1];
    result.push(ema);
  }

  return result;
}

export function calculateEmaSeries(
  values: number[],
  timestamps: number[],
  period: number,
): { timestamp: number; value: number }[] {
  const ema = calculateEma(values, period);
  const offset = period - 1;
  return ema.map((value, i) => ({
    timestamp: timestamps[i + offset],
    value,
  }));
}
