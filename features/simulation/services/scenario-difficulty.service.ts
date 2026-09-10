import type { ScenarioComplexity, ScenarioDifficulty } from '../types/scenario.types';
import type { SimulationMode } from '../types/simulation.types';

export const SCENARIO_DIFFICULTY_LABELS: Record<ScenarioDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert practice',
};

/** Practice-level copy. Never implies expected P/L. */
export const SCENARIO_DIFFICULTY_HINTS: Record<ScenarioDifficulty, string> = {
  beginner: 'Clearer structure and limited ambiguity. Process still matters; the path is not a script.',
  intermediate: 'Conflicting evidence and moderate uncertainty. More than one reading can fit the tape.',
  advanced: 'Ambiguous structure, changing volatility, and incomplete information.',
  expert:
    'Multiple competing explanations, event risk, regime changes, and behavioral pressure. No hidden “correct” trade.',
};

export function defaultDifficultyForMode(mode: SimulationMode): ScenarioDifficulty {
  if (mode === 'beginner') return 'beginner';
  if (mode === 'challenge') return 'expert';
  return 'intermediate';
}

/**
 * Complexity scales ambiguity and information — not a forced-loss slider.
 */
export function complexityForDifficulty(difficulty: ScenarioDifficulty): ScenarioComplexity {
  if (difficulty === 'beginner') {
    return {
      volatility: 0.28,
      informationFriction: 0.18,
      assetCount: 3,
      eventCount: 1,
      regimeUncertainty: 0.08,
      timePressure: 0.12,
      psychologicalPressure: 0.1,
      incompleteInformation: 0.15,
    };
  }
  if (difficulty === 'intermediate') {
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
  if (difficulty === 'advanced') {
    return {
      volatility: 0.62,
      informationFriction: 0.58,
      assetCount: 6,
      eventCount: 4,
      regimeUncertainty: 0.5,
      timePressure: 0.55,
      psychologicalPressure: 0.55,
      incompleteInformation: 0.62,
    };
  }
  return {
    volatility: 0.74,
    informationFriction: 0.72,
    assetCount: 7,
    eventCount: 5,
    regimeUncertainty: 0.62,
    timePressure: 0.68,
    psychologicalPressure: 0.78,
    incompleteInformation: 0.78,
  };
}

export function isScenarioDifficulty(value: unknown): value is ScenarioDifficulty {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'expert';
}
