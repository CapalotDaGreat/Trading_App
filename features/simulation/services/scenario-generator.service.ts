import { FICTIONAL_UNIVERSE } from '../constants/fictional-universe';
import type {
  LiquidityClimate,
  MacroClimate,
  MarketSentiment,
  ScenarioAssetConfig,
  ScenarioClimate,
  ScenarioComplexity,
  ScenarioDecisionOption,
  ScenarioDecisionWindow,
  ScenarioDifficulty,
  ScenarioEventKind,
  SimulationScenario,
} from '../types/scenario.types';
import type { SimulationMode } from '../types/simulation.types';
import { applyFocus, inferScenarioFocus } from './scenario-adaptation.service';
import { complexityForDifficulty, defaultDifficultyForMode } from './scenario-difficulty.service';
import { generateScenarioEvents } from './scenario-events.service';
import { frictionForMode } from './scenario-friction.service';
import {
  DEFAULT_HORIZON_DAYS,
  buildRegimeSegments,
  generateStructuredPaths,
  pickPrimaryRegime,
} from './scenario-path.service';
import { createProductionScenarioSeed, mulberry32, pick, pickN } from './scenario-rng';
import { pendingDecisionOnDay, unansweredDecisionWindow } from './scenario-visibility.service';

export { complexityForMode } from './scenario-adaptation.service';
export {
  futureScenarioEvents,
  publicScenarioView,
  resolvedScenarioEvents,
  visibleScenarioEvents,
} from './scenario-visibility.service';

const DEFAULT_OPTIONS: ScenarioDecisionWindow['options'] = ['wait', 'enter', 'reduce', 'ignore', 'research'];

function clampComplexityForDifficulty(
  complexity: ScenarioComplexity,
  difficulty: ScenarioDifficulty,
): ScenarioComplexity {
  const assets =
    difficulty === 'beginner'
      ? { min: 3, max: 4 }
      : difficulty === 'intermediate'
        ? { min: 4, max: 6 }
        : difficulty === 'advanced'
          ? { min: 5, max: 7 }
          : { min: 6, max: 8 };
  const events =
    difficulty === 'beginner'
      ? { min: 1, max: 2 }
      : difficulty === 'intermediate'
        ? { min: 2, max: 4 }
        : difficulty === 'advanced'
          ? { min: 3, max: 5 }
          : { min: 4, max: 7 };
  return {
    ...complexity,
    assetCount: Math.min(assets.max, Math.max(assets.min, complexity.assetCount)),
    eventCount: Math.min(events.max, Math.max(events.min, complexity.eventCount)),
  };
}

function buildClimate(rand: () => number): ScenarioClimate {
  const macros: MacroClimate[] = ['easing', 'tightening', 'stable', 'uncertain'];
  const sentiments: MarketSentiment[] = ['risk_on', 'risk_off', 'mixed', 'complacent'];
  const liquidity: LiquidityClimate[] = ['deep', 'normal', 'thin'];
  return {
    macro: pick(rand, macros),
    sentiment: pick(rand, sentiments),
    liquidity: pick(rand, liquidity),
  };
}

function buildAssets(rand: () => number, count: number): ScenarioAssetConfig[] {
  const index = FICTIONAL_UNIVERSE.find((item) => item.symbol === 'BRIX') ?? FICTIONAL_UNIVERSE[0]!;
  const rest = pickN(
    rand,
    FICTIONAL_UNIVERSE.filter((item) => item.symbol !== index.symbol),
    Math.max(0, count - 1),
  );
  return [index, ...rest].map((item) => ({
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType,
    sector: item.sector,
    basePrice: item.basePrice,
    beta: item.typicalBeta + (rand() - 0.5) * 0.25,
    idiosyncrasy: (rand() - 0.5) * 0.45,
    liquidity: item.liquidity,
    meanReversion: 0.15 + rand() * 0.35,
    momentumBias: (rand() - 0.4) * 0.5,
  }));
}

function buildDecisionWindows(
  rand: () => number,
  scenario: Pick<SimulationScenario, 'events' | 'marketPath' | 'horizonDays' | 'complexity'>,
): ScenarioDecisionWindow[] {
  const windows: ScenarioDecisionWindow[] = [];
  const used = new Set<number>();
  const push = (window: Omit<ScenarioDecisionWindow, 'id'>) => {
    if (used.has(window.day) || window.day < 2 || window.day > scenario.horizonDays - 2) return;
    used.add(window.day);
    windows.push({ ...window, id: `win_${windows.length + 1}` });
  };

  for (const event of scenario.events) {
    if (rand() > 0.55) continue;
    push({
      day: Math.max(1, event.resolveDay - 1),
      kind: 'event_eve',
      prompt: `${event.title} is due. You do not know the print. How do you manage risk?`,
      options: DEFAULT_OPTIONS,
    });
  }

  const market = scenario.marketPath ?? [];
  for (let i = 5; i < market.length; i += 1) {
    const window = market.slice(i - 3, i + 1);
    const drop = (window[0]!.close - window[window.length - 1]!.close) / window[0]!.close;
    if (drop > 0.035 && rand() > 0.35) {
      push({
        day: i,
        kind: 'drawdown',
        prompt: 'The book is drawing down. Has your thesis been invalidated, or is this noise around a still-valid plan?',
        options: ['wait', 'reduce', 'ignore', 'research'],
      });
    }
    if (market[i]!.phase === 'breakout_attempt' || market[i]!.phase === 'failed_breakout') {
      push({
        day: i,
        kind: 'breakout',
        prompt: 'Price is pressing a well-watched area. The first print through is not confirmation. What do you do?',
        options: DEFAULT_OPTIONS,
      });
    }
    if (market[i]!.phase === 'impulse' && i > 6 && market[i - 1]?.phase === 'impulse' && market[i - 2]?.phase === 'impulse') {
      push({
        day: i,
        kind: 'extended_move',
        prompt: 'The move has been extended. Adding, waiting, or reducing are all process choices — not a prediction.',
        options: ['wait', 'enter', 'reduce', 'research'],
      });
    }
  }

  const target = Math.min(5, 2 + Math.round(scenario.complexity.timePressure * 3));
  return windows.slice(0, target);
}

