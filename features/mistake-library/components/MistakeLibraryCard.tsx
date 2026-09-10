import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

import type { MistakeLibrarySnapshot, MistakePatternRecord } from '../types/mistake-library.types';

const TREND_COPY: Record<MistakePatternRecord['improvementTrend'], string> = {
  increasing: 'Showing up more often in recent sessions.',
  stable: 'Still appearing in recent process records.',
  improving: 'Less frequent recently. History is kept; the next check is in a new context.',
};

const PRIORITY_COPY: Record<MistakePatternRecord['recommendationPriority'], string> = {
  high: 'Training focus now',
  medium: 'Worth a focused session',
  low: 'Keep in view',
  watch: 'Verify in a new context',
};

function PatternBlock({ pattern }: { pattern: MistakePatternRecord }) {
  const router = useRouter();
  const primary = pattern.recommendedTraining[0];
  const rest = pattern.recommendedTraining.slice(1, 4);
  return (
    <View className="mt-4" testID={`mistake-pattern-${pattern.patternId}`}>
      <Text variant="label" className="text-accent">
        {PRIORITY_COPY[pattern.recommendationPriority]}
      </Text>
      <Text variant="h3" headingLevel={3} className="mt-1">
        {pattern.title}
      </Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {pattern.summary}
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        {pattern.count} recorded · {pattern.recentCount} recent · {TREND_COPY[pattern.improvementTrend]}
      </Text>
      {pattern.lastDemonstratedImprovement ? (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Last clearer process
          {pattern.lastDemonstratedImprovement.verifiedInNewContext ? ' in a new context' : ''} recorded.
        </Text>
      ) : null}
      {primary ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button size="sm" onPress={() => router.push(primary.href as never)}>
            {primary.label}
          </Button>
          {rest.map((link) => (
            <Button key={link.href} size="sm" variant="outline" onPress={() => router.push(link.href as never)}>
              {link.label}
            </Button>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function MistakeLibraryCard({
  library,
  testID = 'mistake-library-card',
}: {
  library: MistakeLibrarySnapshot;
  testID?: string;
}) {
  const visible = library.patterns.filter((row) => row.recommendationPriority !== 'watch' || row.count >= 2);
  if (!visible.length) {
    return (
      <Surface className="mt-4" testID={testID}>
        <Text variant="label" className="text-text-tertiary">
          Process patterns
        </Text>
        <Text variant="h3" headingLevel={3} className="mt-2">
          Recurring process notes will appear here
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Patterns come from structured decision fields — thesis, invalidation, size, evidence, and review — not from
          unrestricted interpretation of your notes.
        </Text>
      </Surface>
    );
  }

  return (
    <Surface tone="accent" emphasis="outlined" className="mt-4" testID={testID}>
      <Text variant="label" className="text-accent">
        Process patterns
      </Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        Recurring observations from your training records. Not a diagnosis, and not a live-trading grade.
      </Text>
      {visible.slice(0, 4).map((pattern) => (
        <PatternBlock key={pattern.patternId} pattern={pattern} />
      ))}
      <Text variant="caption" className="mt-4 text-text-tertiary">
        {library.disclaimer}
      </Text>
    </Surface>
  );
}
