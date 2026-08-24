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
  needsReview: 'Needs review',
  lowPriority: 'Low priority',
  interestingLowerPriority: 'Interesting, but lower priority.',
  evidenceMixed: 'Evidence is mixed',
  conditionsChanged: 'Conditions changed',
  researchBeforeDeciding: 'Research before deciding',
  waitingReviewEmpty: 'Nothing waiting for review.',
  researchOptional: 'Protect your attention. Research is optional.',
} as const;

export function waitingReviewCopy(count: number): string {
  if (count <= 0) return CALM_ATTENTION.waitingReviewEmpty;
  return `You have ${count} item${count === 1 ? '' : 's'} waiting for review.`;
}
