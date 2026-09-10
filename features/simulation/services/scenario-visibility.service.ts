import type {
  PublicDecisionWindow,
  PublicScenarioEvent,
  PublicScenarioView,
  ScenarioClimate,
  ScenarioDecisionWindow,
  ScenarioEvent,
  SimulationBar,
  SimulationScenario,
} from '../types/scenario.types';
import { averageTrueRange, scenarioBars } from './scenario-path.service';

export function visibleScenarioEvents(scenario: SimulationScenario): ScenarioEvent[] {
  return scenario.events.filter((event) => scenario.clockDay >= event.announceDay);
}

export function resolvedScenarioEvents(scenario: SimulationScenario): ScenarioEvent[] {
  return scenario.events.filter((event) => scenario.clockDay >= event.resolveDay);
}

export function futureScenarioEvents(scenario: SimulationScenario): ScenarioEvent[] {
  return scenario.events.filter((event) => scenario.clockDay < event.announceDay);
}

export function visibleBarsForSymbol(scenario: SimulationScenario, symbol: string): SimulationBar[] {
  return scenarioBars(scenario, symbol, scenario.clockDay);
}

export function unansweredDecisionWindow(scenario: SimulationScenario): ScenarioDecisionWindow | undefined {
  return (scenario.decisionWindows ?? []).find(
    (window) => window.day <= scenario.clockDay && !window.response,
  );
}

export function pendingDecisionOnDay(
  scenario: SimulationScenario,
  day: number,
): ScenarioDecisionWindow | undefined {
  return (scenario.decisionWindows ?? []).find((window) => window.day === day && !window.response);
}

function climateHint(climate: ScenarioClimate | undefined): string {
  if (!climate) return 'Context is incomplete. Infer from the tape you can see.';
  const liquidity =
    climate.liquidity === 'thin'
      ? 'Books look thinner than usual.'
      : climate.liquidity === 'deep'
        ? 'Liquidity looks adequate.'
        : 'Liquidity looks ordinary.';
  const sentiment =
    climate.sentiment === 'complacent'
      ? 'Headlines have been quiet — that is not a forecast.'
      : climate.sentiment === 'mixed'
        ? 'Sentiment reads mixed.'
        : climate.sentiment === 'risk_off'
          ? 'Participants have been cautious.'
          : 'Participants have been willing to own risk — that can change.';
  return `${liquidity} ${sentiment}`;
}

export function observableTapeSummary(scenario: SimulationScenario): string {
  const market = (scenario.marketPath ?? []).slice(0, scenario.clockDay + 1);
  if (market.length < 4) {
    return 'Too little tape to name a condition. Treat the path as unknown.';
  }
  const recent = market.slice(-5);
  const first = recent[0]!.close;
  const last = recent[recent.length - 1]!.close;
  const change = (last - first) / first;
  const atrNow = averageTrueRange(recent, Math.min(5, recent.length));
  const atrPrev = averageTrueRange(market.slice(0, Math.max(2, market.length - 5)), 5);
  const expanding = atrPrev > 0 && atrNow > atrPrev * 1.25;
  const compressing = atrPrev > 0 && atrNow < atrPrev * 0.8;
  const direction =
    change > 0.015 ? 'Recent closes have been firmer.' : change < -0.015 ? 'Recent closes have been softer.' : 'Recent closes have been mixed.';
  const vol = expanding
    ? 'Ranges have been expanding.'
    : compressing
      ? 'Ranges have been compressing.'
      : 'Range width has been uneven.';
  return `${direction} ${vol} That is observation, not a regime label.`;
}

function toPublicEvent(event: ScenarioEvent, clockDay: number): PublicScenarioEvent {
  const resolved = clockDay >= event.resolveDay;
  return {
    id: event.id,
    announceDay: event.announceDay,
    resolveDay: event.resolveDay,
    kind: event.kind,
    title: event.title,
    briefing: event.briefing,
    companyName: event.companyName,
    expectedValue: event.expectedValue,
    resolved,
    actualValue: resolved ? event.actualValue : undefined,
    outcome: resolved ? event.outcome : undefined,
    symbols: event.symbols,
  };
}

function toPublicDecision(window: ScenarioDecisionWindow): PublicDecisionWindow {
  return {
    id: window.id,
    day: window.day,
    kind: window.kind,
    prompt: window.prompt,
    options: window.options,
    response: window.response,
  };
}

export function publicScenarioView(scenario: SimulationScenario): PublicScenarioView {
  const pending = unansweredDecisionWindow(scenario);
  const visibleBars: PublicScenarioView['visibleBars'] = {};
  for (const asset of scenario.assets) {
    visibleBars[asset.symbol] = visibleBarsForSymbol(scenario, asset.symbol).map(({ phase: _phase, ...bar }) => bar);
  }
  return {
    id: scenario.id,
    clockDay: scenario.clockDay,
    horizonDays: scenario.horizonDays ?? scenario.marketPath?.length ?? 0,
    clockMode: scenario.clockMode ?? 'normal',
    observableTape: observableTapeSummary(scenario),
    climateHint: climateHint(scenario.climate),
    assets: scenario.assets.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name ?? asset.symbol,
      sector: asset.sector ?? 'unknown',
      assetType: asset.assetType,
    })),
    visibleBars,
    visibleEvents: visibleScenarioEvents(scenario).map((event) => toPublicEvent(event, scenario.clockDay)),
    pendingDecision: pending ? toPublicDecision(pending) : null,
    completed: Boolean(scenario.completedAt) || scenario.clockDay >= (scenario.horizonDays ?? 0) - 1,
  };
}

/** Assert helper for tests: secrets that must never reach a public view. */
export function publicViewLeaks(view: PublicScenarioView, scenario: SimulationScenario): string[] {
  const blob = JSON.stringify(view);
  const leaks: string[] = [];
  if ('seed' in view) leaks.push('seed');
  if (blob.includes('"phase"')) leaks.push('phase');
  for (const event of futureScenarioEvents(scenario)) {
    if (event.actualValue && blob.includes(event.actualValue)) leaks.push(`future:${event.id}`);
  }
  for (const event of scenario.events) {
    if (scenario.clockDay < event.resolveDay && event.actualValue && blob.includes(event.actualValue)) {
      leaks.push(`unresolved:${event.id}`);
    }
  }
  return leaks;
}
