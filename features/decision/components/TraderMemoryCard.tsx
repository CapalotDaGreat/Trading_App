import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { TraderMemory } from '@/features/decision/types/decision.types';
import { buildTradingDna } from '@/features/decision/services/setup-enrichment.service';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatRelativeTime } from '@/shared/utils/date';

interface TraderMemoryCardProps {
  memory: TraderMemory;
}

const RISK_VARIANT: Record<TraderMemory['riskTolerance'], 'success' | 'warning' | 'danger'> = {
  conservative: 'success',
  moderate: 'warning',
  aggressive: 'danger',
};

export function TraderMemoryCard({ memory }: TraderMemoryCardProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);
  const dna = memory.dna ?? buildTradingDna(memory);

  return (
    <GlassCard className="p-4">
      <Pressable accessibilityRole="button" onPress={() => setOpen((v) => !v)}>
        <View className="mb-2 flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text variant="caption" className="mb-1 text-text-tertiary">
              Your trading DNA
            </Text>
            <Text variant="h3">{dna.styleLabel}</Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              Usually holds {memory.avgHoldHint.toLowerCase()} · {memory.riskTolerance} risk
            </Text>
          </View>
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.tertiary}
          />
        </View>

        {memory.favoriteAssets.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {memory.favoriteAssets.slice(0, 4).map((item) => (
              <Badge key={item} label={item} variant="accent" size="sm" />
            ))}
          </View>
        ) : null}
      </Pressable>

      {open ? (
        <View className="mt-3 gap-3 pt-3">
          <Badge
            label={memory.riskTolerance}
            variant={RISK_VARIANT[memory.riskTolerance]}
            size="sm"
          />

          <BulletSection title="Strengths" items={dna.strengths} tone="bullish" />
          <BulletSection title="Weaknesses" items={dna.weaknesses} tone="bearish" />
          <BulletSection title="Best conditions" items={dna.bestConditions} tone="default" />
          <BulletSection title="Avoid" items={dna.avoidConditions} tone="warning" />

          {dna.psychologyPatterns?.length ? (
            <BulletSection
              title="Psychology patterns"
              items={dna.psychologyPatterns}
              tone="warning"
            />
          ) : null}
          {dna.preferredIndicators?.length ? (
            <ChipSection title="Preferred indicators" items={dna.preferredIndicators} />
          ) : null}
          {dna.bestWeekdays?.length ? (
            <ChipSection title="Best weekdays (heuristic)" items={dna.bestWeekdays} variant="accent" />
          ) : null}

          {memory.favoriteIndicators.length > 0 ? (
            <ChipSection title="Indicators you prefer" items={memory.favoriteIndicators} />
          ) : null}
          {memory.bestSetups.length > 0 ? (
            <ChipSection title="Setups that fit you" items={memory.bestSetups} variant="success" />
          ) : null}

          <Text variant="caption" className="text-text-tertiary">
            Updated {formatRelativeTime(memory.updatedAt)}
          </Text>
        </View>
      ) : null}
    </GlassCard>
  );
}

function BulletSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'bullish' | 'bearish' | 'warning' | 'default';
}) {
  const prefix = tone === 'bullish' ? '✓' : tone === 'bearish' || tone === 'warning' ? '⚠' : '·';
  const color =
    tone === 'bullish'
      ? 'text-bullish'
      : tone === 'bearish'
        ? 'text-bearish'
        : tone === 'warning'
          ? 'text-warning'
          : 'text-text-secondary';

  return (
    <View>
      <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
        {title}
      </Text>
      {items.map((item) => (
        <Text key={item} variant="caption" className={`mb-0.5 leading-relaxed ${color}`}>
          {prefix} {item}
        </Text>
      ))}
    </View>
  );
}

function ChipSection({
  title,
  items,
  variant = 'default',
}: {
  title: string;
  items: string[];
  variant?: 'default' | 'accent' | 'success' | 'danger';
}) {
  return (
    <View>
      <Text variant="caption" className="mb-1.5 font-semibold text-text-secondary">
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
