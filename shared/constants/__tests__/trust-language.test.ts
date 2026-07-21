import { NON_PREDICTION_COPY, TRUST_LANGUAGE } from '../trust-language';

describe('product trust language', () => {
  it('defines distinct score meanings without predictive confidence', () => {
    expect(TRUST_LANGUAGE.rvs.meaning).toMatch(/research/i);
    expect(TRUST_LANGUAGE.dqs.meaning).toMatch(/process|checklist/i);
    expect(TRUST_LANGUAGE.technicalBias.meaning).toMatch(/not a directional forecast/i);
    expect(TRUST_LANGUAGE.outputQuality.meaning).toMatch(/not probability/i);
    expect(NON_PREDICTION_COPY).toMatch(/do not predict price direction/i);
  });
});
