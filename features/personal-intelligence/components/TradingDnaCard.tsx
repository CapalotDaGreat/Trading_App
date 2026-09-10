import { useRouter } from 'expo-router';
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

import { primaryPracticeForTrait } from '../services/dna-coaching-actions.service';
import type {
  DnaWindowId,
  TradingDnaProfile,
  TradingDnaTraitScore,
} from '../types/personal-intelligence.types';

interface TradingDnaCardProps {
  dna: TradingDnaProfile;
  compact?: boolean;
  /** Free tier: show a short snapshot only. */
  limited?: boolean;
}

const SNAPSHOT_TRAITS = [
  'patience',
  'evidenceDiscipline',
  'invalidationDiscipline',
  'confirmationResistance',
  'decisionStamina',
  'researchEfficiency',
  'adaptability',
  'uncertaintyHandling',
] as const;

const COMPACT_TRAITS = [
  'patience',
  'evidenceDiscipline',
  'invalidationDiscipline',
  'confirmationResistance',
] as const;

const WINDOWS: Array<{ id: DnaWindowId; label: string }> = [
  { id: 'now', label: 'NOW' },
  { id: '30d', label: '30 DAYS' },
  { id: '90d', label: '90 DAYS' },
  { id: 'all', label: 'ALL TIME' },
];

function scoreForWindow(trait: TradingDnaTraitScore, window: DnaWindowId): number | null {
  if (window === '30d') return trait.score30dAgo;
  if (window === '90d') return trait.score90dAgo;
  if (window === 'all') return trait.allTimeScore;
  return trait.status === 'scored' ? trait.score : null;
}

function trendLabel(trait: TradingDnaTraitScore): string {
  if (trait.status === 'insufficient') return 'Not enough evidence';
  if (trait.longitudinalTrend === 'improving') return 'Showing signs of improvement';
  if (trait.longitudinalTrend === 'declining') return 'Softer vs baseline';
  if (trait.longitudinalTrend === 'stable') return 'Stable';
  return 'Building baseline';
}

