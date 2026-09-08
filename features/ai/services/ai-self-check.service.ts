import { getDataFreshness } from '@/features/markets/constants/freshness';

import type { AiEnrichedContext } from '../types/ai.types';
import type { AiEvidenceLevel, AiSelfCheckResult, AiStructuredMentorAnswer } from '../types/ai-trust.types';
import {
  capEvidenceLevel,
  detectAttachedEvidenceConflicts,
  downgradeEvidenceLevel,
  looksLikeRepeatAsk,
} from './ai-evidence-level.service';
import {
  looksLikeConfidenceEscalation,
  looksLikeContradictoryUserClaim,
  looksLikeDqsRvsAsPrediction,
  looksLikeExcessiveCertainty,
  looksLikeFabricatedAuthority,
  looksLikeFakeEvidenceCitation,
  looksLikeFakeProbability,
  looksLikeFakeSource,
  looksLikeFakeTimestamp,
  looksLikeHiddenDataExtraction,
  looksLikeInvestmentAdvice,
  looksLikePredictionLanguage,
  looksLikePrivateDataLeak,
  looksLikePromptInjection,
  looksLikeSetupSuccessLanguage,
  looksLikeStaleTreatedAsLive,
  remainingUnsupportedClaim,
} from './ai-safety.service';

function blobFromAnswer(
  answer: Pick<
    AiStructuredMentorAnswer,
    | 'whatIKnow'
    | 'evidence'
    | 'whyItMatters'
    | 'interpretation'
    | 'suggestedResearchAction'
    | 'whatChanged'
    | 'honestyLead'
    | 'correction'
  >,
): string {
  return [
    answer.honestyLead ?? '',
    answer.correction ?? '',
    ...answer.whatIKnow,
    ...answer.evidence,
    answer.whyItMatters,
    answer.interpretation,
    answer.suggestedResearchAction,
    answer.whatChanged,
  ].join('\n');
}

const BLOCKING_FLAGS = [
  'prediction_language',
  'investment_advice_language',
  'fake_sources',
  'fake_evidence',
  'fake_timestamps',
  'unsupported_claims',
  'unsupported_prediction_persists',
  'malformed_output',
  'stale_data',
  'stale_treated_as_current',
  'prompt_injection',
  'fabricated_authority',
  'hidden_data_extraction',
  'private_data_leakage',
  'fake_probability',
  'dqs_rvs_as_prediction',
  'setup_success_language',
  'excessive_certainty',
  'contradictory_user_claim',
] as const;

/**
 * Internal validation before display. Failures downgrade the answer — they do not invent certainty.
 * Unsafe claims are rejected, not rewritten into a still-unsupported call.
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
  const conflicts = detectAttachedEvidenceConflicts(input.context);

  if (!input.context?.quote) flags.push('source_unavailable');
  if (freshness === 'stale' || freshness === 'unknown') flags.push('stale_data');
  if (!input.context?.decisionIntelligence) flags.push('user_context_unavailable');
  if (conflicts.length > 0) flags.push('conflicting_evidence');
  if (looksLikePredictionLanguage(blob) || looksLikePredictionLanguage(input.prompt)) {
    flags.push('prediction_language');
  }
  if (looksLikeInvestmentAdvice(blob) || looksLikeInvestmentAdvice(input.prompt)) {
    flags.push('investment_advice_language');
  }
  if (looksLikePromptInjection(input.prompt) || looksLikeFabricatedAuthority(input.prompt)) {
    flags.push('prompt_injection');
  }
  if (looksLikeFabricatedAuthority(input.prompt) || looksLikeFabricatedAuthority(blob)) {
    flags.push('fabricated_authority');
  }
  if (looksLikeHiddenDataExtraction(input.prompt)) flags.push('hidden_data_extraction');
  if (looksLikeRepeatAsk(input.prompt) && input.priorEvidenceLevel) {
    flags.push('repetition_without_new_evidence');
  }
  if (looksLikeConfidenceEscalation(input.prompt)) {
    flags.push('confidence_escalation');
  }
  if (looksLikePrivateDataLeak(blob) || looksLikePrivateDataLeak(input.prompt)) {
    flags.push('private_data_leakage');
  }
  if (looksLikeFakeSource(blob)) flags.push('fake_sources');
  if (looksLikeFakeEvidenceCitation(blob, Boolean(input.context?.newsHeadlines?.length))) {
    flags.push('fake_evidence');
  }
  if (looksLikeFakeTimestamp(blob, input.context?.assembledAt)) flags.push('fake_timestamps');
  if ((freshness === 'stale' || freshness === 'unknown') && looksLikeStaleTreatedAsLive(blob)) {
    flags.push('stale_treated_as_current');
  }
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
  if (looksLikeContradictoryUserClaim(input.prompt, input.context)) {
    flags.push('contradictory_user_claim');
  }
  if (
    remainingUnsupportedClaim(blob) &&
    !/\bi don't know\b/i.test(blob)
  ) {
    flags.push('unsupported_prediction_persists');
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

  const blocking = flags.filter((f) => (BLOCKING_FLAGS as readonly string[]).includes(f));
  const inflationFlags = flags.filter(
    (f) => f === 'repetition_without_new_evidence' || f === 'confidence_escalation',
  );
  const downgraded = blocking.length > 0 || inflationFlags.length > 0;
  const afterCheck = downgraded
    ? downgradeEvidenceLevel(input.evidenceLevel, blocking.length >= 2 || inflationFlags.length ? 2 : 1)
    : input.evidenceLevel;
  const evidenceLevel = capEvidenceLevel(afterCheck, input.priorEvidenceLevel);
  const inflatedAttempt =
    Boolean(input.priorEvidenceLevel) &&
    evidenceLevel !== input.evidenceLevel &&
    inflationFlags.length > 0;

  return {
    passed: flags.filter(
      (f) => f !== 'repetition_without_new_evidence' && f !== 'weak_evidence' && f !== 'confidence_escalation',
    ).length === 0,
    downgraded: downgraded || inflatedAttempt || evidenceLevel !== input.evidenceLevel,
    evidenceLevel,
    flags,
  };
}
