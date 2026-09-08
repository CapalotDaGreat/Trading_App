import { useWindowDimensions } from 'react-native';

export type LayoutBreakpoint = 'compact' | 'medium' | 'expanded';

export interface DynamicTypeLayout {
  fontScale: number;
  large: boolean;
  extraLarge: boolean;
  accessibilitySize: boolean;
  /** Horizontal CTA rows should wrap or stack instead of shrinking type. */
  stackHorizontalActions: boolean;
}

export interface ResponsiveLayout extends DynamicTypeLayout {
  width: number;
  height: number;
  breakpoint: LayoutBreakpoint;
  isTablet: boolean;
  isLandscape: boolean;
  columns: 1 | 2;
  contentMaxWidth: number;
  gutter: number;
}

/**
 * compact < 600, medium 600–899, expanded ≥ 900 (approx. Material / Adaptive breakpoints).
 * Layout flags for Dynamic Type: do not shrink essential text to fit;
 * callers should wrap, stack, and let cards grow vertically.
 */
export function resolveDynamicTypeLayout(
  fontScale: number,
  width: number,
): DynamicTypeLayout {
  const large = fontScale >= 1.3;
  const extraLarge = fontScale >= 1.6;
  const accessibilitySize = fontScale >= 1.9;
  return {
    fontScale,
    large,
    extraLarge,
    accessibilitySize,
    stackHorizontalActions: large || width < 360,
  };
}

export function resolveResponsiveLayout(
  width: number,
  height: number,
  fontScale = 1,
): ResponsiveLayout {
  const breakpoint: LayoutBreakpoint =
    width >= 900 ? 'expanded' : width >= 600 ? 'medium' : 'compact';
  const isTablet = breakpoint !== 'compact';
  const isLandscape = width > height;
  const columns: 1 | 2 = isTablet ? 2 : 1;
  const contentMaxWidth = breakpoint === 'expanded' ? 1100 : breakpoint === 'medium' ? 840 : width;
  const gutter = breakpoint === 'compact' ? 24 : 28;

  return {
    width,
    height,
    breakpoint,
    isTablet,
    isLandscape,
    columns,
    contentMaxWidth,
    gutter,
    ...resolveDynamicTypeLayout(fontScale, width),
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height, fontScale } = useWindowDimensions();
  return resolveResponsiveLayout(width, height, fontScale);
}
