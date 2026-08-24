import { getDataFreshness } from '@/features/markets/constants/freshness';

import type { AiEnrichedContext } from '../types/ai.types';
import type { AiEvidenceLevel, AiSelfCheckResult, AiStructuredMentorAnswer } from '../types/ai-trust.types';
import { capEvidenceLevel, downgradeEvidenceLevel, looksLikeRepeatAsk } from './ai-evidence-level.service';
import {
  looksLikeDqsRvsAsPrediction,
  looksLikeExcessiveCertainty,
  looksLikeFakeProbability,
  looksLikeFakeSource,
  looksLikeInvestmentAdvice,
  looksLikePredictionLanguage,
  looksLikePrivateDataLeak,
  looksLikePromptInjection,
  looksLikeSetupSuccessLanguage,
} from './ai-safety.service';

function blobFromAnswer(
  answer: Pick<
    AiStructuredMentorAnswer,
    'whatIKnow' | 'evidence' | 'whyItMatters' | 'interpretation' | 'suggestedResearchAction' | 'whatChanged'
  >,
): string {
  return [
    ...answer.whatIKnow,
    ...answer.evidence,
    answer.whyItMatters,
    answer.interpretation,
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
  priorEvidenceLevel?: AiEvidenceLevel | null;
}): AiSelfCheckResult {
  const flags: string[] = [];
  const freshness = getDataFreshness(input.context?.assembledAt);
  const blob = blobFromAnswer(input.answer);

  if (!input.context?.quote) flags.push('source_unavailable');
  if (freshness === 'stale' || freshness === 'unknown') flags.push('stale_data');
  if (!input.context?.decisionIntelligence) flags.push('user_context_unavailable');
  if (
    input.context &&
    input.context.overallBias &&
    input.context.overallBias !== 'neutral' &&
    (input.context.rsi?.signal === 'overbought' || input.context.rsi?.signal === 'oversold')
  ) {
    flags.push('conflicting_evidence');
  }
  if (looksLikePredictionLanguage(blob) || looksLikePredictionLanguage(input.prompt)) {
    flags.push('prediction_language');
  }
  if (looksLikeInvestmentAdvice(blob) || looksLikeInvestmentAdvice(input.prompt)) {
    flags.push('investment_advice_language');
  }
  if (looksLikePromptInjection(input.prompt)) flags.push('prompt_injection');
  if (looksLikeRepeatAsk(input.prompt) && input.priorEvidenceLevel) {
    flags.push('repetition_without_new_evidence');
  }
  if (looksLikePrivateDataLeak(blob) || looksLikePrivateDataLeak(input.prompt)) {
    flags.push('private_data_leakage');
  }
  if (looksLikeFakeSource(blob)) flags.push('fake_sources');
  if (looksLikeFakeProbability(blob) || looksLikeFakeProbability(input.prompt)) {
    flags.push('fake_probability');
  }
  if (looksLikeDqsRvsAsPrediction(blob) || looksLikeDqsRvsAsPrediction(input.prompt)) {
    flags.push('dqs_rvs_as_prediction');
  }
  if (looksLikeSetupSuccessLanguage(blob) || looksLikeSetupSuccessLanguage(input.prompt)) {
    flags.push('setup_success_language');
  }
  if (looksLikeExcessiveCertainty(blob) || looksLikeExcessiveCertainty(input.prompt)) {
    flags.push('excessive_certainty');
  }
  if (
    !input.answer.whatIKnow.length ||
    !input.answer.whatIDontKnow.length ||
    !(input.answer.interpretation || input.answer.whyItMatters) ||
    !input.answer.whatWouldChange.length
  ) {
    flags.push('malformed_output');
  }
  if (
    input.answer.whatIKnow.some((line) => /unavailable|missing|not attached|do not have/i.test(line) === false) &&
    !input.context?.quote &&
    /\$\d|\d+\.\d{2}/.test(blob)
  ) {
    flags.push('unsupported_claims');
  }
  if (input.evidenceLevel === 'insufficient' || input.evidenceLevel === 'limited') {
    flags.push('weak_evidence');
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
      'fake_probability',
      'dqs_rvs_as_prediction',
      'setup_success_language',
      'excessive_certainty',
    ].includes(f),
  );
  const downgraded = blocking.length > 0;
  const afterCheck = downgraded
    ? downgradeEvidenceLevel(input.evidenceLevel, blocking.length >= 2 ? 2 : 1)
    : input.evidenceLevel;
  const evidenceLevel = capEvidenceLevel(afterCheck, input.priorEvidenceLevel);
  const inflatedAttempt =
    Boolean(input.priorEvidenceLevel) &&
    evidenceLevel !== input.evidenceLevel &&
    flags.includes('repetition_without_new_evidence');

  return {
    passed: flags.filter((f) => f !== 'repetition_without_new_evidence' && f !== 'weak_evidence').length === 0,
    downgraded: downgraded || inflatedAttempt || evidenceLevel !== input.evidenceLevel,
    evidenceLevel,
    flags,
  };
}
