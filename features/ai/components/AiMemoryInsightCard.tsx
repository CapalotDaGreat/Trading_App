import { View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { AiLearningMemory } from '../types/ai-trust.types';

interface AiMemoryInsightCardProps {
  memory: AiLearningMemory;
}

/** Privacy-safe learning memory — no account PII. */
export function AiMemoryInsightCard({ memory }: AiMemoryInsightCardProps) {
  return (
    <GlassCard className="p-5">
      <Text variant="caption" className="font-medium tracking-wide text-text-tertiary">
        AI memory timeline (process traits)
      </Text>
      <Text variant="body-sm" className="mt-1.5 leading-6 text-text-secondary">
        How your research habits shape coaching — never identity data, journal text, or portfolio
        values.
      </Text>

      <View className="mt-3 gap-2">
        <Row label="Learning style" value={memory.learningStyleHint} />
        <Row
          label="Favourite setups"
          value={memory.favoriteSetups.join(', ') || 'Still learning'}
        />
        <Row
          label="Preferred indicators"
          value={memory.preferredIndicators.join(', ') || 'Not set'}
        />
        <Row
          label="Strongest conditions"
          value={memory.strongestMarkets.join(', ') || 'Not set'}
        />
        <Row label="Avoid conditions" value={memory.weakestMarkets.join(', ') || 'Not set'} />
        <Row
          label="Common mistakes"
          value={memory.commonMistakes.join(', ') || 'None flagged'}
        />
        <Row label="Risk tolerance" value={memory.riskTolerance} />
        <Row label="Journal" value={memory.journalConsistencyHint} />
        <Row label="Replay" value={memory.replayBehaviourHint} />
        <Row label="Psychology" value={memory.psychologyReminder} />
      </View>
    </GlassCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="caption" className="font-medium text-text-primary">
        {label}
      </Text>
      <Text variant="caption" className="leading-relaxed text-text-secondary">
        {value}
      </Text>
    </View>
  );
}
