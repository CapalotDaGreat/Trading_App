import { AccessibilityInfo, Platform } from 'react-native';

export function getAccessibilityProps(
  label: string,
  options?: {
    hint?: string;
    role?: 'button' | 'link' | 'header' | 'text' | 'image' | 'search' | 'tab' | 'switch';
    state?: { disabled?: boolean; selected?: boolean; checked?: boolean | 'mixed' };
    value?: { min?: number; max?: number; now?: number; text?: string };
  },
) {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: options?.hint,
    accessibilityRole: options?.role,
    accessibilityState: options?.state,
    accessibilityValue: options?.value,
  };
}

export function getPriceAccessibilityLabel(
  symbol: string,
  price: number,
  changePercent: number,
): string {
  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'unchanged';
  return `${symbol}, price ${price.toFixed(2)}, ${direction} ${Math.abs(changePercent).toFixed(2)} percent`;
}

export function getButtonAccessibilityLabel(label: string, disabled = false): string {
  return disabled ? `${label}, disabled` : label;
}

export function announceForAccessibility(message: string): void {
  if (Platform.OS === 'web') return;
  AccessibilityInfo.announceForAccessibility(message);
}

/** Respect Android's "Time to take action" preference for transient UI. */
export async function getRecommendedAccessibilityTimeout(originalTimeout: number): Promise<number> {
  if (Platform.OS !== 'android') return originalTimeout;
  try {
    return await AccessibilityInfo.getRecommendedTimeoutMillis(originalTimeout);
  } catch {
    return originalTimeout;
  }
}

export function reduceMotionEnabled(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

export function screenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

export function getMinTouchTargetSize(): number {
  return Platform.select({ ios: 44, android: 48, default: 44 }) ?? 44;
}

export function formatForScreenReader(text: string): string {
  return text
    .replace(/\$/g, ' dollars ')
    .replace(/%/g, ' percent ')
    .replace(/\//g, ' slash ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const INTERVAL_SPOKEN_LABEL: Record<string, string> = {
  '1m': '1-minute',
  '5m': '5-minute',
  '15m': '15-minute',
  '30m': '30-minute',
  '1h': '1-hour',
  '4h': '4-hour',
  '1d': 'daily',
  '1w': 'weekly',
  '1M': 'monthly',
};

const DATA_KIND_SPOKEN: Record<string, string> = {
  live: 'Data is live',
  delayed: 'Data is delayed',
  approximate: 'Data is approximate',
  sample: 'Educational sample data',
  mock: 'Demo data, not live',
};

export function spokenIntervalLabel(interval?: string | null): string | undefined {
  if (!interval) return undefined;
  return INTERVAL_SPOKEN_LABEL[interval] ?? interval;
}

export function spokenDataKind(dataKind?: string | null): string | undefined {
  if (!dataKind) return undefined;
  return DATA_KIND_SPOKEN[dataKind];
}

export interface ChartSpokenSummaryInput {
  symbol: string;
  candles: { open: number; high: number; low: number; close: number }[];
  intervalLabel?: string;
  dataKind?: string;
  /** Extra honesty clause such as "Future path hidden". Never invent prices. */
  extraNote?: string;
}

function meanRange(candles: { high: number; low: number }[]): number {
  if (!candles.length) return 0;
  return candles.reduce((sum, candle) => sum + (candle.high - candle.low), 0) / candles.length;
}

function smaClose(candles: { close: number }[], period: number): number | null {
  if (candles.length < period) return null;
  const window = candles.slice(-period);
  return window.reduce((sum, candle) => sum + candle.close, 0) / period;
}

function volatilityClause(
  candles: { high: number; low: number }[],
): 'Volatility is elevated' | 'Volatility is muted' | null {
  if (candles.length < 8) return null;
  const overall = meanRange(candles);
  if (overall <= 0) return null;
  const recent = meanRange(candles.slice(-3));
  if (recent > overall * 1.35) return 'Volatility is elevated';
  if (recent < overall * 0.65) return 'Volatility is muted';
  return null;
}

/**
 * Concise chart summary for screen readers. Omits SMA / volatility / freshness
 * when those facts cannot be derived from the supplied candles or metadata.
 * Never invents prices, intervals, or data kinds.
 */
export function composeChartSpokenSummary(input: ChartSpokenSummaryInput): string {
  const interval = input.intervalLabel?.trim();
  const head = interval ? `${input.symbol}, ${interval} chart` : `${input.symbol} chart`;
  if (!input.candles.length) {
    return [head, 'no data', spokenDataKind(input.dataKind), input.extraNote]
      .filter(Boolean)
      .join('. ');
  }

  const first = input.candles[0]!;
  const last = input.candles[input.candles.length - 1]!;
  const changePercent = first.open === 0 ? 0 : ((last.close - first.open) / first.open) * 100;
  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'unchanged';
  const parts = [
    head,
    `${input.candles.length} candles`,
    `last close ${last.close.toFixed(2)}`,
    `${direction} ${Math.abs(changePercent).toFixed(2)} percent from first open`,
  ];

  const average = smaClose(input.candles, 50);
  if (average != null) {
    if (last.close > average) parts.push('Price is above the 50-period average');
    else if (last.close < average) parts.push('Price is below the 50-period average');
    else parts.push('Price is at the 50-period average');
  }

  const volatility = volatilityClause(input.candles);
  if (volatility) parts.push(volatility);

  const kind = spokenDataKind(input.dataKind);
  if (kind) parts.push(kind);
  if (input.extraNote) parts.push(input.extraNote);

  return parts.join('. ');
}

export function getChartAccessibilityLabel(
  symbol: string,
  candles: { open: number; high: number; low: number; close: number }[],
  context?: Omit<ChartSpokenSummaryInput, 'symbol' | 'candles'>,
): string {
  return composeChartSpokenSummary({ symbol, candles, ...context });
}

export function getMinTouchTargetStyle(): { minWidth: number; minHeight: number } {
  const size = getMinTouchTargetSize();
  return { minWidth: size, minHeight: size };
}
