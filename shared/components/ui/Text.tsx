import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/utils/cn';

type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'body-sm'
  | 'caption'
  | 'label'
  | 'mono'
  | 'price'
  | 'price-lg';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  className?: string;
}

const variantStyles: Record<TextVariant, string> = {
  h1: 'text-3xl font-bold tracking-tight text-text-primary',
  h2: 'text-2xl font-bold tracking-tight text-text-primary',
  h3: 'text-lg font-semibold tracking-tight text-text-primary',
  body: 'text-base leading-relaxed text-text-primary',
  'body-sm': 'text-sm leading-relaxed text-text-secondary',
  caption: 'text-xs leading-relaxed text-text-tertiary',
  label: 'text-sm font-semibold tracking-tight text-text-secondary',
  mono: 'font-mono text-sm tabular-nums text-text-primary',
  price: 'font-mono text-lg font-semibold tabular-nums text-text-primary',
  'price-lg': 'font-mono text-3xl font-bold tabular-nums tracking-tight text-text-primary',
};

export function Text({ variant = 'body', className, children, ...props }: TextProps) {
  return (
    <RNText className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </RNText>
  );
}
