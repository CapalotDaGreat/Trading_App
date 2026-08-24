import { CALM_ATTENTION, EVIDENCE_LEVEL_COPY, NON_PREDICTION_COPY, TRUST_LANGUAGE, waitingReviewCopy } from '../trust-language';

describe('product trust language', () => {
  it('defines distinct score meanings without predictive confidence', () => {
    expect(TRUST_LANGUAGE.rvs.meaning).toMatch(/research/i);
    expect(TRUST_LANGUAGE.dqs.meaning).toMatch(/process|checklist/i);
    expect(TRUST_LANGUAGE.technicalBias.meaning).toMatch(/not a directional forecast/i);
    expect(TRUST_LANGUAGE.outputQuality.meaning).toMatch(/not probability/i);
    expect(NON_PREDICTION_COPY).toMatch(/do not predict price direction/i);
    expect(EVIDENCE_LEVEL_COPY.insufficient.meaning).toMatch(/do not know/i);
    expect(EVIDENCE_LEVEL_COPY.high.meaning).toMatch(/not a forecast/i);
  });

  it('normalizes not trading as a successful attention state', () => {
    expect(CALM_ATTENTION.nothingRequiresAttention).toBe(
      'Nothing requires your attention right now.',
    );
    expect(waitingReviewCopy(0)).toBe(CALM_ATTENTION.waitingReviewEmpty);
    expect(waitingReviewCopy(7)).toBe('You have 7 items waiting for review.');
    expect(waitingReviewCopy(1)).toBe('You have 1 item waiting for review.');
  });
});
