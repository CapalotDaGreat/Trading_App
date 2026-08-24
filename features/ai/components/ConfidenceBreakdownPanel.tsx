import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import { EVIDENCE_LEVEL_COPY } from '@/shared/constants/trust-language';

import type { ConfidenceBreakdown, ConfidencePillar } from '../types/ai-trust.types';

interface ConfidenceBreakdownPanelProps {
  breakdown: ConfidenceBreakdown;
  compact?: boolean;
  defaultCollapsed?: boolean;
}

function PillarRow({ pillar }: { pillar: ConfidencePillar }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${pillar.label} ${pillar.agrees ? 'present' : 'thin'}. ${open ? 'Hide' : 'Show'} explanation`}
      onPress={() => setOpen((v) => !v)}
      className="rounded-xl border border-border/50 bg-background/40 px-3 py-2"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="caption" className="font-medium text-text-primary">
          {pillar.label}
        </Text>
        <Text
          variant="caption"
          className={cn('font-semibold', pillar.agrees ? 'text-bullish' : 'text-text-secondary')}
        >
          {pillar.agrees ? 'Present' : 'Thin'}
        </Text>
      </View>
      <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
        <View
          className={cn('h-full rounded-full', pillar.agrees ? 'bg-bullish' : 'bg-text-tertiary')}
          style={{ width: `${Math.min(100, pillar.score)}%` }}
        />
      </View>
      {open ? (
        <Text variant="caption" className="mt-2 leading-relaxed text-text-secondary">
          {pillar.explanation}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ConfidenceBreakdownPanel({
  breakdown,
  compact = false,
  defaultCollapsed = true,
}: ConfidenceBreakdownPanelProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(!defaultCollapsed);
  const pillars = compact ? breakdown.pillars.slice(0, 5) : breakdown.pillars;

  return (
    <View className="rounded-2xl border border-border/60 bg-surface/30 p-3">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Evidence quality ${EVIDENCE_LEVEL_COPY[breakdown.evidenceLevel].label}. ${open ? 'Hide' : 'Show'} why and what would improve this.`}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between gap-2"
      >
        <View className="min-w-0 flex-1">
          <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
            {breakdown.label}
          </Text>
          <Text variant="h3" className="mt-0.5">
            {EVIDENCE_LEVEL_COPY[breakdown.evidenceLevel].label}
          </Text>
          <Text variant="caption" className="text-text-secondary">
            {EVIDENCE_LEVEL_COPY[breakdown.evidenceLevel].meaning}
          </Text>
          {breakdown.availableEvidence?.length || breakdown.missingEvidence?.length ? (
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Available: {(breakdown.availableEvidence ?? []).slice(0, 2).join(', ') || 'none listed'}
              {breakdown.missingEvidence?.length
                ? ` · Missing: ${breakdown.missingEvidence.slice(0, 2).join(', ')}`
                : ''}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.tertiary}
        />
      </Pressable>

      {open ? (
        <View className="mt-3 gap-2">
          {breakdown.evidenceWhy?.length ? (
            <View className="gap-1">
              <Text variant="caption" className="font-medium text-text-secondary">
                Why
              </Text>
              {breakdown.evidenceWhy.map((line) => (
                <Text key={line} variant="caption" className="leading-relaxed text-text-tertiary">
                  · {line}
                </Text>
              ))}
            </View>
          ) : null}
          {breakdown.availableEvidence?.length ? (
            <View className="gap-1">
              <Text variant="caption" className="font-medium text-text-secondary">
                Available
              </Text>
              {breakdown.availableEvidence.map((line) => (
                <Text key={`avail-${line}`} variant="caption" className="leading-relaxed text-text-tertiary">
                  · {line}
                </Text>
              ))}
            </View>
          ) : null}
          {breakdown.missingEvidence?.length ? (
            <View className="gap-1">
              <Text variant="caption" className="font-medium text-text-secondary">
                Missing
              </Text>
              {breakdown.missingEvidence.map((line) => (
                <Text key={`miss-${line}`} variant="caption" className="leading-relaxed text-text-tertiary">
                  · {line}
                </Text>
              ))}
            </View>
          ) : null}
          {breakdown.whatWouldImproveEvidence?.length ? (
            <View className="gap-1">
              <Text variant="caption" className="font-medium text-text-secondary">
                What would improve this
              </Text>
              {breakdown.whatWouldImproveEvidence.map((line) => (
                <Text key={line} variant="caption" className="leading-relaxed text-text-tertiary">
                  · {line}
                </Text>
              ))}
            </View>
          ) : null}
          {pillars.map((p) => (
            <PillarRow key={p.id} pillar={p} />
          ))}
          <Text variant="caption" className="mt-1 leading-relaxed text-text-tertiary">
            {breakdown.notice}
          </Text>
        </View>
      ) : (
        <Text variant="caption" className="mt-1 text-text-tertiary">
          Tap for Trend, Momentum, Volume, Volatility, Macro, News, Breadth, Regime, Freshness
        </Text>
      )}
    </View>
  );
}
