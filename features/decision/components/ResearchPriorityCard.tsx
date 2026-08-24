import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ResearchQueueItem } from '@/features/decision/types/decision.types';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION, TRUST_LANGUAGE } from '@/shared/constants/trust-language';

interface ResearchPriorityCardProps {
  item: ResearchQueueItem;
  rank: number;
}

export function ResearchPriorityCard({ item, rank }: ResearchPriorityCardProps) {
  const router = useRouter();
  const symbol = item.symbol.toUpperCase();
  const why = item.rankReason?.trim() || CALM_ATTENTION.interestingLowerPriority;
  const rvsLabel =
    item.researchValueScore != null
      ? `${TRUST_LANGUAGE.rvs.short} ${item.researchValueScore}`
      : null;

  return (
    <Surface padding="md" testID={`today-focus-secondary-${symbol}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${symbol}, ${CALM_ATTENTION.lowPriority}${rvsLabel ? `, ${rvsLabel}. ${TRUST_LANGUAGE.rvs.meaning}` : ''}`}
        accessibilityHint="Opens the asset research workspace"
        onPress={() => router.push(`/asset/${encodeURIComponent(symbol)}` as never)}
        className="min-h-11"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="caption" className="mb-1 font-medium text-text-tertiary">
              {rank}. {CALM_ATTENTION.lowPriority}
            </Text>
            <Text variant="h3" headingLevel={3}>
              {symbol}
            </Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              {[
                item.estimatedMinutes ? `${item.estimatedMinutes} min estimated research` : null,
                rvsLabel,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
        <Text variant="body-sm" className="mt-2 leading-6 text-text-secondary" numberOfLines={3}>
          {why}
        </Text>
      </Pressable>
    </Surface>
  );
}
