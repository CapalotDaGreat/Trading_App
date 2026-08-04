import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export interface ScreenQuestionProps extends ViewProps {
  /** The one primary question this screen answers. */
  question: string;
  /** Optional calm support line — keep under ~120 chars. */
  support?: string;
  /** Eyebrow / context label (e.g. “Today”). */
  eyebrow?: string;
  trailing?: ReactNode;
  className?: string;
}

/**
 * Phase A hierarchy primitive: every screen leads with one question.
 * Prefer this over dense headers + metric strips.
 */
export function ScreenQuestion({
  question,
  support,
  eyebrow,
  trailing,
  className,
  ...props
}: ScreenQuestionProps) {
  return (
    <View
      accessibilityRole="header"
      className={cn('mb-7', className)}
      {...props}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {eyebrow ? (
            <Text variant="caption" className="mb-2 font-medium tracking-wide text-text-tertiary">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="h1" className="text-[28px] leading-9 tracking-tight">
            {question}
          </Text>
          {support ? (
            <Text variant="body-sm" className="mt-2.5 max-w-md leading-6 text-text-secondary">
              {support}
            </Text>
          ) : null}
        </View>
        {trailing ? <View className="pt-1">{trailing}</View> : null}
      </View>
    </View>
  );
}
