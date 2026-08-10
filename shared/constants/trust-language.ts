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

export const CALM_CASE_RISK_COPY =
  'Case risk describes how demanding the research case is — not how safe a trade would be.';
