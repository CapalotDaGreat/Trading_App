import type { AiTrustPayload } from '../types/ai-trust.types';
import { AiTrustCenter } from './AiTrustCenter';

interface AiTrustPanelProps {
  trust: AiTrustPayload;
  compact?: boolean;
}

/**
 * Back-compat wrapper — Phase B Trust Center is the canonical surface.
 */
export function AiTrustPanel({ trust, compact = false }: AiTrustPanelProps) {
  return (
    <AiTrustCenter
      trust={trust}
      compact={compact}
      inspectorDefaultOpen={!compact}
      showTitle={!compact}
    />
  );
}
