import { memo, useId, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ExplainabilityBlock } from '@/features/decision/components/ExplainabilityBlock';
import type {
  DecisionBias,
  ImpactLevel,
  SetupCardData,
  SetupStatus,
} from '@/features/decision/types/decision.types';
import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';

interface SetupCardProps {
  setup: SetupCardData;
  onPress?: () => void;
  highlight?: boolean;
}

const BIAS_LABEL: Record<DecisionBias, string> = {
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
};

const BIAS_VARIANT: Record<DecisionBias, 'success' | 'danger' | 'default'> = {
  bullish: 'success',
  bearish: 'danger',
  neutral: 'default',
};

const STATUS_LABEL: Record<SetupStatus, string> = {
  watching: 'Watching',
  forming: 'Forming',
  confirmed: 'Evidence stronger',
  invalidated: 'Invalidated',
};

const STATUS_VARIANT: Record<SetupStatus, 'accent' | 'default' | 'success' | 'danger'> = {
  watching: 'default',
  forming: 'accent',
  confirmed: 'success',
  invalidated: 'danger',
};

/** Case-risk labels — not “safe to trade” language. */
const RISK_LABEL: Record<ImpactLevel, string> = {
  low: 'Contained case risk',
  medium: 'Moderate case risk',
  high: 'Elevated case risk',
};

const RISK_VARIANT: Record<ImpactLevel, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

