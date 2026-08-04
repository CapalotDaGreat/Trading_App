import { freshnessLabel, type DataFreshnessLevel } from '@/features/markets/constants/freshness';
import { LOCAL_ANALYSIS_LABEL } from '@/features/ai/constants/ai-release';
import { NON_PREDICTION_COPY } from '@/shared/constants/trust-language';

import type { AiEnrichedContext } from '../types/ai.types';
import type {
  AiCounterfactual,
  AiTrustBriefing,
  ConfidenceBreakdown,
  EvidencePack,
} from '../types/ai-trust.types';

function freshnessExplanation(level: DataFreshnessLevel, dataAsOf: number): string {
  const ageSec = Math.max(0, Math.round((Date.now() - dataAsOf) / 1000));
  switch (level) {
    case 'live':
      return `Inputs look fresh (about ${ageSec}s old). Still treat quotes as delayed relative to a broker tape.`;
    case 'recent':
      return `Inputs were updated recently (${freshnessLabel(level)}). Re-check before spending a long research block.`;
    case 'stale':
      return `Inputs may be delayed or stale (${freshnessLabel(level)}). Do not treat this pack as live market truth.`;
    default:
      return 'Freshness is unknown for one or more inputs. Prefer verifying the quote and candle age before deciding.';
  }
}

function dataQualityExplanation(
  evidence: EvidencePack,
  confidence: ConfidenceBreakdown,
): string {
  const present = evidence.items.filter((i) => i.present).length;
  const total = evidence.items.length;
  const coverage = total ? Math.round((present / total) * 100) : 0;
  return `Evidence coverage ${present}/${total} modules (~${coverage}%). Output quality score ${confidence.overall}% measures checklist completeness — ${NON_PREDICTION_COPY}`;
}

/**
 * Compose the Phase B analyst briefing from existing pillars/evidence/counterfactuals.
 * Pure derivation — no new scoring engine.
 */
export function buildAiTrustBriefing(input: {
  context: AiEnrichedContext;
  confidence: ConfidenceBreakdown;
  evidence: EvidencePack;
  counterfactuals: AiCounterfactual[];
  freshness: DataFreshnessLevel;
}): AiTrustBriefing {
  const { context, confidence, evidence, counterfactuals, freshness } = input;
  const agreeing = confidence.pillars.filter((p) => p.agrees);
  const disagreeing = confidence.pillars.filter((p) => !p.agrees);
  const missing = evidence.items.filter((i) => !i.present);

  const supports = [
    evidence.observation,
    ...agreeing.slice(0, 3).map((p) => `${p.label}: ${p.explanation}`),
    ...evidence.items
      .filter((i) => i.present)
      .slice(0, 2)
      .map((i) => `${i.label} — ${i.detail}`),
  ].slice(0, 5);

  const contradicts = [
    ...disagreeing.slice(0, 3).map((p) => `${p.label}: ${p.explanation}`),
    context.rsi?.signal === 'overbought'
      ? 'Momentum stretch argues against chasing upside research without invalidation.'
      : null,
    context.rsi?.signal === 'oversold'
      ? 'Momentum stretch argues against assuming an immediate mean-reversion research edge.'
      : null,
    (context.newsHeadlines?.length ?? 0) === 0
      ? 'No attached headlines — narrative risk is under-specified.'
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .slice(0, 5);

  const unknowns = [
    ...missing.slice(0, 4).map((i) => `${i.label} is missing from this pack.`),
    context.atr == null ? 'Volatility (ATR) not loaded — risk sizing context incomplete.' : null,
    !context.decisionIntelligence?.regimeLabel
      ? 'Regime label not linked — market-condition fit is uncertain.'
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .slice(0, 5);

  const riskFactors = [
    context.decisionIntelligence?.psychologyReminder
      ? `Process risk: ${context.decisionIntelligence.psychologyReminder}`
      : 'Process risk: invalidation not yet written.',
    confidence.overall < 55
      ? 'Low evidence quality — prefer skip or narrow the question.'
      : null,
    freshness === 'stale' || freshness === 'unknown'
      ? 'Data freshness risk — confirm live inputs before deeper research.'
      : null,
    (context.portfolioHoldings?.length ?? 0) > 0
      ? 'Portfolio overlap may concentrate attention risk if you already hold related names.'
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .slice(0, 5);

  const assumptions = [
    `Analysis uses ${LOCAL_ANALYSIS_LABEL} — deterministic rules over the attached context, not a proprietary price model.`,
    'Technical bias describes indicator state, not expected direction.',
    'News and macro inputs are incomplete unless explicitly attached.',
    context.symbol
      ? `Research focus is scoped to ${context.symbol.toUpperCase()} for this answer.`
      : 'No symbol was attached — treat conclusions as general education only.',
  ];

  const missingInformation = [
    ...missing.map((i) => i.label),
    ...(context.newsHeadlines?.length ? [] : ['Catalyst / news detail']),
    ...(context.supportLevels?.length && context.resistanceLevels?.length
      ? []
      : ['Clear invalidation levels']),
  ].slice(0, 6);

  const invalidateQuestions = counterfactuals.slice(0, 4).map((c) => `${c.label}: ${c.detail}`);

  const alternativeViewpoint =
    context.overallBias === 'bullish'
      ? 'Alternative view: treat constructive structure as a reason to *slow down* and define invalidation — not to increase research urgency.'
      : context.overallBias === 'bearish'
        ? 'Alternative view: defensive structure can still deserve research if your process says the skip criteria are unmet — write why-not first.'
        : 'Alternative view: mixed evidence usually means protecting attention is the high-quality decision.';

  const reliabilitySummary =
    confidence.overall >= 70 && freshness !== 'stale' && missing.length <= 2
      ? `Moderately reliable as a research checklist (${confidence.overall}% evidence quality). Still not a forecast.`
      : confidence.overall >= 50
        ? `Usable with caution (${confidence.overall}% evidence quality). Several gaps remain — verify missing inputs.`
        : `Low reliability for decisions (${confidence.overall}% evidence quality). Prefer clarifying questions or a skip.`;

  return {
    reliabilitySummary,
    supports: supports.length ? supports : ['Limited supporting modules in this pack.'],
    contradicts: contradicts.length
      ? contradicts
      : ['No strong contradictory pillars flagged — remain skeptical of silence.'],
    unknowns: unknowns.length ? unknowns : ['Unknowns are always present in markets — write what would change your mind.'],
    riskFactors,
    assumptions,
    missingInformation: missingInformation.length
      ? missingInformation
      : ['No module gaps flagged — still verify live tape independently.'],
    invalidateQuestions: invalidateQuestions.length
      ? invalidateQuestions
      : ['If evidence quality drops or freshness goes stale, pause research.'],
    freshnessExplanation: freshnessExplanation(freshness, context.assembledAt),
    dataQualityExplanation: dataQualityExplanation(evidence, confidence),
    modelLimitations: [
      `${LOCAL_ANALYSIS_LABEL} cannot see your broker fills, full order book, or undisclosed catalysts.`,
      'It does not predict price, size positions, or execute trades.',
      'Cloud LLM analysis is disabled in this release unless explicitly enabled by ops.',
      'Personalization uses process traits only — never journal text or portfolio dollar values in prompts.',
      NON_PREDICTION_COPY,
    ],
    uncertaintyNote:
      'Markets are uncertain. A clean process can still produce a losing outcome; a messy process can get lucky. Grade the decision, not the P&L.',
    alternativeViewpoint,
  };
}
