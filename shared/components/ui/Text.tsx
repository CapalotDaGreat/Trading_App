import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/utils/cn';

type TextVariant =
  'h1' | 'h2' | 'h3' | 'body' | 'body-sm' | 'caption' | 'label' | 'mono' | 'price' | 'price-lg';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
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
  className,
  children,
  allowFontScaling = true,
  maxFontSizeMultiplier,
  accessibilityRole,
  ...props
}: TextProps) {
  const isHeading = headingVariants.has(variant);

  return (
    <RNText
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (isHeading ? 1.6 : 2)}
      accessibilityRole={accessibilityRole ?? (isHeading ? 'header' : undefined)}
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </RNText>
  );
}
