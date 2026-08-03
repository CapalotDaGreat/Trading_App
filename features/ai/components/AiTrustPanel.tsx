import { View } from 'react-native';

import { DataFreshnessBadge } from '@/features/decision/components/DataFreshnessBadge';
import { DataSourceBadge } from '@/features/markets/components/DataSourceBadge';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiTrustPayload } from '../types/ai-trust.types';
import { ConfidenceBreakdownPanel } from './ConfidenceBreakdownPanel';
import { CounterfactualsPanel } from './CounterfactualsPanel';
import { EvidencePanel } from './EvidencePanel';
import { WhyThisChangedPanel } from './WhyThisChangedPanel';

interface AiTrustPanelProps {
  trust: AiTrustPayload;
  compact?: boolean;
}

/**
 * Composes confidence, evidence, counterfactuals, why-changed, and trust meta.
 */
export function AiTrustPanel({ trust, compact = false }: AiTrustPanelProps) {
  return (
    <View className="mt-3 gap-3">
      <View className="flex-row flex-wrap items-center gap-2">
        <DataSourceBadge kind={trust.meta.dataKind} />
        <DataFreshnessBadge fetchedAt={trust.meta.dataAsOf} />
        <Text variant="caption" className="text-text-tertiary">
          {trust.meta.providerLabel} · {formatRelativeTime(trust.meta.dataAsOf)}
        </Text>
      </View>

      <ConfidenceBreakdownPanel
        breakdown={trust.confidence}
        compact={compact}
        defaultCollapsed={compact}
      />
      <EvidencePanel evidence={trust.evidence} defaultCollapsed={compact} />
      <CounterfactualsPanel items={trust.counterfactuals} defaultCollapsed={compact} />
      {trust.whyChanged ? (
        <WhyThisChangedPanel change={trust.whyChanged} defaultCollapsed={false} />
      ) : null}

      <Text variant="caption" className="leading-relaxed text-text-tertiary">
        {trust.meta.educationalReminder}
      </Text>
    </View>
  );
}
