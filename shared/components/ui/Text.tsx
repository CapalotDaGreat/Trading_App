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
  h1: 'text-3xl font-bold text-text-primary',
  h2: 'text-2xl font-bold text-text-primary',
  h3: 'text-xl font-semibold text-text-primary',
  body: 'text-base text-text-primary',
  'body-sm': 'text-sm text-text-secondary',
  caption: 'text-xs text-text-tertiary',
  label: 'text-sm font-medium text-text-secondary',
  mono: 'font-mono text-sm text-text-primary',
  price: 'font-mono text-lg font-semibold text-text-primary',
  'price-lg': 'font-mono text-2xl font-bold text-text-primary',
};

export function Text({ variant = 'body', className, children, ...props }: TextProps) {
  return (
    <RNText className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </RNText>
  );
}
