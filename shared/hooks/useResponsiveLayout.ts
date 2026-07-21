import { useWindowDimensions } from 'react-native';

export type LayoutBreakpoint = 'compact' | 'medium' | 'expanded';

export interface ResponsiveLayout {
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
 */
export function resolveResponsiveLayout(width: number, height: number): ResponsiveLayout {
  const breakpoint: LayoutBreakpoint =
    width >= 900 ? 'expanded' : width >= 600 ? 'medium' : 'compact';
  const isTablet = breakpoint !== 'compact';
  const isLandscape = width > height;
  const columns: 1 | 2 = isTablet ? 2 : 1;
  const contentMaxWidth = breakpoint === 'expanded' ? 1100 : breakpoint === 'medium' ? 840 : width;
  const gutter = breakpoint === 'compact' ? 20 : 24;

  return {
    width,
    height,
    breakpoint,
    isTablet,
    isLandscape,
    columns,
    contentMaxWidth,
    gutter,
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return resolveResponsiveLayout(width, height);
}
