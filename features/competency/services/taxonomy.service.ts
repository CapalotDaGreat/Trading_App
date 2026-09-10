import {
  COMPETENCY_CONCEPTS,
  COMPETENCY_FAMILIES,
  FORBIDDEN_MASTERY_TERMS,
  REQUIRED_CONCEPT_GROUPS,
} from '../content/competency-taxonomy';
import type { CompetencyConcept, CompetencyFamily, TaxonomyValidation } from '../types/competency.types';

const BY_ID = new Map(COMPETENCY_CONCEPTS.map((item) => [item.id, item]));

const ALIAS_TO_ID = new Map<string, string>();
for (const item of COMPETENCY_CONCEPTS) {
  for (const alias of item.aliases) {
    ALIAS_TO_ID.set(alias, item.id);
  }
}

export function allCompetencyConcepts(): CompetencyConcept[] {
  return COMPETENCY_CONCEPTS;
}

export function getCompetencyConcept(id: string): CompetencyConcept | undefined {
  const resolved = resolveCompetencyId(id);
  return resolved ? BY_ID.get(resolved) : undefined;
}

/**
 * Resolves a legacy Academy / graph id onto the canonical concept id.
 * Returns null when the id is unknown.
 */
export function resolveCompetencyId(id: string): string | null {
  if (BY_ID.has(id)) return id;
  return ALIAS_TO_ID.get(id) ?? null;
}

export function conceptsInFamily(family: CompetencyFamily): CompetencyConcept[] {
  return COMPETENCY_CONCEPTS.filter(
    (item) => item.family === family || item.secondaryFamilies?.includes(family),
  );
}

export function validateTaxonomy(): TaxonomyValidation {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const item of COMPETENCY_CONCEPTS) {
    if (seen.has(item.id)) errors.push(`Duplicate concept id: ${item.id}`);
    seen.add(item.id);
    if (!item.title.trim()) errors.push(`${item.id} is missing a title`);
    if (!item.description.trim()) errors.push(`${item.id} is missing a description`);
    for (const related of item.relatedIds) {
      if (!BY_ID.has(related) && !ALIAS_TO_ID.has(related)) {
        errors.push(`${item.id} relatedIds references unknown id: ${related}`);
      }
    }
    for (const alias of item.aliases) {
      if (BY_ID.has(alias) && alias !== item.id) {
        errors.push(`${item.id} alias "${alias}" collides with a canonical id`);
      }
      const owner = ALIAS_TO_ID.get(alias);
      if (owner && owner !== item.id) {
        errors.push(`Alias "${alias}" maps to both ${owner} and ${item.id}`);
      }
    }
    const blob = `${item.title} ${item.description}`.toLowerCase();
    for (const term of FORBIDDEN_MASTERY_TERMS) {
      if (blob.includes(term)) {
        errors.push(`${item.id} uses forbidden mastery language: ${term}`);
      }
    }
  }

  for (const family of COMPETENCY_FAMILIES) {
    const ids = REQUIRED_CONCEPT_GROUPS[family];
    for (const id of ids) {
      const node = getCompetencyConcept(id);
      if (!node) {
        errors.push(`Required ${family} concept missing: ${id}`);
        continue;
      }
      if (node.family !== family && !node.secondaryFamilies?.includes(family)) {
        errors.push(`${id} is required in ${family} but is filed under ${node.family}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
