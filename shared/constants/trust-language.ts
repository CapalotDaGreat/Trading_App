export const TRUST_LANGUAGE = {
  rvs: {
    short: 'RVS',
    name: 'Research Value Score',
    meaning: 'How worthwhile this is to research now.',
  },
  dqs: {
    short: 'DQS',
    name: 'Decision Quality Score',
    meaning: 'How complete the decision process and evidence checklist are.',
  },
  technicalBias: {
    name: 'Technical bias',
    meaning: 'A description of current indicator state, not a directional forecast.',
  },
  outputQuality: {
    name: 'Output quality',
    meaning: 'Evidence coverage and internal consistency, not probability of a market move.',
  },
} as const;

export const NON_PREDICTION_COPY =
  'Scores describe research priority, process, or evidence quality. They do not predict price direction.';

export const EVIDENCE_LEVEL_COPY = {
  high: {
    label: 'High evidence',
    meaning: 'Several independent inputs are present and roughly agree. Still not a forecast.',
  },
  moderate: {
    label: 'Moderate evidence',
    meaning: 'Useful coverage with gaps. Treat as a research checklist, not certainty.',
  },
  limited: {
    label: 'Limited evidence',
    meaning: 'Coverage is thin, mixed, or delayed. Prefer a narrower question or a skip.',
  },
  insufficient: {
    label: 'Insufficient evidence',
    meaning: 'Required inputs are missing. The honest answer is that we do not know.',
  },
} as const;

export const CALM_CASE_RISK_COPY =
  'Case risk describes how demanding the research case is — not how safe a trade would be.';

/** Attention hierarchy copy — never urgency, never a trade prompt. */
export const CALM_ATTENTION = {
  nothingRequiresAttention: 'Nothing requires your attention right now.',
  nothingRequiresAttentionDetail:
    'This is a successful state. You do not need to invent a research opportunity.',
  worthResearching: 'Worth researching',
  worthReviewing: 'Worth reviewing',
  considerReviewing: 'Consider reviewing',
  needsReview: 'Needs review',
  lowPriority: 'Low priority',
  interestingLowerPriority: 'Interesting, but lower priority.',
  evidenceMixed: 'Evidence is mixed',
  evidenceLimited: 'Evidence is limited',
  conditionsChanged: 'Conditions changed',
  researchBeforeDeciding: 'Research before deciding',
  waitingReviewEmpty: 'Nothing waiting for review.',
  researchOptional: 'Protect your attention. Research is optional.',
  researchReminderReady: 'Your research reminder is ready.',
  processPractice: 'Process practice',
  continueSession: 'Continue session',
  reviewWhenReady: 'Review when ready',
  includedWithPremium: 'Included with Premium',
  seePremiumDepth: 'See Premium depth',
  seePremium: 'See Premium',
} as const;

export function waitingReviewCopy(count: number): string {
  if (count <= 0) return CALM_ATTENTION.waitingReviewEmpty;
  if (count === 1) return '1 item is available to review when you want.';
  return `${count} items are available to review when you want.`;
}

export function composeNamedLevelReminder(input: { symbol: string }): { title: string; body: string } {
  const symbol = input.symbol.trim().toUpperCase();
  return {
    title: CALM_ATTENTION.researchReminderReady,
    body: `${symbol} reached a level you named. ${CALM_ATTENTION.considerReviewing} the case — this is not a prompt to trade.`,
  };
}
