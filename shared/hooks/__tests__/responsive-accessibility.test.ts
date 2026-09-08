import {
  composeChartSpokenSummary,
  getChartAccessibilityLabel,
  getMinTouchTargetSize,
  getPriceAccessibilityLabel,
  spokenIntervalLabel,
} from '@/shared/utils/accessibility';
import {
  resolveDynamicTypeLayout,
  resolveResponsiveLayout,
} from '@/shared/hooks/useResponsiveLayout';

describe('resolveResponsiveLayout', () => {
  it('classifies compact phone widths as one column', () => {
    const layout = resolveResponsiveLayout(390, 844);
    expect(layout.breakpoint).toBe('compact');
    expect(layout.columns).toBe(1);
    expect(layout.isTablet).toBe(false);
  });

  it('classifies tablet widths as two columns', () => {
    const layout = resolveResponsiveLayout(820, 1180);
    expect(layout.breakpoint).toBe('medium');
    expect(layout.columns).toBe(2);
    expect(layout.isTablet).toBe(true);
  });

  it('detects landscape when width exceeds height', () => {
    const layout = resolveResponsiveLayout(1180, 820);
    expect(layout.isLandscape).toBe(true);
    expect(layout.breakpoint).toBe('expanded');
  });
});

describe('accessibility helpers', () => {
  it('builds price labels with direction', () => {
    expect(getPriceAccessibilityLabel('AAPL', 190.25, 1.5)).toContain('up');
    expect(getPriceAccessibilityLabel('AAPL', 190.25, -1.5)).toContain('down');
  });

  it('summarizes charts for screen readers', () => {
    const label = getChartAccessibilityLabel('SPY', [
      { open: 100, high: 101, low: 99, close: 100 },
      { open: 100, high: 105, low: 100, close: 104 },
    ]);
    expect(label).toContain('SPY chart');
    expect(label).toContain('2 candles');
    expect(label).toContain('up');
  });

  it('uses platform minimum touch targets of at least 44', () => {
    expect(getMinTouchTargetSize()).toBeGreaterThanOrEqual(44);
  });
});

describe('resolveDynamicTypeLayout', () => {
  it('keeps one-row actions at default type on a standard phone', () => {
    const layout = resolveDynamicTypeLayout(1, 390);
    expect(layout.large).toBe(false);
    expect(layout.stackHorizontalActions).toBe(false);
  });

  it('stacks horizontal actions at large type instead of shrinking text', () => {
    expect(resolveDynamicTypeLayout(1.3, 390).stackHorizontalActions).toBe(true);
    expect(resolveDynamicTypeLayout(1.6, 390).extraLarge).toBe(true);
    expect(resolveDynamicTypeLayout(2, 390).accessibilitySize).toBe(true);
  });

  it('stacks actions on very small widths even at default type', () => {
    expect(resolveDynamicTypeLayout(1, 320).stackHorizontalActions).toBe(true);
  });

  it('carries Dynamic Type flags on the responsive layout', () => {
    const layout = resolveResponsiveLayout(390, 844, 1.6);
    expect(layout.extraLarge).toBe(true);
    expect(layout.stackHorizontalActions).toBe(true);
    expect(layout.columns).toBe(1);
  });
});

describe('composeChartSpokenSummary', () => {
  it('omits SMA and volatility when there are too few candles', () => {
    const summary = composeChartSpokenSummary({
      symbol: 'EUR/USD',
      intervalLabel: spokenIntervalLabel('4h'),
      dataKind: 'delayed',
      candles: [
        { open: 1.08, high: 1.09, low: 1.07, close: 1.085 },
        { open: 1.085, high: 1.09, low: 1.08, close: 1.088 },
      ],
    });
    expect(summary).toContain('EUR/USD, 4-hour chart');
    expect(summary).toContain('Data is delayed');
    expect(summary).not.toContain('50-period');
    expect(summary).not.toContain('Volatility');
  });

  it('includes SMA only when 50 candles exist, without inventing an interval', () => {
    const candles = Array.from({ length: 50 }, (_, i) => ({
      open: 100 + i * 0.1,
      high: 101 + i * 0.1,
      low: 99 + i * 0.1,
      close: 100.2 + i * 0.1,
    }));
    const summary = composeChartSpokenSummary({ symbol: 'EUR/USD', candles });
    expect(summary).toContain('Price is above the 50-period average');
    expect(summary).not.toContain('4-hour');
  });

  it('never invents a data kind or freeze note', () => {
    const summary = composeChartSpokenSummary({
      symbol: 'AAPL',
      candles: [{ open: 10, high: 11, low: 9, close: 10.5 }],
    });
    expect(summary).not.toContain('live');
    expect(summary).not.toContain('delayed');
    expect(summary).not.toContain('Future path hidden');
  });
});
