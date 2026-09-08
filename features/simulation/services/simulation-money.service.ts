/** Integer minor units (cents) — all ledger math goes through here. */

export const MINOR_PER_MAJOR = 100;
export const QTY_TICKS = 10_000;

export function toMinor(major: number): number {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * MINOR_PER_MAJOR);
}

export function toMajor(minor: number): number {
  return minor / MINOR_PER_MAJOR;
}

export function toQtyTicks(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.round(quantity * QTY_TICKS);
}

export function fromQtyTicks(ticks: number): number {
  return ticks / QTY_TICKS;
}

/** Gross value in minor units: quantity × price. */
export function grossValueMinor(quantity: number, priceMajor: number): number {
  return Math.round((toQtyTicks(quantity) * toMinor(priceMajor)) / QTY_TICKS);
}

export function addMinor(...values: number[]): number {
  return values.reduce((sum, value) => sum + Math.round(value), 0);
}

export function weightedAveragePriceMajor(
  quantityA: number,
  priceA: number,
  quantityB: number,
  priceB: number,
): number {
  const ticks = toQtyTicks(quantityA) + toQtyTicks(quantityB);
  if (ticks <= 0) return 0;
  const cost = grossValueMinor(quantityA, priceA) + grossValueMinor(quantityB, priceB);
  return toMajor(Math.round((cost * QTY_TICKS) / ticks));
}

export function ratio(numerator: number, denominator: number): number {
  if (!(denominator > 0) || !Number.isFinite(numerator)) return 0;
  return toMajor(Math.round((numerator / denominator) * MINOR_PER_MAJOR * MINOR_PER_MAJOR)) / MINOR_PER_MAJOR;
}
