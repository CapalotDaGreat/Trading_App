import { getCompetencyConcept, resolveCompetencyId } from '@/features/competency';
import type { ScenarioEventKind } from '@/features/simulation/types/scenario.types';

import {
  EVENT_CONCEPT_MAP,
  type EventConceptMapping,
} from '../content/event-concept-map';
import type { MarketEventKind } from '../types/events.types';

export function mappingForEventKind(kind: MarketEventKind): EventConceptMapping {
  return EVENT_CONCEPT_MAP[kind] ?? EVENT_CONCEPT_MAP.other;
}

export function conceptIdsForEventKind(kind: MarketEventKind): string[] {
  return mappingForEventKind(kind).conceptIds;
}

export function displayConceptsForEventKind(kind: MarketEventKind): string[] {
  return mappingForEventKind(kind).displayConcepts;
}

export function scenarioKindForEventKind(kind: MarketEventKind): ScenarioEventKind {
  return mappingForEventKind(kind).scenarioEventKind;
}

/** Every mapped id must exist in the competency taxonomy. */
export function resolvedConceptIdsForEventKind(kind: MarketEventKind): string[] {
  const resolved: string[] = [];
  for (const id of conceptIdsForEventKind(kind)) {
    const canonical = resolveCompetencyId(id);
    if (canonical) resolved.push(canonical);
  }
  return [...new Set(resolved)];
}

export function conceptTitlesForEventKind(kind: MarketEventKind): string[] {
  return resolvedConceptIdsForEventKind(kind).map((id) => getCompetencyConcept(id)?.title ?? id);
}

export function eventConceptChain(kind: MarketEventKind): {
  eventKind: MarketEventKind;
  conceptIds: string[];
  riskConceptIds: string[];
  psychologyConceptIds: string[];
  scenarioEventKind: ScenarioEventKind;
} {
  const mapping = mappingForEventKind(kind);
  return {
    eventKind: kind,
    conceptIds: resolvedConceptIdsForEventKind(kind),
    riskConceptIds: mapping.riskConceptIds.filter((id) => resolveCompetencyId(id)),
    psychologyConceptIds: mapping.psychologyConceptIds.filter((id) => resolveCompetencyId(id)),
    scenarioEventKind: mapping.scenarioEventKind,
  };
}
