import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/utils/cn';

export type TextVariant =
  'h1' | 'h2' | 'h3' | 'body' | 'body-sm' | 'caption' | 'label' | 'mono' | 'price' | 'price-lg';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Opt-in semantic heading level. Visual h1/h2/h3 variants do not imply document structure. */
  headingLevel?: HeadingLevel;
  className?: string;
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'text-3xl font-semibold tracking-tight text-text-primary',
  h2: 'text-2xl font-semibold tracking-tight text-text-primary',
  h3: 'text-lg font-semibold tracking-tight text-text-primary',
  body: 'text-base leading-relaxed text-text-primary',
  'body-sm': 'text-sm leading-6 text-text-secondary',
  caption: 'text-xs leading-5 text-text-tertiary',
  label: 'text-sm font-medium tracking-tight text-text-secondary',
  mono: 'font-mono text-sm tabular-nums text-text-primary',
  price: 'font-mono text-lg font-semibold tabular-nums text-text-primary',
  'price-lg': 'font-mono text-3xl font-semibold tabular-nums tracking-tight text-text-primary',
};

const headingVariants = new Set<TextVariant>(['h1', 'h2', 'h3']);

export function Text({
  variant = 'body',
  headingLevel,
  className,
  children,
  allowFontScaling = true,
  maxFontSizeMultiplier,
  accessibilityRole,
  ...props
}: TextProps) {
  const isHeadingStyle = headingVariants.has(variant);

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (isHeadingStyle ? 1.6 : 2)}
      accessibilityRole={accessibilityRole ?? (headingLevel ? 'header' : undefined)}
      aria-level={headingLevel}
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </RNText>
  );
}
