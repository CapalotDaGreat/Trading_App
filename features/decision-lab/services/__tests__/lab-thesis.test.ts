import {
  buildLabAiCritique,
  buildThesisChecklist,
  computeRiskReward,
  isThesisComplete,
  scoreClosedLabTrade,
  validateThesisGeometry,
} from '../lab-thesis.service';
import { buildLabStats, evaluateChallenges } from '../lab-stats.service';
import type { LabPosition, LabThesis } from '../../types/lab.types';

function baseThesis(partial: Partial<LabThesis> = {}): LabThesis {
  const checklist = buildThesisChecklist({
    bias: 'long',
    entryLow: 100,
    entryHigh: 102,
    stopLoss: 95,
    target: 112,
    riskReward: 2.2,
    catalyst: 'Earnings momentum continuation',
    invalidation: 'Daily close below 95',
    confidence: 65,
    academyChecklistDone: true,
  });
  return {
    id: 't1',
    symbol: 'SPY',
    bias: 'long',
    entryLow: 100,
    entryHigh: 102,
    stopLoss: 95,
    target: 112,
    riskReward: 2.2,
    catalyst: 'Earnings momentum continuation',
    invalidation: 'Daily close below 95',
    confidence: 65,
    checklist,
    scenarioId: 'trend_following',
    notes: '',
    createdAt: Date.now(),
    ...partial,
  };
}

describe('decision-lab thesis', () => {
  it('requires complete thesis checklist before open', () => {
    const incomplete = buildThesisChecklist({
      bias: 'long',
      entryLow: 100,
      entryHigh: 101,
    });
    expect(isThesisComplete(incomplete)).toBe(false);
  });

  it('computes risk reward from geometry', () => {
    expect(computeRiskReward('long', 100, 95, 110)).toBe(2);
  });

  it('validates long stop below entry', () => {
    expect(
      validateThesisGeometry({
        bias: 'long',
        entryLow: 100,
        entryHigh: 102,
        stopLoss: 105,
        target: 110,
      }),
    ).toMatch(/below/i);
  });

  it('critiques process without recommending a trade', () => {
    const thesis = baseThesis();
    const critique = buildLabAiCritique({ thesis, regime: 'trending' });
    expect(critique.disclaimer.toLowerCase()).toContain('not a trade recommendation');
    expect(critique.suggestions.length).toBeGreaterThan(0);
    expect(critique.overall).not.toBe('block');
  });

  it('scores closed trades on process', () => {
    const thesis = baseThesis();
    const critique = buildLabAiCritique({ thesis });
    const position: LabPosition = {
      id: 'p1',
      thesisId: thesis.id,
      thesis,
      status: 'open',
      quantity: 10,
      entryPrice: 101,
      markPrice: 101,
      openedAt: Date.now(),
      critique,
      accountCurrency: 'USD',
    };
    const scores = scoreClosedLabTrade({
      position,
      stopHonored: true,
      journaled: true,
    });
    expect(scores.processScore).toBeGreaterThan(50);
    expect(scores.journalPrompt.toLowerCase()).toContain('invalidation');
    expect(scores.learningSummary.toLowerCase()).not.toContain('you lost money');
  });

  it('tracks discipline challenges and stats', () => {
    const thesis = baseThesis();
    const critique = buildLabAiCritique({ thesis });
    const closed: LabPosition = {
      id: 'p1',
      thesisId: thesis.id,
      thesis,
      status: 'closed',
      quantity: 10,
      entryPrice: 101,
      markPrice: 105,
      exitPrice: 105,
      openedAt: Date.now() - 1000,
      closedAt: Date.now(),
      stopHonored: true,
      critique,
      scores: scoreClosedLabTrade({
        position: {
          id: 'p1',
          thesisId: thesis.id,
          thesis,
          status: 'open',
          quantity: 10,
          entryPrice: 101,
          markPrice: 101,
          openedAt: Date.now(),
          critique,
          accountCurrency: 'USD',
        },
        stopHonored: true,
        journaled: true,
      }),
      accountCurrency: 'USD',
    };
    const challenges = evaluateChallenges([closed]);
    expect(challenges.find((c) => c.id === 'stops-five')?.progress).toBe(1);
    const stats = buildLabStats([closed]);
    expect(stats.tradesClosed).toBe(1);
    expect(stats.simulatedPnlNote.toLowerCase()).toContain('secondary');
  });
});
