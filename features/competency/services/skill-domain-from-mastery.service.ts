import type { SkillDomain } from '@/shared/constants/skill-domains';

import type { CompetenceState, CompetencyMastery } from '../types/competency.types';
import { getCompetencyConcept } from './taxonomy.service';

const WEAK_STATES = new Set<CompetenceState>([
  'needs_revisit',
  'transfer_unproven',
  'developing',
  'learning',
]);

const STATE_WEIGHT: Record<CompetenceState, number> = {
  not_started: 4,
  learning: 28,
  developing: 36,
  demonstrated: 0,
  strong: 0,
  needs_revisit: 80,
  transfer_unproven: 55,
};

/**
 * Weakest training domain from the competency ledger — not a second mastery engine.
 * Used by Events / Readiness as a reporting input; the Training Planner still ranks next.
 */
export function weakestSkillDomainFromMastery(mastery: CompetencyMastery[]): SkillDomain | null {
  let best: { domain: SkillDomain; score: number } | null = null;
  for (const row of mastery) {
    if (row.state === 'not_started' && row.competenceState === 'not_started') continue;
    const concept = getCompetencyConcept(row.conceptId);
    if (!concept) continue;
    let score = STATE_WEIGHT[row.competenceState] ?? 0;
    if (row.state === 'needs_remediation') score += 40;
    if (row.falseMastery) score += 12;
    if (WEAK_STATES.has(row.competenceState) || row.state === 'needs_remediation') {
      if (!best || score > best.score) {
        best = { domain: concept.skillDomain, score };
      }
    }
  }
  return best?.domain ?? null;
}
