import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { Surface } from '@/shared/components/ui/Surface';
import { Text, type HeadingLevel } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface AccessibleChartFrameProps extends ViewProps {
  title: string;
  timeRange: string;
  source: string;
  freshness: string;
  summary: string;
  textualAlternative: ReactNode;
  children: ReactNode;
  headingLevel?: HeadingLevel;
}

/**
 * Gives visual charts one concise spoken image and a visible textual alternative.
 * Decorative SVG descendants are hidden to prevent noisy, duplicated announcements.
 */
export function AccessibleChartFrame({
  title,
  timeRange,
  source,
  freshness,
  summary,
  textualAlternative,
  children,
  headingLevel = 2,
  className,
  ...props
}: AccessibleChartFrameProps) {
  const chartLabel = `${title}. ${timeRange}. Source: ${source}. Freshness: ${freshness}. ${summary}`;

  return (
    <View className={cn('gap-3', className)} {...props}>
      <View>
        <Text variant="h3" headingLevel={headingLevel}>
          {title}
        </Text>
        <Text variant="caption" className="mt-1">
          {timeRange} · {source} · {freshness}
        </Text>
      </View>

      <View accessible accessibilityRole="image" accessibilityLabel={chartLabel}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {children}
        </View>
      </View>

      <Surface level="base" tone="subtle" padding="sm">
        <Text variant="label" headingLevel={Math.min(headingLevel + 1, 6) as HeadingLevel}>
          Chart details
        </Text>
        {typeof textualAlternative === 'string' ? (
          <Text variant="body-sm" className="mt-1">
            {textualAlternative}
          </Text>
        ) : (
          <View className="mt-1">{textualAlternative}</View>
        )}
      </Surface>
    </View>
  );
}
