import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import type { JournalCoachInsight } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface JournalCoachCardProps {
  insight: JournalCoachInsight;
}

function processTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 70) return 'success';
  if (score >= 45) return 'warning';
  return 'danger';
}

function processBarClass(score: number): string {
  if (score >= 70) return 'bg-bullish';
  if (score >= 45) return 'bg-warning';
  return 'bg-bearish';
}

export function JournalCoachCard({ insight }: JournalCoachCardProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const processScore = Math.max(0, Math.min(100, Math.round(insight.processScore)));

  return (
    <GlassCard className="p-4">
      <View className="mb-2 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="caption" className="mb-1 text-text-tertiary">
            From your journal
          </Text>
          <Text variant="h3">What to do next</Text>
        </View>
        <Badge
          label={`${processScore}/100`}
          variant={processTone(processScore)}
          size="sm"
        />
      </View>

      <Text variant="body-sm" className="mb-3 leading-relaxed text-text-primary">
        {insight.recommendation}
      </Text>

      <View className="mb-3 h-2 overflow-hidden rounded-full bg-surface-active">
        <View
          className={cn('h-full rounded-full', processBarClass(processScore))}
          style={{ width: `${processScore}%` }}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between pt-3"
      >
        <Text variant="caption" className="font-semibold text-text-secondary">
          {open ? 'Hide coach stats' : 'Show coach stats'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </Pressable>

      {open ? (
        <View className="mt-3 gap-3">
          <View className="flex-row gap-3">
            <StatBlock
              label="Win rate"
              value={formatPercent(insight.winRate, { showSign: false })}
            />
            <StatBlock label="Avg R:R" value={insight.avgRr.toFixed(1)} />
          </View>

          <InsightRow label="Watch out for" value={insight.mostCommonMistake} tone="bearish" />
          <InsightRow label="Your edge" value={insight.edge} tone="bullish" />
          <InsightRow label="Usually skip" value={insight.avoid} tone="warning" />

          <View className="flex-row flex-wrap gap-1.5">
            <Badge label={`Best day · ${insight.bestWeekday}`} variant="success" size="sm" />
            <Badge label={`Weak · ${insight.worstCondition}`} variant="danger" size="sm" />
            <Badge label={insight.bestIndicator} variant="accent" size="sm" />
          </View>

          <Text variant="body-sm" className="leading-relaxed text-text-secondary">
            {insight.psychology}
          </Text>

          <ExplainabilityBlock explainability={insight.explainability} />
        </View>
      ) : null}
    </GlassCard>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-surface p-2.5">
      <Text variant="caption" className="mb-0.5">
        {label}
      </Text>
      <Text variant="price" className="text-base">
        {value}
      </Text>
    </View>
  );
}

function InsightRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'bullish' | 'bearish' | 'warning';
}) {
  return (
    <View>
      <Text variant="caption" className="mb-0.5 font-semibold text-text-secondary">
        {label}
      </Text>
      <Text
        variant="body-sm"
        className={cn(
          'leading-relaxed',
          tone === 'bullish' && 'text-bullish',
          tone === 'bearish' && 'text-bearish',
          tone === 'warning' && 'text-warning',
        )}
      >
        {value}
      </Text>
    </View>
  );
}
