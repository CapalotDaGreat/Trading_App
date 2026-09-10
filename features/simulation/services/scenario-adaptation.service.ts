import type { ScenarioComplexity, ScenarioFocus } from '../types/scenario.types';
import type { SimulationAccount, SimulationMode } from '../types/simulation.types';
import { scoreSimulationProcess } from './scenario-process.service';

export function complexityForMode(mode: SimulationMode): ScenarioComplexity {
  if (mode === 'beginner') {
    return {
      volatility: 0.32,
      informationFriction: 0.22,
      assetCount: 4,
      eventCount: 2,
      regimeUncertainty: 0.18,
      timePressure: 0.15,
      psychologicalPressure: 0.15,
      incompleteInformation: 0.25,
    };
  }
  if (mode === 'challenge') {
    return {
      volatility: 0.72,
      informationFriction: 0.68,
      assetCount: 7,
      eventCount: 5,
      regimeUncertainty: 0.58,
      timePressure: 0.65,
      psychologicalPressure: 0.7,
      incompleteInformation: 0.7,
    };
  }
  return {
    volatility: 0.48,
    informationFriction: 0.42,
    assetCount: 5,
    eventCount: 3,
    regimeUncertainty: 0.36,
    timePressure: 0.4,
    psychologicalPressure: 0.35,
    incompleteInformation: 0.45,
  };
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
  return { ...complexity, incompleteInformation: Math.min(0.9, complexity.incompleteInformation + 0.1) };
}

export function inferScenarioFocus(account?: SimulationAccount | null): ScenarioFocus | undefined {
  if (!account) return undefined;
  const process = scoreSimulationProcess(account);
  const gaps = process.gaps.join(' ').toLowerCase();
  if (gaps.includes('size') || gaps.includes('risk') || process.risk < 45) return 'position_sizing';
  if (gaps.includes('invalidation') || process.uncertainty < 45) return 'uncertainty';
  if (gaps.includes('thesis') || process.thesis < 45) return 'thesis_discipline';
  if (process.discipline >= 70 && process.risk >= 70) return 'event_adaptation';
  return undefined;
}
