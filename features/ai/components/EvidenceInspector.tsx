import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiTrustPayload } from '../types/ai-trust.types';
import { ConfidenceBreakdownPanel } from './ConfidenceBreakdownPanel';
import { ConfidenceHistoryPanel } from './ConfidenceHistoryPanel';
import { CounterfactualsPanel } from './CounterfactualsPanel';
import { EvidencePanel } from './EvidencePanel';
import { WhyThisChangedPanel } from './WhyThisChangedPanel';

interface EvidenceInspectorProps {
  trust: AiTrustPayload;
  defaultOpen?: boolean;
}

function BulletBlock({ title, lines }: { title: string; lines: string[] }) {
  if (!lines.length) return null;
  return (
    <View className="gap-1.5">
      <Text variant="caption" className="font-medium text-text-tertiary">
        {title}
      </Text>
      {lines.map((line) => (
        <Text key={line.slice(0, 56)} variant="caption" className="leading-5 text-text-secondary">
          · {line}
        </Text>
      ))}
    </View>
  );
}

/**
 * Full Evidence Inspector — progressive disclosure for deep trust work.
 */
export function EvidenceInspector({ trust, defaultOpen = false }: EvidenceInspectorProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const { briefing, meta } = trust;

  return (
    <View className="mt-3 overflow-hidden rounded-panel border border-border bg-background-elevated">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? 'Hide Evidence Inspector' : 'Open Evidence Inspector'}
        onPress={() => setOpen((v) => !v)}
        className="min-h-13 flex-row items-center px-4 py-3.5"
        testID="ai-evidence-inspector-toggle"
      >
        <View className="flex-1 pr-3">
          <Text variant="label" className="text-text-primary">
            Evidence Inspector
          </Text>
          <Text variant="caption" className="mt-1 leading-5 text-text-tertiary">
            Pillars, sources, freshness, invalidation, model limits
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.tertiary}
        />
      </Pressable>

      {open ? (
        <View className="gap-4 border-t border-border px-4 py-4" testID="ai-evidence-inspector">
          <View className="flex-row flex-wrap items-center gap-2">
            <DataSourceBadge kind={meta.dataKind} />
            <DataFreshnessBadge fetchedAt={meta.dataAsOf} />
            <Text variant="caption" className="text-text-tertiary">
              {meta.providerLabel} · {formatRelativeTime(meta.dataAsOf)}
            </Text>
          </View>

          <BulletBlock title="Risk factors" lines={briefing.riskFactors} />
          <BulletBlock title="Research assumptions" lines={briefing.assumptions} />
          <BulletBlock title="Evidence missing" lines={briefing.missingInformation} />
          <BulletBlock title="What would invalidate this?" lines={briefing.invalidateQuestions} />

          <View className="gap-1.5">
            <Text variant="caption" className="font-medium text-text-tertiary">
              Alternative viewpoint
            </Text>
            <Text variant="caption" className="leading-5 text-text-secondary">
              {briefing.alternativeViewpoint}
            </Text>
          </View>

          <View className="gap-1.5">
            <Text variant="caption" className="font-medium text-text-tertiary">
              Freshness
            </Text>
            <Text variant="caption" className="leading-5 text-text-secondary">
              {briefing.freshnessExplanation}
            </Text>
          </View>

          <View className="gap-1.5">
            <Text variant="caption" className="font-medium text-text-tertiary">
              Data quality
            </Text>
            <Text variant="caption" className="leading-5 text-text-secondary">
              {briefing.dataQualityExplanation}
            </Text>
          </View>

          <ConfidenceBreakdownPanel breakdown={trust.confidence} defaultCollapsed={false} />
          <EvidencePanel evidence={trust.evidence} defaultCollapsed={false} />
          <CounterfactualsPanel items={trust.counterfactuals} defaultCollapsed={false} />

          {trust.whyChanged ? (
            <WhyThisChangedPanel change={trust.whyChanged} defaultCollapsed={false} />
          ) : null}

          {trust.confidenceHistory?.length ? (
            <ConfidenceHistoryPanel history={trust.confidenceHistory} />
          ) : null}

          {(meta.citations.length > 0 || meta.indicatorCitations.length > 0) && (
            <View className="gap-1.5">
              <Text variant="caption" className="font-medium text-text-tertiary">
                Source & indicator citations
              </Text>
              {[...meta.indicatorCitations, ...meta.citations]
                .slice(0, 10)
                .map((c) => (
                  <Text
                    key={`${c.label}-${c.value}`}
                    variant="caption"
                    className="leading-5 text-text-secondary"
                  >
                    {c.label}: {c.value}
                  </Text>
                ))}
            </View>
          )}

          <BulletBlock title="Model limitations" lines={briefing.modelLimitations} />

          <Text variant="caption" className="leading-5 text-text-tertiary">
            {briefing.uncertaintyNote}
          </Text>
          <Text variant="caption" className="leading-5 text-text-tertiary">
            {meta.educationalReminder}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
