import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

import type { AiTrustBriefing } from '../types/ai-trust.types';

interface TrustBriefStripProps {
  briefing: AiTrustBriefing;
  /** Compact = three columns only (supports / contradicts / unknowns). */
  compact?: boolean;
}

function Column({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View className="min-w-[46%] flex-1 gap-1.5">
      <Text variant="caption" className="font-medium tracking-wide text-text-tertiary">
        {title}
      </Text>
      {lines.slice(0, 3).map((line) => (
        <Text key={line.slice(0, 48)} variant="caption" className="leading-5 text-text-secondary">
          · {line}
        </Text>
      ))}
    </View>
  );
}

/**
 * Always-visible trust chrome — research analyst tone, never ChatGPT fluff.
 */
export function TrustBriefStrip({ briefing, compact = false }: TrustBriefStripProps) {
  return (
    <View
      className="mt-3 gap-3 rounded-panel border border-border bg-background-elevated/80 p-4"
      accessibilityRole="summary"
      accessibilityLabel={`How reliable: ${briefing.reliabilitySummary}`}
      testID="ai-trust-brief-strip"
    >
      <View>
        <Text variant="caption" className="font-medium text-accent">
          How reliable is this?
        </Text>
        <Text variant="body-sm" className="mt-1 leading-6 text-text-primary">
          {briefing.reliabilitySummary}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-4">
        <Column title="What supports this" lines={briefing.supports} />
        <Column title="What contradicts this" lines={briefing.contradicts} />
        {!compact ? <Column title="Unknowns" lines={briefing.unknowns} /> : null}
      </View>

      {compact ? (
        <Text variant="caption" className="leading-5 text-text-tertiary">
          Unknowns: {briefing.unknowns.slice(0, 2).join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}
