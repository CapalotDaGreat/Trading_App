import { FORBIDDEN_MASTERY_TERMS } from '../content/competency-taxonomy';
import type {
  CompetenceState,
  CompetencyMasteryState,
  CompetencyUserLabel,
} from '../types/competency.types';

export const COMPETENCY_DISCLAIMER =
  'These are training indicators of demonstrated process skill inside TradeAcademy’s educational and simulated environment. They are not financial qualifications, not investment advice, and not a prediction.';

export const COMPETENCE_STATE_LABELS: Record<CompetenceState, CompetencyUserLabel> = {
  not_started: 'Not started',
  learning: 'Learning',
  developing: 'Developing',
  demonstrated: 'Demonstrated',
  strong: 'Strong',
  needs_revisit: 'Needs Revisit',
  transfer_unproven: 'Transfer Unproven',
};

/** Machine-state labels kept for older callers. Primary UI should use competenceState. */
export const MASTERY_USER_LABELS: Record<CompetencyMasteryState, CompetencyUserLabel> = {
  not_started: 'Not started',
  learning: 'Learning',
  practiced: 'Developing',
  demonstrated: 'Demonstrated',
  needs_remediation: 'Needs Revisit',
  due_for_redemonstration: 'Needs Revisit',
};

export function userLabelFor(competenceState: CompetenceState): CompetencyUserLabel {
  return COMPETENCE_STATE_LABELS[competenceState];
}

export function assertSafeCopy(text: string): void {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_MASTERY_TERMS) {
    if (lower.includes(term)) {
      throw new Error(`Competency copy must not imply ${term}`);
    }
  }
}
