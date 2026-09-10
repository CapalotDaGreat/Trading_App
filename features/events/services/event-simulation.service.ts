import { generateSimulationScenario } from '@/features/simulation/services/scenario-generator.service';
import type {
  ScenarioDifficulty,
  ScenarioEventKind,
  ScenarioStartOptions,
  SimulationScenario,
} from '@/features/simulation/types/scenario.types';

import type { EventPrepKind, MarketEventKind } from '../types/events.types';
import { scenarioKindForEventKind } from './event-concept.service';

export const PREP_TO_SCENARIO_KIND: Record<EventPrepKind, ScenarioEventKind> = {
  rates: 'rate_decision',
  inflation: 'inflation',
  employment: 'employment',
  earnings: 'earnings',
  macro: 'rate_decision',
};

export function simulationOptionsForEventKind(
  kind: MarketEventKind,
  options?: { highVolatility?: boolean; difficulty?: ScenarioDifficulty },
): ScenarioStartOptions {
  const difficulty = options?.difficulty ?? (options?.highVolatility ? 'advanced' : undefined);
  return {
    focus: 'event_adaptation',
    preferredEventKind: scenarioKindForEventKind(kind),
    ...(difficulty ? { difficulty } : {}),
  };
}

export function simulationHrefForEventKind(
  kind: MarketEventKind,
  options?: { highVolatility?: boolean; prep?: EventPrepKind },
): string {
  const prep = options?.prep;
  const params = new URLSearchParams({ start: '1' });
  if (prep) params.set('prep', prep);
  params.set('focus', 'event_adaptation');
  if (options?.highVolatility) params.set('difficulty', 'advanced');
  return `/simulate?${params.toString()}`;
}

/**
 * Inject a category-matched synthetic event into a generated scenario.
 * Outcome (surprise, reaction, shock) stays stochastic — not a predicted direction.
 */
export function generateEventAwareSimulation(input: {
  userId: string;
  kind: MarketEventKind;
  now?: string;
  seed?: number;
  highVolatility?: boolean;
}): SimulationScenario {
  return generateSimulationScenario({
    userId: input.userId,
    now: input.now,
    seed: input.seed,
    ...simulationOptionsForEventKind(input.kind, { highVolatility: input.highVolatility }),
  });
}
