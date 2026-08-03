import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';
import { fadeInDown } from '@/shared/utils/motion';

import type { TradingDnaProfile } from '../types/personal-intelligence.types';

interface TradingDnaCardProps {
  dna: TradingDnaProfile;
  compact?: boolean;
}

export function TradingDnaCard({ dna, compact = false }: TradingDnaCardProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const traits = compact
    ? dna.traits.filter((t) =>
        ['patience', 'discipline', 'consistency', 'decisionQuality', 'research'].includes(t.id),
      )
    : dna.traits;

  return (
    <Animated.View
      entering={fadeInDown(reduceMotion)}
      testID={compact ? 'today-section-dna-pulse' : 'trading-dna-card'}
    >
      <GlassCard className="p-4">
        <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
          Trading DNA
        </Text>
        <Text variant="h3" className="mt-1">
          {dna.becomingLabel}
        </Text>
        <Text variant="caption" className="mt-1 text-text-secondary">
          Style root: {dna.styleLabel} · Strengths: {dna.strengths.join(' · ')}
        </Text>

        <View className="mt-4 gap-2.5">
          {traits.map((trait, index) => (
            <View key={trait.id}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text variant="caption" className="text-text-primary">
                  {trait.label}
                </Text>
                <Text
                  variant="caption"
                  className={cn(
                    trait.trend === 'up' && 'text-bullish',
                    trait.trend === 'down' && 'text-bearish',
                    trait.trend === 'flat' && 'text-text-tertiary',
                  )}
                >
                  {trait.score}
                  {trait.trend === 'up' ? ' ↑' : trait.trend === 'down' ? ' ↓' : ''}
                </Text>
              </View>
              <View className="h-1.5 overflow-hidden rounded-full bg-border">
                <Animated.View
                  entering={fadeInDown(reduceMotion, { delay: index * 25 })}
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, trait.score)}%`,
                    backgroundColor: colors.accent.primary,
                  }}
                />
              </View>
              {!compact ? (
                <Text variant="caption" className="mt-1 text-text-tertiary">
                  {trait.detail}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}
