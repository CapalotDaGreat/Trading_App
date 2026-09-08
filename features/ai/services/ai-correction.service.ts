import type { DataFreshnessLevel } from '@/features/markets/constants/freshness';

import type { AiEvidenceLevel } from '../types/ai-trust.types';
import { looksLikePredictionLanguage } from './ai-safety.service';

/**
 * Explicit correction when an earlier assistant turn overstated evidence.
 * Never silently rewrite history.
 */
export function composeMentorCorrection(input: {
  history?: Array<{ role: string; content: string }> | null;
  freshness: DataFreshnessLevel;
  evidenceLevel: AiEvidenceLevel;
}): string | null {
  const last = [...(input.history ?? [])].reverse().find((msg) => msg.role === 'assistant');
  if (!last?.content) return null;
  const text = last.content;
  if (/\bcorrection:\b/i.test(text)) return null;

  if (
    (input.freshness === 'stale' || input.freshness === 'unknown') &&
    /\b(live (broker )?tape|live quote|real-time quote|right now the (price|market)|this is (a )?current (live )?tape)\b/i.test(
      text,
    )
  ) {
    return 'Correction: I treated delayed data as current earlier. That was too strong. The available evidence is limited.';
  }

  if (
    /\bhigh evidence\b/i.test(text) &&
    (input.evidenceLevel === 'limited' || input.evidenceLevel === 'insufficient') &&
    (input.freshness === 'stale' || input.freshness === 'unknown')
  ) {
    return 'Correction: An earlier answer overstated evidence quality. Freshness is delayed or unknown, so the honest level is limited or insufficient.';
  }

  if (looksLikePredictionLanguage(text) && !/\bi don't know\b/i.test(text)) {
    return 'Correction: An earlier answer sounded like a forecast. I cannot know the next price. That claim was unsupported.';
  }

  return null;
}
