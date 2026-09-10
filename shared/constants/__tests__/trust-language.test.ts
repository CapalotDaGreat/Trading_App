import {
  CALM_ATTENTION,
  composeNamedLevelReminder,
  EVIDENCE_LEVEL_COPY,
  NON_PREDICTION_COPY,
  TRUST_LANGUAGE,
  waitingReviewCopy,
} from '../trust-language';

describe('product trust language', () => {
  it('defines distinct score meanings without predictive confidence', () => {
    expect(TRUST_LANGUAGE.rvs.meaning).toMatch(/evidence|thesis|unknowns/i);
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
    expect(waitingReviewCopy(7)).toBe('7 items are available to review when you want.');
    expect(waitingReviewCopy(1)).toBe('1 item is available to review when you want.');
  });

  it('uses study-reminder language instead of price-move urgency', () => {
    const reminder = composeNamedLevelReminder({
      symbol: 'EURUSD',
    });
    expect(reminder.title).toBe(CALM_ATTENTION.researchReminderReady);
    expect(reminder.body).toMatch(/EURUSD/);
    expect(reminder.body.toLowerCase()).toMatch(/consider reviewing/);
    expect(`${reminder.title} ${reminder.body}`.toLowerCase()).not.toMatch(
      /\b(urgent|act now|don't miss|hot|winner|guaranteed|is moving|buy|sell)\b/,
    );
  });

  it('keeps premium chrome quiet', () => {
    expect(CALM_ATTENTION.seePremiumDepth.toLowerCase()).not.toMatch(/unlock|go premium|act now/);
    expect(CALM_ATTENTION.includedWithPremium).toBe('Included with Premium');
  });
});
