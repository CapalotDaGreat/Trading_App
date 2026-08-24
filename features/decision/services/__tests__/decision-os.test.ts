import {
  buildDecisionDebt,
  researchConsistencyLabel,
  waitingReviewCount,
} from '../decision-os.service';

describe('decision OS calm process helpers', () => {
  it('describes waiting reviews without shame', () => {
    const debt = buildDecisionDebt({
      unreviewedSetups: 2,
      incompleteJournals: 3,
      unfinishedReplay: 1,
      unfinishedLessons: 1,
      ignoredAlerts: 0,
    });

    expect(waitingReviewCount(debt)).toBe(7);
    expect(debt.encouragement).toMatch(/when you have energy/i);
    expect(debt.items.map((item) => item.label).join(' ')).not.toMatch(/unfinished|debt/i);
    expect(debt.items[0]?.label).toMatch(/waiting for a research or skip/i);
  });

  it('treats a clear desk as optional, not a hunt', () => {
    const debt = buildDecisionDebt({});
    expect(waitingReviewCount(debt)).toBe(0);
    expect(debt.encouragement).toMatch(/optional/i);
    expect(debt.encouragement).not.toMatch(/hunt|earned the right/i);
  });

  it('labels research consistency without urgency', () => {
    expect(
      researchConsistencyLabel({ researched: 4, journaled: 3, skipped: 2, total: 6 }).value,
    ).toBe('Steady');
    expect(
      researchConsistencyLabel({ researched: 0, journaled: 0, skipped: 0, total: 0 }).value,
    ).toBe('Not enough yet');
  });
});