export function generateSimulationScenario(input: {
  userId: string;
  mode?: SimulationMode;
  now?: string;
  /** Tests only. Production callers should omit this. */
  seed?: number;
  focus?: ReturnType<typeof inferScenarioFocus>;
  preferredEventKind?: ScenarioEventKind;
  difficulty?: ScenarioDifficulty;
}): SimulationScenario {
  const now = input.now ?? new Date().toISOString();
  const seed = input.seed ?? createProductionScenarioSeed(input.userId, now);
  const rand = mulberry32(seed);
  const mode = input.mode ?? 'standard';
  const difficulty = input.difficulty ?? defaultDifficultyForMode(mode);
  const focus = input.focus;
  const complexity = clampComplexityForDifficulty(applyFocus(complexityForDifficulty(difficulty), focus), difficulty);
  const regime = pickPrimaryRegime(rand, focus);
  const horizonDays = DEFAULT_HORIZON_DAYS;
  const segments = buildRegimeSegments({
    rand,
    primary: regime,
    horizon: horizonDays,
    uncertainty: complexity.regimeUncertainty,
    difficulty,
  });
  const climate = buildClimate(rand);
  const assets = buildAssets(rand, complexity.assetCount);
  const events = generateScenarioEvents({
    rand,
    assets,
    complexity,
    climate,
    horizonDays,
    preferredKind: input.preferredEventKind,
    difficulty,
  });
  const { marketPath, paths } = generateStructuredPaths({
    seed,
    assets,
    events,
    segments,
    climate,
    complexity,
    primary: regime,
    horizon: horizonDays,
    focus,
    difficulty,
  });
  const draft: SimulationScenario = {
    id: `scn_${seed.toString(16)}`,
    seed,
    engineVersion: 2,
    difficulty,
    regime,
    segments,
    climate,
    complexity,
    friction: frictionForMode(mode, complexity.psychologicalPressure),
    focus,
    assets,
    events,
    decisionWindows: [],
    paths,
    marketPath,
    horizonDays,
    startingDay: 0,
    clockDay: 0,
    clockMode: 'normal',
    createdAt: now,
  };
  draft.decisionWindows = buildDecisionWindows(rand, draft);
  return draft;
}

export function advanceScenarioClock(
  scenario: SimulationScenario,
  days = 1,
  options?: { respectDecisions?: boolean },
): SimulationScenario {
  const horizon = scenario.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const respectDecisions = options?.respectDecisions ?? true;
  const pendingHere = unansweredDecisionWindow(scenario);
  if (respectDecisions && pendingHere && scenario.clockDay >= pendingHere.day) {
    return { ...scenario, clockMode: 'paused' };
  }

  let next = scenario.clockDay;
  let mode: SimulationScenario['clockMode'] = days > 1 ? 'accelerated' : 'normal';
  for (let i = 0; i < days; i += 1) {
    if (next >= horizon - 1) break;
    const upcoming = pendingDecisionOnDay(scenario, next + 1);
    next += 1;
    if (respectDecisions && upcoming) {
      mode = 'paused';
      break;
    }
  }
  const completed = next >= horizon - 1;
  return {
    ...scenario,
    clockDay: Math.min(horizon - 1, Math.max(0, next)),
    clockMode: completed ? 'paused' : mode,
    completedAt: completed ? scenario.completedAt ?? new Date().toISOString() : scenario.completedAt,
  };
}

export function advanceToNextInformation(scenario: SimulationScenario): SimulationScenario {
  const horizon = scenario.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const nextEvent = scenario.events
    .map((event) => event.announceDay)
    .concat((scenario.decisionWindows ?? []).filter((item) => !item.response).map((item) => item.day))
    .filter((day) => day > scenario.clockDay)
    .sort((a, b) => a - b)[0];
  if (nextEvent == null) {
    return advanceScenarioClock(scenario, horizon - 1 - scenario.clockDay);
  }
  return advanceScenarioClock(scenario, nextEvent - scenario.clockDay);
}

export function answerDecisionWindow(
  scenario: SimulationScenario,
  windowId: string,
  option: ScenarioDecisionOption,
  reasoning?: string,
  now = new Date().toISOString(),
): SimulationScenario {
  return {
    ...scenario,
    clockMode: scenario.clockDay >= (scenario.horizonDays ?? DEFAULT_HORIZON_DAYS) - 1 ? 'paused' : 'normal',
    decisionWindows: (scenario.decisionWindows ?? []).map((window) =>
      window.id === windowId
        ? { ...window, response: { option, reasoning: reasoning?.trim() || undefined, at: now } }
        : window,
    ),
  };
}
