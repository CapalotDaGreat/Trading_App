import type { ScenarioFriction, SimulationScenario } from '../types/scenario.types';
import type { SimulationMode, SimulationSide } from '../types/simulation.types';
import { clamp, hashSeed, mulberry32 } from './scenario-rng';
import { toMajor, toMinor } from './simulation-money.service';

export function frictionForMode(mode: SimulationMode, psychologicalPressure = 0): ScenarioFriction {
  if (mode === 'beginner') {
    return { spreadBps: 2, slippageBps: 0, feeBps: 0, gapRisk: 0.05, executionUncertainty: 0.05 };
  }
  if (mode === 'challenge') {
    return {
      spreadBps: 8,
      slippageBps: 10 + Math.round(psychologicalPressure * 8),
      feeBps: 5,
      gapRisk: 0.35,
      executionUncertainty: 0.4,
    };
  }
  return { spreadBps: 4, slippageBps: 3, feeBps: 2, gapRisk: 0.15, executionUncertainty: 0.18 };
}

export function applyExecutionFriction(input: {
  mid: number;
  side: SimulationSide;
  scenario: SimulationScenario;
  symbol: string;
  notional: number;
}): { price: number; fees: number } {
  const friction = input.scenario.friction ?? frictionForMode('standard');
  const rand = mulberry32(hashSeed([input.scenario.seed, 'fill', input.scenario.clockDay, input.symbol, input.side]));
  const halfSpread = input.mid * (friction.spreadBps / 20_000);
  const slip =
    input.mid *
    (friction.slippageBps / 10_000) *
    (0.4 + rand() * (0.6 + friction.executionUncertainty));
  const adverse = input.side === 'buy' ? 1 : -1;
  const raw = input.mid + adverse * (halfSpread + slip);
  const price = Math.max(0.01, toMajor(toMinor(raw)));
  const fees = toMajor(toMinor(input.notional * (friction.feeBps / 10_000)));
  return { price, fees: Math.max(0, fees) };
}

export function clampPositivePrice(price: number): number {
  return clamp(price, 0.01, 1_000_000);
}
