export function calculateSma(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const result: number[] = [];
  let sum = 0;

  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result.push(sum / period);
    }
  }

  return result;
}

export function calculateSmaSeries(
  values: number[],
  timestamps: number[],
  period: number,
): { timestamp: number; value: number }[] {
  const sma = calculateSma(values, period);
  const offset = period - 1;
  return sma.map((value, i) => ({
    timestamp: timestamps[i + offset],
    value,
  }));
}
