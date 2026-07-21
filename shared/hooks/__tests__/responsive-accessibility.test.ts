import { resolveResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import {
  getChartAccessibilityLabel,
  getMinTouchTargetSize,
  getPriceAccessibilityLabel,
} from '@/shared/utils/accessibility';

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
