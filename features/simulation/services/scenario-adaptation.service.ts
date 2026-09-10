import type { ScenarioClimate, ScenarioComplexity, ScenarioFocus } from '../types/scenario.types';
import type { SimulationAccount, SimulationMode } from '../types/simulation.types';
import { complexityForDifficulty, defaultDifficultyForMode } from './scenario-difficulty.service';
import { scoreSimulationProcess } from './scenario-process.service';

export { complexityForDifficulty, defaultDifficultyForMode } from './scenario-difficulty.service';

export function complexityForMode(mode: SimulationMode): ScenarioComplexity {
  return complexityForDifficulty(defaultDifficultyForMode(mode));
}

export function applyFocus(complexity: ScenarioComplexity, focus?: ScenarioFocus): ScenarioComplexity {
  if (!focus) return complexity;
  if (focus === 'position_sizing') {
    return {
      ...complexity,
      volatility: Math.min(0.95, complexity.volatility + 0.18),
      psychologicalPressure: Math.min(0.95, complexity.psychologicalPressure + 0.2),
    };
  }
  if (focus === 'false_breakouts') {
    return { ...complexity, eventCount: Math.max(complexity.eventCount, 3), regimeUncertainty: Math.min(0.8, complexity.regimeUncertainty + 0.15) };
  }
  if (focus === 'uncertainty') {
    return {
      ...complexity,
      incompleteInformation: Math.min(0.95, complexity.incompleteInformation + 0.25),
      informationFriction: Math.min(0.95, complexity.informationFriction + 0.2),
    };
  }
  if (focus === 'event_adaptation') {
    return { ...complexity, eventCount: Math.min(7, complexity.eventCount + 2), timePressure: Math.min(0.9, complexity.timePressure + 0.15) };
  }
  if (focus === 'correlation') {
    return { ...complexity, assetCount: Math.min(8, complexity.assetCount + 2) };
  }
  if (focus === 'fomo_chase') {
    return {
      ...complexity,
      psychologicalPressure: Math.min(0.95, complexity.psychologicalPressure + 0.22),
      timePressure: Math.min(0.9, complexity.timePressure + 0.12),
      volatility: Math.min(0.9, complexity.volatility + 0.08),
    };
  }
  if (focus === 'invalidation_discipline') {
    return {
      ...complexity,
      incompleteInformation: Math.min(0.95, complexity.incompleteInformation + 0.18),
      timePressure: Math.min(0.85, complexity.timePressure + 0.08),
    };
  }
  if (focus === 'overconfidence') {
    return {
      ...complexity,
      incompleteInformation: Math.min(0.95, complexity.incompleteInformation + 0.16),
      informationFriction: Math.min(0.95, complexity.informationFriction + 0.14),
      eventCount: Math.min(7, Math.max(complexity.eventCount, 3)),
    };
  }
  return { ...complexity, incompleteInformation: Math.min(0.9, complexity.incompleteInformation + 0.1) };
}

/** Biases climate after the RNG draws so seed sequences stay aligned. */
export function applyClimateFocus(climate: ScenarioClimate, focus?: ScenarioFocus): ScenarioClimate {
  if (!focus) return climate;
  if (focus === 'fomo_chase') {
    return { ...climate, sentiment: 'complacent' };
  }
  if (focus === 'position_sizing') {
    return { ...climate, liquidity: 'thin' };
  }
  if (focus === 'event_adaptation') {
    return { ...climate, macro: 'uncertain' };
  }
  if (focus === 'overconfidence') {
    return { ...climate, sentiment: climate.sentiment === 'risk_off' ? 'mixed' : climate.sentiment };
  }
  return climate;
}

export function inferScenarioFocus(account?: SimulationAccount | null): ScenarioFocus | undefined {
  if (!account || account.decisions.length === 0) return undefined;
  const process = scoreSimulationProcess(account);
  const gaps = process.gaps.join(' ').toLowerCase();
  if (gaps.includes('size') || gaps.includes('risk') || process.risk < 45 || process.positionSizing < 45) {
    return 'position_sizing';
  }
  if (gaps.includes('invalidation') || process.invalidation < 45) return 'invalidation_discipline';
  if (process.uncertainty < 45) return 'uncertainty';
  if (gaps.includes('thesis') || process.thesis < 45) return 'thesis_discipline';
  if (process.discipline >= 70 && process.risk >= 70) return 'event_adaptation';
  return undefined;
}
