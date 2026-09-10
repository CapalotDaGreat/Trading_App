import type { ScenarioDifficulty, SimulationScenario } from '../types/scenario.types';

export interface ScenarioConstraintReport {
  ok: boolean;
  errors: string[];
}

const ASSET_BOUNDS: Record<ScenarioDifficulty, { min: number; max: number }> = {
  beginner: { min: 3, max: 4 },
  intermediate: { min: 4, max: 6 },
  advanced: { min: 5, max: 7 },
  expert: { min: 6, max: 8 },
};

const EVENT_BOUNDS: Record<ScenarioDifficulty, { min: number; max: number }> = {
  beginner: { min: 1, max: 2 },
  intermediate: { min: 2, max: 4 },
  advanced: { min: 3, max: 5 },
  expert: { min: 4, max: 7 },
};

function finitePositive(value: number): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Structural checks after generation. Does not grade P/L or invent a “correct path”.
 */
export function validateScenarioConstraints(scenario: SimulationScenario): ScenarioConstraintReport {
  const errors: string[] = [];
  if (!Number.isFinite(scenario.seed)) errors.push('seed must be a finite number');
  if (scenario.horizonDays < 16 || scenario.horizonDays > 48) {
    errors.push('horizonDays must stay within 16–48 sessions');
  }
  if (scenario.clockDay < 0 || scenario.clockDay >= scenario.horizonDays) {
    errors.push('clockDay out of range');
  }
  if (!scenario.assets.length) errors.push('scenario needs at least one asset');
  const bounds = ASSET_BOUNDS[scenario.difficulty];
  if (scenario.assets.length < bounds.min || scenario.assets.length > bounds.max) {
    errors.push(`asset count ${scenario.assets.length} outside ${scenario.difficulty} bounds`);
  }
  const eventBounds = EVENT_BOUNDS[scenario.difficulty];
  if (scenario.events.length < eventBounds.min || scenario.events.length > eventBounds.max) {
    errors.push(`event count ${scenario.events.length} outside ${scenario.difficulty} bounds`);
  }
  if (scenario.difficulty === 'beginner' && scenario.segments.length > 2) {
    errors.push('beginner scenarios should not stack many regime changes');
  }

  for (const asset of scenario.assets) {
    const bars = scenario.paths[asset.symbol] ?? [];
    if (bars.length !== scenario.horizonDays) {
      errors.push(`${asset.symbol} path length ${bars.length} != horizon ${scenario.horizonDays}`);
    }
    for (const bar of bars) {
      if (!finitePositive(bar.open) || !finitePositive(bar.high) || !finitePositive(bar.low) || !finitePositive(bar.close)) {
        errors.push(`${asset.symbol} day ${bar.day} has non-positive OHLC`);
        break;
      }
      if (bar.high + 1e-9 < Math.max(bar.open, bar.close) || bar.low - 1e-9 > Math.min(bar.open, bar.close)) {
        errors.push(`${asset.symbol} day ${bar.day} OHLC is inconsistent`);
        break;
      }
    }
  }

  for (const event of scenario.events) {
    if (event.announceDay < 0 || event.resolveDay >= scenario.horizonDays) {
      errors.push(`${event.id} schedule is out of range`);
    }
    if (event.resolveDay < event.announceDay) errors.push(`${event.id} resolves before it is announced`);
    if (event.briefing.toLowerCase().includes('buy this') || event.briefing.toLowerCase().includes('sell this')) {
      errors.push(`${event.id} briefing looks like a trade signal`);
    }
  }

  return { ok: errors.length === 0, errors };
}
