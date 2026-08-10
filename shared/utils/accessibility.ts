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

export function getChartAccessibilityLabel(
  symbol: string,
  candles: { open: number; high: number; low: number; close: number }[],
): string {
  if (!candles.length) return `${symbol} chart, no data`;
  const first = candles[0]!;
  const last = candles[candles.length - 1]!;
  const changePercent = first.open === 0 ? 0 : ((last.close - first.open) / first.open) * 100;
  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'unchanged';
  return `${symbol} chart, ${candles.length} candles, last close ${last.close.toFixed(2)}, ${direction} ${Math.abs(changePercent).toFixed(2)} percent from first open`;
}

export function getMinTouchTargetStyle(): { minWidth: number; minHeight: number } {
  const size = getMinTouchTargetSize();
  return { minWidth: size, minHeight: size };
}
