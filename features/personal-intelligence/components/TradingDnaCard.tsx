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

function trendLabel(trait: TradingDnaTraitScore): string {
  if (trait.status === 'insufficient') return 'Not enough evidence';
  if (trait.longitudinalTrend === 'improving') return 'Improving';
  if (trait.longitudinalTrend === 'declining') return 'Softer vs baseline';
  if (trait.longitudinalTrend === 'stable') return 'Stable';
  return 'Building baseline';
}

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
          accessibilityLabel={`${trait.label}. ${trendLabel(trait)}. Why do you think this?`}
          accessibilityHint="Shows evidence and 30 / 90 day comparison"
          className="min-h-11 flex-1 justify-center pr-3"
        >
          <Text variant="caption" className="text-text-primary">
            {trait.label}
          </Text>
        </Pressable>
        <Text
          variant="caption"
          className={cn(
            trait.longitudinalTrend === 'improving' && 'text-accent',
            trait.longitudinalTrend === 'declining' && 'text-text-secondary',
            (trait.longitudinalTrend === 'stable' || trait.longitudinalTrend === 'insufficient') &&
              'text-text-tertiary',
          )}
        >
          {trait.status === 'insufficient' ? '—' : trait.score}
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
            Current: {trait.status === 'scored' ? trait.score : '—'}
            {' · '}
            30 days ago: {trait.score30dAgo ?? '—'}
            {' · '}
            90 days ago: {trait.score90dAgo ?? '—'}
          </Text>
          <Text variant="caption" className="text-text-tertiary">
            All-time trend: {trendLabel(trait)}
            {trait.allTimeScore != null ? ` · All-time ${trait.allTimeScore}` : ''}
          </Text>
          <Text variant="caption" className="mt-1 font-medium text-text-secondary">
            Why do you think this?
          </Text>
          <Text variant="caption" className="text-text-tertiary">
            {trait.ratioSentence ?? trait.whySummary}
          </Text>
          {trait.ratioSentence ? (
            <Text variant="caption" className="text-text-tertiary">
              {trait.whySummary}
            </Text>
          ) : null}
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
          {dna.decisionStyleSummary}
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Observed tendencies from your process — never P&L, never a diagnosis.
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

        {!compact && dna.strengthHabits.length ? (
          <View className="mt-4 gap-1">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Strongest habits
            </Text>
            {dna.strengthHabits.slice(0, 3).map((habit) => (
              <Text key={habit} variant="caption" className="text-text-secondary">
                ✓ {habit}
              </Text>
            ))}
          </View>
        ) : null}

        {!compact && dna.focusAreas.length ? (
          <View className="mt-3 gap-1">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Your next opportunity
            </Text>
            {dna.focusAreas.slice(0, 2).map((line) => (
              <Text key={line} variant="caption" className="text-text-secondary">
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {!compact && dna.observedTendencies.some((t) => t.level !== 'not_observed') ? (
          <View className="mt-3 gap-1">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Other observed tendencies
            </Text>
            {dna.observedTendencies
              .filter((t) => t.level !== 'not_observed')
              .map((item) => (
                <Text key={item.id} variant="caption" className="text-text-tertiary">
                  {item.framing}: {item.detail}
                </Text>
              ))}
          </View>
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