function TraitRow({
  trait,
  index,
  expanded,
  window,
  onToggle,
}: {
  trait: TradingDnaTraitScore;
  index: number;
  expanded: boolean;
  window: DnaWindowId;
  onToggle: () => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const windowScore = scoreForWindow(trait, window);
  const width = windowScore != null ? Math.max(6, windowScore) : 6;
  const practice =
    trait.status === 'scored' && (trait.score ?? 100) < 60
      ? primaryPracticeForTrait(trait.id)
      : null;
  const whyBullets = trait.whyBullets?.length
    ? trait.whyBullets
    : trait.evidence.slice(0, 4).map((item) => `${item.count} ${item.label}`);

  return (
    <View>
      <View className="mb-1 flex-row items-center justify-between">
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${trait.label}. Observed tendency: ${trendLabel(trait)}. ${WINDOWS.find((item) => item.id === window)?.label ?? 'NOW'} score ${windowScore ?? 'not scored'}. ${trait.evidence.length} evidence items.${practice ? ` Practice: ${practice.title}` : ''}`}
          accessibilityHint={expanded ? 'Hides evidence and window comparison' : 'Shows evidence, window comparison, and practice'}
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
          {windowScore ?? '—'}
        </Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="h-1.5 overflow-hidden rounded-full bg-border"
      >
        <Animated.View
          entering={fadeInDown(reduceMotion, { delay: index * 25 })}
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: windowScore == null ? colors.text.tertiary : colors.accent.primary,
            opacity: windowScore == null ? 0.35 : 1,
          }}
        />
      </View>
      {expanded ? (
        <View className="mt-2 gap-1">
          {trait.insightSentence ? (
            <Text variant="caption" className="font-medium text-text-secondary">
              {trait.insightSentence}
            </Text>
          ) : null}
          <Text variant="caption" className="text-text-secondary">
            {trait.detail}
          </Text>
          <Text variant="caption" className="text-text-tertiary">
            NOW: {trait.status === 'scored' ? trait.score : '—'}
            {' · '}
            30 DAYS: {trait.score30dAgo ?? '—'}
            {' · '}
            90 DAYS: {trait.score90dAgo ?? '—'}
            {' · '}
            ALL TIME: {trait.allTimeScore ?? '—'}
          </Text>
          <Text variant="caption" className="text-text-tertiary">
            Trend: {trendLabel(trait)}
          </Text>
          <Text variant="caption" className="mt-1 font-medium text-text-secondary">
            Why?
          </Text>
          {trait.ratioSentence ? (
            <Text variant="caption" className="text-text-tertiary">
              {trait.ratioSentence}
            </Text>
          ) : null}
          {whyBullets.length ? (
            whyBullets.map((line) => (
              <Text key={`${trait.id}-${line}`} variant="caption" className="text-text-tertiary">
                · {line}
              </Text>
            ))
          ) : (
            <Text variant="caption" className="text-text-tertiary">
              {trait.whySummary}
            </Text>
          )}
          {practice ? (
            <Pressable
              onPress={() => router.push(practice.href as never)}
              accessibilityRole="button"
              accessibilityLabel={`Practice: ${practice.title}`}
              className="mt-2 min-h-11 justify-center"
            >
              <Text variant="caption" className="font-medium text-accent">
                Practice: {practice.title}
              </Text>
              <Text variant="caption" className="text-text-tertiary">
                {practice.detail}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          {trait.insightSentence ?? trait.detail}
        </Text>
      )}
    </View>
  );
}

export function TradingDnaCard({ dna, compact = false, limited = false }: TradingDnaCardProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [window, setWindow] = useState<DnaWindowId>('now');

  const traits = compact
    ? dna.traits.filter((t) => (COMPACT_TRAITS as readonly string[]).includes(t.id))
    : limited
      ? dna.traits.filter((t) => (SNAPSHOT_TRAITS as readonly string[]).includes(t.id))
      : dna.traits;

  return (
    <Animated.View
      entering={fadeInDown(reduceMotion)}
      testID={compact ? 'today-section-dna-pulse' : 'trading-dna-card'}
    >
      <Surface tone="subtle" emphasis="outlined">
        <Text variant="caption" className="font-medium text-text-tertiary">
          Your process patterns
        </Text>
        <Text variant="h3" headingLevel={2} className="mt-1">
          {dna.becomingLabel}
        </Text>
        <Text variant="caption" className="mt-1 text-text-secondary">
          {dna.decisionStyleSummary}
        </Text>
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Observed decision tendencies from your process — never P&L, never a personality diagnosis.
          {dna.styleFingerprint.labels.length
            ? ` Style lean: ${dna.styleFingerprint.labels.join(' · ')}`
            : ''}
        </Text>

        {!compact ? (
          <View className="mt-4 flex-row flex-wrap gap-2" accessibilityRole="tablist">
            {WINDOWS.map((item) => {
              const selected = window === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setWindow(item.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.label} window`}
                  className={cn(
                    'min-h-11 items-center justify-center rounded-full px-3',
                    selected ? 'bg-accent-muted' : 'bg-border/60',
                  )}
                >
                  <Text
                    variant="caption"
                    className={selected ? 'font-semibold text-accent' : 'text-text-tertiary'}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!compact && dna.processInsights.length ? (
          <View className="mt-4 gap-3">
            <Text variant="caption" className="font-semibold text-text-secondary">
              What is changing
            </Text>
            {dna.processInsights.slice(0, 3).map((insight) => (
              <View key={insight.id} className="gap-1">
                <Text variant="caption" className="text-text-primary">
                  {insight.observation}
                </Text>
                <Text variant="caption" className="text-text-tertiary">
                  Why?
                </Text>
                {insight.whyBullets.map((line) => (
                  <Text key={`${insight.id}-${line}`} variant="caption" className="text-text-tertiary">
                    · {line}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <View className="mt-4 gap-2.5">
          {traits.map((trait, index) => (
            <TraitRow
              key={trait.id}
              trait={trait}
              index={index}
              window={compact ? 'now' : window}
              expanded={!compact && openId === trait.id}
              onToggle={() => setOpenId((id) => (id === trait.id ? null : trait.id))}
            />
          ))}
        </View>

        {!compact && dna.strengthHabits.length ? (
          <View className="mt-4 gap-1">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Strengths
            </Text>
            {dna.strengthHabits.slice(0, 3).map((habit) => (
              <Text key={habit} variant="caption" className="text-text-secondary">
                ✓ {habit}
              </Text>
            ))}
          </View>
        ) : null}

        {!compact && dna.developingHabits.length ? (
          <View className="mt-3 gap-1">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Developing habits
            </Text>
            {dna.developingHabits.slice(0, 3).map((habit) => (
              <Text key={habit} variant="caption" className="text-text-secondary">
                → {habit}
              </Text>
            ))}
          </View>
        ) : null}

        {!compact && dna.focusPractices.length ? (
          <View className="mt-3 gap-3">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Focus areas
            </Text>
            {dna.focusPractices.slice(0, 2).map((item) => (
              <View key={item.traitId} className="gap-1">
                <Text variant="caption" className="text-text-secondary">
                  {item.observation}
                </Text>
                <Pressable
                  onPress={() => router.push(item.practice.href as never)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.practice.kind} practice: ${item.practice.title}`}
                  className="min-h-11 justify-center"
                >
                  <Text variant="caption" className="font-medium text-accent">
                    Practice → {item.practice.title}
                  </Text>
                  <Text variant="caption" className="text-text-tertiary">
                    {item.practice.detail}
                  </Text>
                </Pressable>
                <Text variant="caption" className="text-text-tertiary">
                  Measured: {item.measurement}
                </Text>
              </View>
            ))}
          </View>
        ) : !compact && dna.focusAreas.length ? (
          <View className="mt-3 gap-1">
            <Text variant="caption" className="font-semibold text-text-secondary">
              Focus areas
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
            description="Premium includes all traits, history, and monthly review."
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
