import { FORBIDDEN_MASTERY_TERMS } from '../content/competency-taxonomy';
import type { CompetencyMasteryState, CompetencyUserLabel } from '../types/competency.types';

export const COMPETENCY_DISCLAIMER =
  'These are training indicators of demonstrated process skill inside TradeAcademy’s educational and simulated environment. They are not financial qualifications, not investment advice, and not a prediction.';

export const MASTERY_USER_LABELS: Record<CompetencyMasteryState, CompetencyUserLabel> = {
  not_started: 'Not started',
  learning: 'Developing',
  practiced: 'Practiced',
  demonstrated: 'Demonstrated',
  needs_remediation: 'Needs more practice',
  due_for_redemonstration: 'Due for review',
};

export function userLabelFor(
  state: CompetencyMasteryState,
  independentDemonstrationCount: number,
  strength: number | null,
): CompetencyUserLabel {
  if (state === 'practiced' && (independentDemonstrationCount < 2 || (strength ?? 0) < 55)) {
    return 'Developing';
  }
  return MASTERY_USER_LABELS[state];
}

export function assertSafeCopy(text: string): void {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_MASTERY_TERMS) {
    if (lower.includes(term)) {
      throw new Error(`Competency copy must not imply ${term}`);
    }
  }
}
