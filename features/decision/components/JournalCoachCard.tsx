import { View } from 'react-native';

import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import type { JournalCoachInsight } from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
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
  const processScore = Math.max(0, Math.min(100, Math.round(insight.processScore)));

  return (
    <GlassCard className="p-4" glow>
      <View className="mb-3 flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text variant="label" className="mb-1">
            Journal Coach
          </Text>
          <Text variant="h3">Process review</Text>
        </View>
        <Badge
          label={`${processScore} process`}
          variant={processTone(processScore)}
          size="sm"
        />
      </View>

      <View className="mb-4 flex-row gap-3">
        <StatBlock
          label="Win rate"
          value={formatPercent(insight.winRate, { showSign: false })}
        />
        <StatBlock label="Avg R:R" value={insight.avgRr.toFixed(2)} />
        <View className="flex-1">
          <Text variant="caption" className="mb-1">
            Process
          </Text>
          <View className="mb-1 h-2 overflow-hidden rounded-full bg-surface-active">
            <View
              className={cn('h-full rounded-full', processBarClass(processScore))}
              style={{ width: `${processScore}%` }}
            />
          </View>
          <Text variant="caption" className="font-semibold text-text-primary">
            {processScore}/100
          </Text>
        </View>
      </View>

      <View className="mb-3 gap-2">
        <InsightRow label="Common mistake" value={insight.mostCommonMistake} tone="bearish" />
        <InsightRow label="Your edge" value={insight.edge} tone="bullish" />
        <InsightRow label="Avoid" value={insight.avoid} tone="warning" />
        <InsightRow label="Recommendation" value={insight.recommendation} />
      </View>

      <View className="mb-3 flex-row flex-wrap gap-1.5">
        <Badge label={`Best: ${insight.bestWeekday}`} variant="success" size="sm" />
        <Badge label={`Weak: ${insight.worstCondition}`} variant="danger" size="sm" />
        <Badge label={insight.bestIndicator} variant="accent" size="sm" />
      </View>

      <Text variant="body-sm" className="mb-3 leading-relaxed text-text-secondary">
        {insight.psychology}
      </Text>

      <ExplainabilityBlock explainability={insight.explainability} />
    </GlassCard>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl border border-border/60 bg-surface/30 p-2.5">
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
      <Text variant="caption" className="mb-0.5 font-semibold uppercase tracking-wide">
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
