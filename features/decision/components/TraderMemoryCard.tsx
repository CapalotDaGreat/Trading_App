import { View } from 'react-native';

import type { TraderMemory } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

interface TraderMemoryCardProps {
  memory: TraderMemory;
}

const RISK_VARIANT: Record<
  TraderMemory['riskTolerance'],
  'success' | 'warning' | 'danger'
> = {
  conservative: 'success',
  moderate: 'warning',
  aggressive: 'danger',
};

export function TraderMemoryCard({ memory }: TraderMemoryCardProps) {
  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="label" className="mb-1">
            Trader memory
          </Text>
          <Text variant="h3">{memory.tradingStyle}</Text>
          <Text variant="caption" className="mt-1">
            Typical hold · {memory.avgHoldHint}
          </Text>
        </View>
        <Badge
          label={memory.riskTolerance}
          variant={RISK_VARIANT[memory.riskTolerance]}
          size="sm"
        />
      </View>

      {memory.favoriteAssets.length > 0 ? (
        <ChipSection title="Favorites" items={memory.favoriteAssets} variant="accent" />
      ) : null}

      {memory.favoriteIndicators.length > 0 ? (
        <ChipSection title="Indicators" items={memory.favoriteIndicators} variant="default" />
      ) : null}

      {memory.bestSetups.length > 0 ? (
        <ChipSection title="Best setups" items={memory.bestSetups} variant="success" />
      ) : null}

      {memory.weakestSetups.length > 0 ? (
        <ChipSection title="Weak setups" items={memory.weakestSetups} variant="danger" />
      ) : null}

      {memory.typicalMistakes.length > 0 ? (
        <View className="mb-3">
          <Text variant="caption" className="mb-1.5 font-semibold uppercase tracking-wide">
            Mistakes to watch
          </Text>
          {memory.typicalMistakes.map((mistake) => (
            <Text key={mistake} variant="caption" className="mb-1 leading-relaxed text-bearish">
              − {mistake}
            </Text>
          ))}
        </View>
      ) : null}

      {memory.notes.length > 0 ? (
        <View className="mb-2">
          <Text variant="caption" className="mb-1.5 font-semibold uppercase tracking-wide">
            Notes
          </Text>
          {memory.notes.map((note) => (
            <Text key={note} variant="body-sm" className="mb-1 leading-relaxed text-text-secondary">
              {note}
            </Text>
          ))}
        </View>
      ) : null}

      <Text variant="caption" className="text-text-tertiary">
        Updated {formatRelativeTime(memory.updatedAt)}
      </Text>
    </GlassCard>
  );
}

function ChipSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: 'default' | 'accent' | 'success' | 'danger' | 'warning' | 'outline';
}) {
  return (
    <View className="mb-3">
      <Text variant="caption" className="mb-1.5 font-semibold uppercase tracking-wide">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} label={item} variant={variant} size="sm" />
        ))}
      </View>
    </View>
  );
}
