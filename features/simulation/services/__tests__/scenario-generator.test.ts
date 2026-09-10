import {
  advanceScenarioClock,
  answerDecisionWindow,
  generateSimulationScenario,
  visibleScenarioEvents,
} from '../scenario-generator.service';
import { applyExecutionFriction } from '../scenario-friction.service';
import { indicatorAt, relativeStrengthIndex, simpleMovingAverage } from '../scenario-indicators.service';
import { averageTrueRange, scenarioBars, scenarioPrice } from '../scenario-path.service';
import { scoreSimulationProcess } from '../scenario-process.service';
import { publicScenarioView, publicViewLeaks, visibleBarsForSymbol } from '../scenario-visibility.service';
import { createSimulationAccount, executeBuy, markToMarket } from '../simulation-engine.service';

const NOW = '2026-09-10T00:00:00.000Z';

describe('simulation scenario generator', () => {
  it('reproduces the same path for the same seed and a different path for another seed', () => {
    const a = generateSimulationScenario({ userId: 'user-a', now: NOW, seed: 42 });
    const b = generateSimulationScenario({ userId: 'user-a', now: NOW, seed: 42 });
    const c = generateSimulationScenario({ userId: 'user-a', now: NOW, seed: 99 });
    expect(a.regime).toBe(b.regime);
    expect(a.events.map((item) => item.id)).toEqual(b.events.map((item) => item.id));
    expect(a.assets[0]!.symbol).toBe(b.assets[0]!.symbol);
    expect(scenarioPrice(a, a.assets[0]!.symbol, 5)).toBe(scenarioPrice(b, b.assets[0]!.symbol, 5));
    expect(JSON.stringify(a.paths[a.assets[0]!.symbol])).toEqual(JSON.stringify(b.paths[b.assets[0]!.symbol]));
    expect(scenarioPrice(c, c.assets[0]!.symbol, 5)).not.toBe(scenarioPrice(a, a.assets[0]!.symbol, 5));
  });

  it('does not leak event outcomes before resolve day', () => {
    const scenario = generateSimulationScenario({ userId: 'user-a', seed: 7, now: NOW });
    expect(visibleScenarioEvents(scenario)).toEqual([]);
    const announced = scenario.events[0];
    if (!announced) return;
    const mid = advanceScenarioClock(scenario, announced.announceDay, { respectDecisions: false });
    const visible = visibleScenarioEvents(mid);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible[0]!.briefing.toLowerCase()).not.toMatch(/beat|missed|hotter|cooled|failed|held/);
    const view = publicScenarioView(mid);
    expect(publicViewLeaks(view, mid)).toEqual([]);
    expect(JSON.stringify(view).toLowerCase()).not.toContain('seed');
    if (mid.clockDay < announced.resolveDay) {
      expect(view.visibleEvents[0]?.actualValue).toBeUndefined();
      expect(view.visibleEvents[0]?.outcome).toBeUndefined();
    }
  });

  it('keeps future bars out of the visible tape', () => {
    const scenario = advanceScenarioClock(generateSimulationScenario({ userId: 'user-a', seed: 11, now: NOW }), 6, {
      respectDecisions: false,
    });
    const symbol = scenario.assets[0]!.symbol;
    const visible = visibleBarsForSymbol(scenario, symbol);
    expect(visible).toHaveLength(scenario.clockDay + 1);
    expect(visible.every((bar) => bar.day <= scenario.clockDay)).toBe(true);
    expect(scenario.paths[symbol]!.length).toBeGreaterThan(visible.length);
    expect(visible[visible.length - 1]!.close).toBe(scenarioPrice(scenario, symbol));
  });

  it('resolves events on the scheduled day', () => {
    const base = generateSimulationScenario({ userId: 'user-a', seed: 13, now: NOW });
    const event = base.events[0];
    if (!event) return;
    const before = publicScenarioView(
      advanceScenarioClock(base, Math.max(0, event.resolveDay - 1), { respectDecisions: false }),
    );
    const after = publicScenarioView(advanceScenarioClock(base, event.resolveDay, { respectDecisions: false }));
    const beforeRow = before.visibleEvents.find((item) => item.id === event.id);
    const afterRow = after.visibleEvents.find((item) => item.id === event.id);
    if (event.announceDay < event.resolveDay) {
      expect(beforeRow?.resolved).not.toBe(true);
    }
    expect(afterRow?.resolved).toBe(true);
    expect(afterRow?.outcome).toBeTruthy();
  });

  it('builds plausible OHLC with temporal structure, not independent noise', () => {
    const scenario = generateSimulationScenario({ userId: 'user-a', seed: 21, now: NOW });
    const symbol = scenario.assets[0]!.symbol;
    const bars = scenario.paths[symbol]!;
    expect(bars.length).toBe(scenario.horizonDays);
    for (const bar of bars) {
      expect(bar.high).toBeGreaterThanOrEqual(Math.max(bar.open, bar.close));
      expect(bar.low).toBeLessThanOrEqual(Math.min(bar.open, bar.close));
      expect(bar.close).toBeGreaterThan(0);
    }
    const impulse = bars.filter((bar) => bar.phase === 'impulse');
    const quiet = bars.filter((bar) => bar.phase === 'consolidation');
    if (impulse.length >= 3 && quiet.length >= 3) {
      expect(averageTrueRange(impulse, impulse.length)).toBeGreaterThan(averageTrueRange(quiet, quiet.length));
    }
    const returns = bars.slice(1).map((bar, index) => (bar.close - bars[index]!.close) / bars[index]!.close);
    const autocorr =
      returns.slice(1).reduce((sum, item, index) => sum + item * returns[index]!, 0) /
      returns.slice(1).reduce((sum, item) => sum + item * item, 0);
    expect(Number.isFinite(autocorr)).toBe(true);
  });

  it('computes indicators only from the bars it is given', () => {
    const scenario = generateSimulationScenario({ userId: 'user-a', seed: 17, now: NOW });
    const symbol = scenario.assets[0]!.symbol;
    const visible = scenarioBars(scenario, symbol, 10);
    const full = scenario.paths[symbol]!;
    const smaVisible = simpleMovingAverage(visible, 5);
    const smaFull = simpleMovingAverage(full, 5);
    expect(indicatorAt(smaVisible, 9)).toBe(indicatorAt(smaFull, 9));
    expect(indicatorAt(smaFull, 20)).not.toBe(indicatorAt(smaVisible, 9));
    const rsiVisible = relativeStrengthIndex(visible, 6);
    const rsiPeek = relativeStrengthIndex(full, 6);
    expect(indicatorAt(rsiVisible, 9)).toBe(indicatorAt(rsiPeek, 9));
    expect(indicatorAt(rsiPeek, 20)).not.toBeNull();
  });

  it('applies friction so fills are not the mid price in advanced books', () => {
    const scenario = generateSimulationScenario({ userId: 'user-a', seed: 8, now: NOW, mode: 'challenge' });
    const mid = scenarioPrice(scenario, scenario.assets[0]!.symbol, 0);
    const fill = applyExecutionFriction({
      mid,
      side: 'buy',
      scenario,
      symbol: scenario.assets[0]!.symbol,
      notional: mid * 10,
    });
    expect(fill.price).not.toBe(mid);
    expect(fill.price).toBeGreaterThan(mid);
    expect(fill.fees).toBeGreaterThan(0);
  });

  it('can open an event-adaptation book seeded with a preferred event type', () => {
    const scenario = generateSimulationScenario({
      userId: 'user-a',
      seed: 3,
      now: NOW,
      focus: 'event_adaptation',
      preferredEventKind: 'rate_decision',
    });
    expect(scenario.events.some((item) => item.kind === 'rate_decision')).toBe(true);
    expect(scenario.events[0]?.kind).toBe('rate_decision');
    expect(scenario.events[0]?.briefing.toLowerCase()).not.toMatch(/buy|sell|short this/);
  });

  it('lets recorded decisions change later state and debrief evidence', () => {
    const started = generateSimulationScenario({ userId: 'user-a', seed: 5, now: NOW });
    const window = [...started.decisionWindows].sort((a, b) => a.day - b.day)[0];
    if (!window) return;
    const paused = advanceScenarioClock(started, window.day);
    expect(paused.clockMode).toBe('paused');
    const still = advanceScenarioClock(paused, 3);
    expect(still.clockDay).toBe(paused.clockDay);
    const answered = answerDecisionWindow(paused, window.id, 'reduce', 'Size down until the print is known.', NOW);
    expect(answered.decisionWindows.find((item) => item.id === window.id)?.response?.option).toBe('reduce');
    const moved = advanceScenarioClock(answered, 1);
    expect(moved.clockDay).toBeGreaterThan(paused.clockDay);
  });

  it('keeps portfolio accounting valid after a fill and a clock advance', () => {
    const scenario = generateSimulationScenario({ userId: 'user-a', seed: 3, now: NOW });
    const symbol = scenario.assets[0]!.symbol;
    const started = createSimulationAccount({ userId: 'user-a', now: NOW, scenario });
    const price = scenarioPrice(scenario, symbol, 0);
    const bought = executeBuy(started, {
      symbol,
      quantity: 10,
      price,
      now: NOW,
      thesis: 'Process test: size from the stop, not from conviction.',
    });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.value.cashBalance).toBeLessThan(started.cashBalance);
    expect(bought.value.cashBalance).toBeGreaterThanOrEqual(0);
    expect(bought.value.equity).toBeGreaterThan(0);
    const later = advanceScenarioClock(scenario, 4);
    const marked = markToMarket(bought.value, { [symbol]: scenarioPrice(later, symbol) }, NOW);
    expect(marked.cashBalance + marked.investedAmount).toBeCloseTo(marked.equity, 8);
    expect(marked.cashBalance).toBeGreaterThanOrEqual(0);
  });

  it('scores process independently of simulated return', () => {
    const empty = createSimulationAccount({ userId: 'user-a', now: NOW });
    expect(scoreSimulationProcess(empty).composite).toBe(0);
    const withThesis: typeof empty = {
      ...empty,
      totalReturn: 0.25,
      decisions: [
        {
          id: 'dec_1',
          accountId: empty.id,
          symbol: 'BRIX',
          thesis: 'Breakout only if the daily close holds above the range.',
          evidence: 'Two closes plus rising volume on the educational tape.',
          invalidation: 'A close back inside the range.',
          expectedRisk: '1% of equity to the stop.',
          intendedPositionSize: '1% risk',
          confidence: 'medium',
          createdAt: NOW,
          closedAt: NOW,
          closeReview: {
            whatHappened: 'Stopped as planned.',
            thesisCorrect: 'The level failed.',
            riskAppropriate: 'Yes',
          },
        },
      ],
    };
    const score = scoreSimulationProcess(withThesis);
    expect(score.composite).toBeGreaterThan(50);
    expect(score.outcomeNote.toLowerCase()).toContain('does not mean');
  });
});