export function SetupCardComponent({ setup, onPress, highlight }: SetupCardProps) {
  const { colors } = useTheme();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();
  const changeColor =
    setup.changePercent !== undefined
      ? getPriceColorClass(setup.changePercent)
      : 'text-text-secondary';
  const typeLabel = setup.setupTypeLabel ?? setup.title;
  const oneLineWhy = setup.why[0] ?? typeLabel;

  return (
    <GlassCard className={highlight ? 'mb-3 bg-accent-muted/40 p-4' : 'mb-3 p-4'}>
      {highlight ? (
        <Text variant="caption" className="mb-2 font-semibold text-accent">
          Start here
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${setup.symbol}. ${BIAS_LABEL[setup.bias]}. ${oneLineWhy}`}
        onPress={onPress}
        disabled={!onPress}
        className="min-h-11"
      >
        <View className="mb-2 flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <View className="mb-1 flex-row flex-wrap items-center gap-2">
              <Text variant="h3" headingLevel={3}>
                {setup.symbol}
              </Text>
              <Badge
                label={BIAS_LABEL[setup.bias]}
                variant={BIAS_VARIANT[setup.bias]}
                size="sm"
              />
              <Badge
                label={STATUS_LABEL[setup.status]}
                variant={STATUS_VARIANT[setup.status]}
                size="sm"
              />
            </View>
            <Text variant="caption" className="mb-0.5 text-text-tertiary">
              Research candidate · {typeLabel}
            </Text>
            <Text variant="body-sm" className="text-text-secondary" numberOfLines={2}>
              {oneLineWhy}
            </Text>
          </View>

          <View className="items-end">
            <Text variant="caption" className="mb-0.5 font-semibold text-accent">
              RVS {Math.round(setup.researchValueScore ?? setup.confidence)}
            </Text>
            <Text variant="caption" className="mb-0.5 text-text-tertiary">
              DQS {Math.round(setup.decisionQualityScore ?? setup.confidence)}
            </Text>
            {setup.lastPrice !== undefined ? (
              <Text variant="mono" className="text-text-primary">
                {formatPrice(setup.lastPrice)}
              </Text>
            ) : null}
            {setup.changePercent !== undefined ? (
              <Text variant="caption" className={changeColor}>
                {formatPercent(setup.changePercent)}
              </Text>
            ) : null}
          </View>
        </View>

        {onPress ? (
          <Text variant="caption" className="text-accent">
            Tap chart to research →
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          detailsOpen ? 'Hide research detail' : 'Show why, checklist, and invalidation'
        }
        accessibilityState={{ expanded: detailsOpen }}
        accessibilityHint={detailsOpen ? 'Collapses research detail' : 'Expands research detail'}
        aria-controls={detailsId}
        onPress={() => setDetailsOpen((v) => !v)}
        className="mt-3 min-h-11 flex-row items-center justify-between pt-3"
      >
        <Text variant="caption" className="font-semibold text-text-secondary">
          {detailsOpen ? 'Hide research detail' : 'Why · checklist · invalidation'}
        </Text>
        <Ionicons
          name={detailsOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>

      {detailsOpen ? (
        <View nativeID={detailsId} className="mt-3 gap-3">
          {setup.why.length > 0 ? (
            <View>
              <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
                Why this appeared
              </Text>
              {setup.why.map((reason) => (
                <Text key={reason} variant="caption" className="mb-0.5 leading-relaxed">
                  ✓ {reason}
                </Text>
              ))}
            </View>
          ) : null}

          {setup.researchChecklist?.length ? (
            <View>
              <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
                Research checklist
              </Text>
              {setup.researchChecklist.map((item) => (
                <Text
                  key={item.id}
                  variant="caption"
                  className={item.done ? 'mb-0.5 text-bullish' : 'mb-0.5 text-text-tertiary'}
                >
                  {item.done ? '☑' : '☐'} {item.label}
                </Text>
              ))}
            </View>
          ) : null}

          <View className="flex-row flex-wrap items-center gap-2">
            <Badge
              label={RISK_LABEL[setup.risk]}
              variant={RISK_VARIANT[setup.risk]}
              size="sm"
            />
            {setup.invalidation ? (
              <Text variant="caption" className="flex-1 text-bearish" numberOfLines={2}>
                Invalidation: {setup.invalidation}
              </Text>
            ) : null}
          </View>

          {setup.historyNote ? (
            <Text variant="caption" className="leading-relaxed text-accent">
              {setup.historyNote}
            </Text>
          ) : null}

          {setup.researchValueExplanation ? (
            <Text variant="caption" className="leading-relaxed text-text-secondary">
              {setup.researchValueExplanation}
            </Text>
          ) : null}

          {setup.reasonsToResearch?.length ? (
            <View>
              <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
                Reasons to research
              </Text>
              {setup.reasonsToResearch.slice(0, 3).map((r) => (
                <Text key={r} variant="caption" className="mb-0.5 text-bullish">
                  + {r}
                </Text>
              ))}
            </View>
          ) : null}

          {setup.reasonsNotToResearch?.length ? (
            <View>
              <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
                Reasons not to research
              </Text>
              {setup.reasonsNotToResearch.slice(0, 3).map((r) => (
                <Text key={r} variant="caption" className="mb-0.5 text-bearish">
                  − {r}
                </Text>
              ))}
            </View>
          ) : null}

          {setup.missingConfirmations?.length ? (
            <Text variant="caption" className="text-warning">
              Missing: {setup.missingConfirmations.join(', ')}
            </Text>
          ) : null}

          {setup.alternativeSymbols?.length ? (
            <Text variant="caption" className="text-text-secondary">
              Also consider: {setup.alternativeSymbols.join(', ')}
            </Text>
          ) : null}

          {setup.whyNot && setup.whyNot.reasons.length >= 2 ? (
            <View>
              <Text variant="caption" className="mb-1 font-semibold text-text-secondary">
                Why not (yet)
              </Text>
              {setup.whyNot.reasons.slice(0, 2).map((r) => (
                <Text key={r} variant="caption" className="mb-0.5 text-text-secondary">
                  ⚠ {r}
                </Text>
              ))}
            </View>
          ) : null}

          {setup.entryZone ? (
            <Text variant="caption" className="text-text-secondary">
              Interest zone {formatPrice(setup.entryZone.low)} –{' '}
              {formatPrice(setup.entryZone.high)}
            </Text>
          ) : null}

          <ExplainabilityBlock explainability={setup.explainability} compact />
        </View>
      ) : null}
    </GlassCard>
  );
}

export const SetupCard = memo(SetupCardComponent);
