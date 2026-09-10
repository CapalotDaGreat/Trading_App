import { validateScenarioConstraints } from '../scenario-constraints.service';
import { defaultDifficultyForMode } from '../scenario-difficulty.service';
import { generateSimulationScenario } from '../scenario-generator.service';
import { createProductionScenarioSeed } from '../scenario-rng';
import { createSimulationAccount, executeBuy, executeSell, markToMarket } from '../simulation-engine.service';
import { scenarioPrice } from '../scenario-path.service';
import type { ScenarioDifficulty } from '../../types/scenario.types';

const NOW = '2026-09-10T00:00:00.000Z';
const DIFFICULTIES: ScenarioDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

describe('simulation scenario randomization', () => {
  it('varies production sessions when no seed is supplied', () => {
    const seeds = new Set(Array.from({ length: 16 }, () => createProductionScenarioSeed('user-a', NOW)));
    expect(seeds.size).toBeGreaterThan(1);

    const a = generateSimulationScenario({ userId: 'prod-a', now: NOW });
    const b = generateSimulationScenario({ userId: 'prod-a', now: NOW });
    expect(a.seed).not.toBe(b.seed);
    expect(JSON.stringify(a.paths)).not.toEqual(JSON.stringify(b.paths));
  });

  it('reproduces the same scenario when a seed is provided', () => {
    const a = generateSimulationScenario({ userId: 'audit', now: NOW, seed: 4242, difficulty: 'advanced' });
    const b = generateSimulationScenario({ userId: 'audit', now: NOW, seed: 4242, difficulty: 'advanced' });
    expect(a.regime).toBe(b.regime);
    expect(a.difficulty).toBe('advanced');
    expect(a.events.map((item) => item.id)).toEqual(b.events.map((item) => item.id));
    expect(JSON.stringify(a.paths)).toEqual(JSON.stringify(b.paths));
    expect(JSON.stringify(a.marketPath)).toEqual(JSON.stringify(b.marketPath));
  });

  it('keeps generated books inside difficulty constraints', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 8; seed += 1) {
        const scenario = generateSimulationScenario({
          userId: 'bounds',
          now: NOW,
          seed: seed * 17 + difficulty.length,
          difficulty,
        });
        const report = validateScenarioConstraints(scenario);
        expect(report.errors).toEqual([]);
        expect(report.ok).toBe(true);
        expect(scenario.difficulty).toBe(difficulty);
      }
    }
  });

  it('scales ambiguity with difficulty without forcing a down path', () => {
    const beginner = generateSimulationScenario({ userId: 'level', now: NOW, seed: 11, difficulty: 'beginner' });
    const expert = generateSimulationScenario({ userId: 'level', now: NOW, seed: 11, difficulty: 'expert' });
    expect(beginner.assets.length).toBeLessThan(expert.assets.length);
    expect(beginner.events.length).toBeLessThanOrEqual(2);
    expect(expert.events.length).toBeGreaterThanOrEqual(4);
    expect(beginner.segments.length).toBeLessThanOrEqual(2);
    expect(beginner.complexity.incompleteInformation).toBeLessThan(expert.complexity.incompleteInformation);

    const directions = [3, 9, 21, 33, 44, 55, 66, 77, 88, 99, 111, 123].map((seed) => {
      const scenario = generateSimulationScenario({ userId: 'level', now: NOW, seed, difficulty: 'expert' });
      const first = scenario.marketPath[0]!.close;
      const last = scenario.marketPath[scenario.marketPath.length - 1]!.close;
      return last - first;
    });
    expect(directions.some((delta) => delta > 0)).toBe(true);
    expect(directions.some((delta) => delta < 0)).toBe(true);
  });

  it('maps account rails to a default practice level without replacing the ledger', () => {
    expect(defaultDifficultyForMode('beginner')).toBe('beginner');
    expect(defaultDifficultyForMode('standard')).toBe('intermediate');
    expect(defaultDifficultyForMode('challenge')).toBe('expert');
  });

  it('keeps accounting valid after a randomized fill and clock mark', () => {
    const scenario = generateSimulationScenario({ userId: 'acct', now: NOW, seed: 2026, difficulty: 'expert' });
    const started = createSimulationAccount({ userId: 'acct', now: NOW, scenario });
    expect(started.startingBalance).toBe(100_000);
    expect(started.cashBalance).toBe(100_000);
    expect(started.equity).toBe(100_000);

    const symbol = scenario.assets[0]!.symbol;
    const price = scenarioPrice(scenario, symbol, 0);
    const bought = executeBuy(started, {
      symbol,
      quantity: 8,
      price,
      now: NOW,
      thesis: 'Size from the stop, not from a forecast.',
      evidence: 'Range, volume, and a scheduled fictional print.',
      invalidation: 'A close back through the range.',
      expectedRisk: '1% of equity',
      intendedPositionSize: '1% risk',
      expectedScenarios: 'Hold, fade, or gap through.',
      confidence: 'medium',
    });
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.value.cashBalance).toBeGreaterThanOrEqual(0);
    expect(bought.value.cashBalance + bought.value.investedAmount).toBeCloseTo(bought.value.equity, 8);
    expect(bought.value.checkpoints?.[0]?.kind).toBe('entry');

    const laterPrice = scenarioPrice(scenario, symbol, 6);
    const marked = markToMarket(bought.value, { [symbol]: laterPrice }, NOW);
    expect(marked.cashBalance + marked.investedAmount).toBeCloseTo(marked.equity, 8);
    expect(marked.cashBalance).toBe(bought.value.cashBalance);
  });

  it('does not mutate cash, positions, or checkpoints when an order is invalid', () => {
    const scenario = generateSimulationScenario({ userId: 'acct', now: NOW, seed: 8, difficulty: 'intermediate' });
    const started = createSimulationAccount({ userId: 'acct', now: NOW, scenario });
    const snapshot = structuredClone(started);
    const rejected = executeBuy(started, {
      symbol: scenario.assets[0]!.symbol,
      quantity: 0,
      price: scenarioPrice(scenario, scenario.assets[0]!.symbol, 0),
      now: NOW,
    });
    expect(rejected.ok).toBe(false);
    expect(started).toEqual(snapshot);
    expect(started.checkpoints).toEqual([]);

    const oversize = executeBuy(started, {
      symbol: scenario.assets[0]!.symbol,
      quantity: 1_000_000,
      price: scenarioPrice(scenario, scenario.assets[0]!.symbol, 0),
      now: NOW,
    });
    expect(oversize.ok).toBe(false);
    expect(started.cashBalance).toBe(100_000);
    expect(started.transactions).toHaveLength(0);
    expect(started.positions).toHaveLength(0);

    const noShort = executeSell(started, {
      symbol: scenario.assets[0]!.symbol,
      quantity: 1,
      price: 10,
      now: NOW,
    });
    expect(noShort.ok).toBe(false);
    expect(started).toEqual(snapshot);
  });

  it('does not leak a hidden correct trade in event copy', () => {
    const scenario = generateSimulationScenario({ userId: 'copy', now: NOW, seed: 14, difficulty: 'expert' });
    const blob = `${scenario.events.map((item) => `${item.briefing} ${item.outcome}`).join(' ')}`.toLowerCase();
    expect(blob).not.toMatch(/buy this|sell this|guaranteed|best trade|expected profit/);
  });

  it('keeps fomo-context paths stochastic across seeds', () => {
    const directions = [3, 9, 21, 33, 44, 55, 66, 77, 88, 99, 111, 123].map((seed) => {
      const scenario = generateSimulationScenario({
        userId: 'fomo',
        now: NOW,
        seed,
        focus: 'fomo_chase',
        difficulty: 'intermediate',
      });
      const first = scenario.marketPath[0]!.close;
      const last = scenario.marketPath[scenario.marketPath.length - 1]!.close;
      return last - first;
    });
    expect(directions.some((delta) => delta > 0)).toBe(true);
    expect(directions.some((delta) => delta < 0)).toBe(true);
  });
});
