import { normalizeActivationInput } from '../onboarding-input.service';

describe('activation personalization', () => {
  it('normalizes a focused 3–5 symbol universe', () => {
    expect(
      normalizeActivationInput({
        timeBudgetMinutes: 30,
        activationGoal: 'build_decision_discipline',
        selectedUniverse: [' spy ', 'NVDA', 'spy', 'aapl'],
      }),
    ).toEqual({
      timeBudgetMinutes: 30,
      activationGoal: 'build_decision_discipline',
      selectedUniverse: ['SPY', 'NVDA', 'AAPL'],
    });
  });

  it.each([
    [['SPY', 'QQQ'], 'Select between 3 and 5 symbols.'],
    [['SPY', 'QQQ', 'AAPL', 'NVDA', 'MSFT', 'TSLA'], 'Select between 3 and 5 symbols.'],
  ])('rejects an unsafe universe size', (selectedUniverse, message) => {
    expect(() =>
      normalizeActivationInput({
        timeBudgetMinutes: 20,
        activationGoal: 'research_more_selectively',
        selectedUniverse,
      }),
    ).toThrow(message);
  });
});
