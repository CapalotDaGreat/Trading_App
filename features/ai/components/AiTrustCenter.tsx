import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

import type { AiTrustPayload } from '../types/ai-trust.types';
import { EvidenceInspector } from './EvidenceInspector';
import { TrustBriefStrip } from './TrustBriefStrip';

interface AiTrustCenterProps {
  trust: AiTrustPayload;
  /** Chat bubbles use compact brief; analysis cards use full. */
  compact?: boolean;
  /** Open Evidence Inspector by default (analysis cards). */
  inspectorDefaultOpen?: boolean;
  showTitle?: boolean;
}

/**
 * AI Trust Center — credibility chrome for every AI answer.
 * Brief is always visible; inspector is progressive disclosure.
 */
export function AiTrustCenter({
  trust,
  compact = false,
  inspectorDefaultOpen = false,
  showTitle = false,
}: AiTrustCenterProps) {
  return (
    <View className="mt-1" testID="ai-trust-center">
      {showTitle ? (
        <Text variant="caption" className="mb-1 font-medium tracking-wide text-text-tertiary">
          Trust Center
        </Text>
      ) : null}
      <TrustBriefStrip briefing={trust.briefing} compact={compact} />
      <EvidenceInspector trust={trust} defaultOpen={inspectorDefaultOpen} />
    </View>
  );
}
