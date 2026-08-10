import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';
import { fadeInDown } from '@/shared/utils/motion';

import type { TradingDnaProfile, TradingDnaTraitScore } from '../types/personal-intelligence.types';

interface TradingDnaCardProps {
  dna: TradingDnaProfile;
  compact?: boolean;
  /** Free tier: show a short snapshot only. */
  limited?: boolean;
}

const SNAPSHOT_TRAITS = [
  'patience',
  'riskAwareness',
  'processConsistency',
  'researchEfficiency',
  'reflectionQuality',
] as const;

function TraitRow({
  trait,
  index,
  expanded,
  onToggle,
}: {
  trait: TradingDnaTraitScore;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const width = trait.status === 'scored' && trait.score != null ? Math.max(6, trait.score) : 6;

  return (
    <View>
      <View className="mb-1 flex-row items-center justify-between">
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`${trait.label} details`}
          className="min-h-11 justify-center"
        >
          <Text variant="caption" className="text-text-primary">
            {trait.label}
          </Text>
        </Pressable>
        <Text
          variant="caption"
          className={cn(
            trait.trend === 'up' && 'text-accent',
            trait.trend === 'down' && 'text-text-secondary',
            trait.trend === 'flat' && 'text-text-tertiary',
          )}
        >
          {trait.status === 'insufficient' ? '—' : trait.score}
          {trait.status === 'scored' && trait.trend === 'up'
            ? ' ↑'
            : trait.status === 'scored' && trait.trend === 'down'
              ? ' ↓'
              : ''}
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-border">
        <Animated.View
          entering={fadeInDown(reduceMotion, { delay: index * 25 })}
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor:
              trait.status === 'insufficient' ? colors.text.tertiary : colors.accent.primary,
            opacity: trait.status === 'insufficient' ? 0.35 : 1,
          }}
        />
      </View>
      {expanded ? (
        <View className="mt-2 gap-1">
          <Text variant="caption" className="text-text-secondary">
            {trait.detail}
          </Text>
          <Text variant="caption" className="text-text-tertiary">
            Confidence: {trait.confidence}
            {trait.previousScore != null ? ` · Was ${trait.previousScore}` : ''}
          </Text>
          {trait.evidence.slice(0, 4).map((item) => (
            <Text key={`${trait.id}-${item.label}`} variant="caption" className="text-text-tertiary">
              · {item.count} {item.label}
            </Text>
          ))}
        </View>
      ) : (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          {trait.detail}
        </Text>
      )}
    </View>
  );
}

export function TradingDnaCard({ dna, compact = false, limited = false }: TradingDnaCardProps) {
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);

  const traits = compact || limited
    ? dna.traits.filter((t) => (SNAPSHOT_TRAITS as readonly string[]).includes(t.id))
    : dna.traits;

  return (
    <Animated.View
      entering={fadeInDown(reduceMotion)}
      testID={compact ? 'today-section-dna-pulse' : 'trading-dna-card'}
    >
      <Surface tone="subtle" emphasis="outlined">
        <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
          Your Trading DNA
        </Text>
        <Text variant="h3" headingLevel={2} className="mt-1">
          {dna.becomingLabel}
        </Text>
        <Text variant="caption" className="mt-1 text-text-secondary">
          Coaching indicators from your process — never P&L.
          {dna.styleFingerprint.labels.length
            ? ` Style lean: ${dna.styleFingerprint.labels.join(' · ')}`
            : ''}
        </Text>

        <View className="mt-4 gap-2.5">
          {traits.map((trait, index) => (
            <TraitRow
              key={trait.id}
              trait={trait}
              index={index}
              expanded={!compact && openId === trait.id}
              onToggle={() => setOpenId((id) => (id === trait.id ? null : trait.id))}
            />
          ))}
        </View>

        {!compact && dna.strengths.length ? (
          <Text variant="caption" className="mt-3 text-text-secondary">
            Strengths: {dna.strengths.join(' · ')}
          </Text>
        ) : null}
        {!compact && dna.growthEdges.length ? (
          <Text variant="caption" className="mt-1 text-text-secondary">
            Growth edges: {dna.growthEdges.join(' · ')}
          </Text>
        ) : null}

        {limited && !compact ? (
          <CollapsibleSection
            title="Full DNA"
            description="Premium unlocks all traits, history, and monthly review."
          >
            <Text variant="body-sm" className="text-text-secondary">
              Your snapshot above is available on Free. Full evolution, patterns, and goal tracking
              are included with Premium.
            </Text>
          </CollapsibleSection>
        ) : null}
      </Surface>
    </Animated.View>
  );
}
