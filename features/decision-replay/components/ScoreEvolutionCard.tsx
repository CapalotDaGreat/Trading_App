import { View } from 'react-native';

import type { ScoreSnapshot } from '@/features/decision-replay/services/decision-replay.service';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface ScoreEvolutionCardProps {
  points: ScoreSnapshot[];
  highlightIndex?: number;
}

function BarRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: number;
  highlight?: boolean;
}) {
  if (value == null) return null;
  const width = Math.max(4, Math.min(100, value));
  return (
    <View className="mb-2">
      <View className="mb-1 flex-row justify-between">
        <Text variant="caption" className="text-text-secondary">
          {label}
        </Text>
        <Text variant="caption" className={highlight ? 'font-semibold text-accent' : undefined}>
          {Math.round(value)}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface-active">
        <View
          className={cn('h-full rounded-full', highlight ? 'bg-accent' : 'bg-text-tertiary')}
          style={{ width: `${width}%` }}
        />
      </View>
    </View>
  );
}

export function ScoreEvolutionCard({ points, highlightIndex }: ScoreEvolutionCardProps) {
  if (!points.length) return null;

  const idx =
    highlightIndex != null
      ? Math.max(0, Math.min(points.length - 1, highlightIndex))
      : points.length - 1;
  const current = points[idx]!;
  const prev = idx > 0 ? points[idx - 1] : undefined;

  const changes: string[] = [];
  if (prev) {
    const keys: { key: keyof ScoreSnapshot; label: string }[] = [
      { key: 'researchValue', label: 'RVS' },
      { key: 'decisionQuality', label: 'DQS' },
      { key: 'processScore', label: 'Process' },
      { key: 'confidence', label: 'Confidence' },
    ];
    for (const { key, label } of keys) {
      const a = prev[key];
      const b = current[key];
      if (typeof a === 'number' && typeof b === 'number' && Math.abs(b - a) >= 5) {
        const d = b - a;
        changes.push(`${label} ${d > 0 ? '+' : ''}${Math.round(d)}`);
      }
    }
    if (prev.risk && current.risk && prev.risk !== current.risk) {
      changes.push(`Risk ${prev.risk} → ${current.risk}`);
    }
  }

  return (
    <View className="rounded-2xl bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        SCORE EVOLUTION
      </Text>
      <Text variant="h3" className="mb-1">
        At this moment
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        {current.note ?? 'Process scores — never price predictions'}
      </Text>

      <BarRow label="Research Value" value={current.researchValue} highlight />
      <BarRow label="Decision Quality" value={current.decisionQuality} />
      <BarRow label="Process Score" value={current.processScore} />
      <BarRow label="Logged confidence" value={current.confidence} />

      {current.risk ? (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Risk: {current.risk}
        </Text>
      ) : null}

      {changes.length ? (
        <View className="mt-3 rounded-xl bg-accent-muted/40 px-3 py-2">
          <Text variant="caption" className="font-semibold text-accent">
            Notable change
          </Text>
          <Text variant="caption" className="mt-0.5 text-text-secondary">
            {changes.join(' · ')}
          </Text>
        </View>
      ) : null}

      <Text variant="caption" className="mt-3 text-text-tertiary">
        Point {idx + 1} of {points.length}
      </Text>
    </View>
  );
}
