import { getDataFreshness } from '@/features/markets/constants/freshness';

import type { AiEnrichedContext } from '../types/ai.types';
import type { AiEvidenceLevel, AiSelfCheckResult, AiStructuredMentorAnswer } from '../types/ai-trust.types';
import { downgradeEvidenceLevel } from './ai-evidence-level.service';
import {
  looksLikeFakeSource,
  looksLikeInvestmentAdvice,
  looksLikePredictionLanguage,
  looksLikePrivateDataLeak,
  looksLikePromptInjection,
} from './ai-safety.service';

function blobFromAnswer(answer: Pick<AiStructuredMentorAnswer, 'whatIKnow' | 'evidence' | 'whyItMatters' | 'suggestedResearchAction' | 'whatChanged'>): string {
  return [
    ...answer.whatIKnow,
    ...answer.evidence,
    answer.whyItMatters,
    answer.suggestedResearchAction,
    answer.whatChanged,
  ].join('\n');
}

/**
 * Internal validation before display. Failures downgrade the answer — they do not invent certainty.
 */
export function runAiSelfCheck(input: {
  prompt: string;
  context?: AiEnrichedContext | null;
  answer: AiStructuredMentorAnswer;
  evidenceLevel: AiEvidenceLevel;
}): AiSelfCheckResult {
  const flags: string[] = [];
  const freshness = getDataFreshness(input.context?.assembledAt);
  const blob = blobFromAnswer(input.answer);

  if (!input.context?.quote) flags.push('source_unavailable');
  if (freshness === 'stale' || freshness === 'unknown') flags.push('stale_data');
  if (!input.context?.decisionIntelligence) flags.push('user_context_unavailable');
  if ((input.context && input.context.overallBias && input.context.overallBias !== 'neutral' && (input.context.rsi?.signal === 'overbought' || input.context.rsi?.signal === 'oversold'))) {
    flags.push('conflicting_evidence');
  }
  if (looksLikePredictionLanguage(blob) || looksLikePredictionLanguage(input.prompt)) {
    flags.push('prediction_language');
  }
  if (looksLikeInvestmentAdvice(blob) || looksLikeInvestmentAdvice(input.prompt)) {
    flags.push('investment_advice_language');
  }
  if (looksLikePromptInjection(input.prompt)) flags.push('prompt_injection');
  if (looksLikePrivateDataLeak(blob) || looksLikePrivateDataLeak(input.prompt)) {
    flags.push('private_data_leakage');
  }
  if (looksLikeFakeSource(blob)) flags.push('fake_sources');
  if (!input.answer.whatIKnow.length || !input.answer.whatIDontKnow.length) {
    flags.push('malformed_output');
  }
  if (input.answer.whatIKnow.some((line) => /unavailable|missing|not attached|do not have/i.test(line) === false) && !input.context?.quote && /\$\d|\d+\.\d{2}/.test(blob)) {
    flags.push('unsupported_claims');
  }

  const blocking = flags.filter((f) =>
    [
      'prediction_language',
      'investment_advice_language',
      'fake_sources',
      'unsupported_claims',
      'malformed_output',
      'stale_data',
      'prompt_injection',
      'private_data_leakage',
    ].includes(f),
  );
  const downgraded = blocking.length > 0;
  const evidenceLevel = downgraded
    ? downgradeEvidenceLevel(input.evidenceLevel, blocking.length >= 2 ? 2 : 1)
    : input.evidenceLevel;

  return {
    passed: flags.length === 0,
    downgraded,
    evidenceLevel,
    flags,
  };
}
