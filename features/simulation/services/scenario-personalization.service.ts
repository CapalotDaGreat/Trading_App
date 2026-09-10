import type {
  CompetencyEvidenceRecord,
  CompetencyMastery,
  CompetenceState,
} from '@/features/competency';
import type { ProcessFlags } from '@/features/competency/types/competency.types';
import { scoreAllCompetencyMastery } from '@/features/competency';
import {
  composeMistakeLibrary,
  simulationFocusFromMistakeLibrary,
} from '@/features/mistake-library/services/mistake-library.service';
import type { MistakeLibrarySnapshot } from '@/features/mistake-library/types/mistake-library.types';

import type { SimulationAccount } from '../types/simulation.types';
import type { ScenarioEventKind, ScenarioFocus, ScenarioStartOptions } from '../types/scenario.types';
import { inferScenarioFocus } from './scenario-adaptation.service';

/** Shown before a personalized book. Does not name the skill or the “correct” trade. */
export const GENERIC_SIMULATION_TRAINING_RATIONALE =
  'This scenario targets a skill you are currently practicing.';

export interface SimulationTrainingPlan {
  focus?: ScenarioFocus;
  preferredEventKind?: ScenarioEventKind;
  trainingRationale?: string;
  personalized: boolean;
}

const WEAK_STATES = new Set<CompetenceState>([
  'needs_revisit',
  'transfer_unproven',
  'developing',
  'learning',
]);

const STATE_WEIGHT: Record<CompetenceState, number> = {
  not_started: 0,
  learning: 28,
  developing: 36,
  demonstrated: 0,
  strong: 0,
  needs_revisit: 80,
  transfer_unproven: 55,
};

function flagCount(records: CompetencyEvidenceRecord[], flag: keyof ProcessFlags): number {
  return records.filter((item) => item.processMetrics?.flags?.[flag] === true).length;
}

function failCount(records: CompetencyEvidenceRecord[], conceptId: string): number {
  return records.filter((item) => item.conceptId === conceptId && item.result === 'fail').length;
}

function masteryFor(rows: CompetencyMastery[], conceptId: string): CompetencyMastery | undefined {
  return rows.find((item) => item.conceptId === conceptId);
}

function weaknessScore(
  rows: CompetencyMastery[],
  records: CompetencyEvidenceRecord[],
  conceptId: string,
  flag?: keyof ProcessFlags,
): number {
  const mastery = masteryFor(rows, conceptId);
  let score = mastery ? STATE_WEIGHT[mastery.competenceState] : 0;
  score += Math.min(40, failCount(records, conceptId) * 15);
  if (flag) score += Math.min(50, flagCount(records, flag) * 20);
  if (mastery && WEAK_STATES.has(mastery.competenceState) && mastery.falseMastery) score += 12;
  return score;
}

function preferredEventFromLearner(records: CompetencyEvidenceRecord[]): ScenarioEventKind {
  const recent = [...records].sort((a, b) => b.occurredAt - a.occurredAt);
  for (const row of recent) {
    if (row.scenarioContext === 'earnings' || row.conceptId === 'earnings') return 'earnings';
    if (row.conceptId === 'inflation') return 'inflation';
    if (row.conceptId === 'employment') return 'employment';
    if (row.conceptId === 'interest-rates' || row.conceptId === 'central-bank') return 'rate_decision';
    if (row.scenarioContext === 'event_window') return 'rate_decision';
  }
  return 'earnings';
}

function inferFocusFromLearner(
  records: CompetencyEvidenceRecord[],
  mastery: CompetencyMastery[],
  library?: MistakeLibrarySnapshot,
): { focus: ScenarioFocus; eventKind?: ScenarioEventKind } | undefined {
  const scored: Array<{ focus: ScenarioFocus; score: number; eventKind?: ScenarioEventKind }> = [
    {
      focus: 'fomo_chase',
      score: Math.max(
        weaknessScore(mastery, records, 'fomo', 'fomoEntry'),
        weaknessScore(mastery, records, 'emotional-decision-making'),
        flagCount(records, 'fomoEntry') >= 2 ? 70 : 0,
      ),
    },
    {
      focus: 'invalidation_discipline',
      score: Math.max(
        weaknessScore(mastery, records, 'invalidation', 'missingInvalidation'),
        weaknessScore(mastery, records, 'stop-logic', 'movedInvalidation'),
      ),
    },
    {
      focus: 'position_sizing',
      score: Math.max(
        weaknessScore(mastery, records, 'position-sizing', 'exceededRiskLimit'),
        weaknessScore(mastery, records, 'risk-per-trade', 'exceededRiskLimit'),
        weaknessScore(mastery, records, 'volatility-aware-risk'),
      ),
    },
    {
      focus: 'overconfidence',
      score: Math.max(
        weaknessScore(mastery, records, 'overconfidence'),
        weaknessScore(mastery, records, 'confirmation-bias'),
      ),
    },
    {
      focus: 'event_adaptation',
      score: Math.max(
        weaknessScore(mastery, records, 'event-risk'),
        weaknessScore(mastery, records, 'information-timing'),
        weaknessScore(mastery, records, 'event-volatility'),
      ),
      eventKind: preferredEventFromLearner(records),
    },
    {
      focus: 'thesis_discipline',
      score: Math.max(
        weaknessScore(mastery, records, 'thesis', 'missingThesis'),
        weaknessScore(mastery, records, 'uncertainty'),
      ),
    },
  ];

  const fromLibrary = simulationFocusFromMistakeLibrary(library);
  if (fromLibrary) {
    const row = scored.find((item) => item.focus === fromLibrary.focus);
    if (row) row.score = Math.max(row.score, fromLibrary.score);
    else scored.push({ focus: fromLibrary.focus, score: fromLibrary.score });
  }

  scored.sort((a, b) => b.score - a.score);
  const lead = scored[0];
  if (!lead || lead.score < 40) return undefined;
  return lead.focus === 'event_adaptation'
    ? { focus: lead.focus, eventKind: lead.eventKind }
    : { focus: lead.focus };
}

/**
 * Chooses a training *context* from learner state.
 * Never selects a guaranteed winner, loser, or “correct trade”.
 */
export function personalizeSimulationTraining(input: {
  records?: CompetencyEvidenceRecord[];
  mastery?: CompetencyMastery[];
  prior?: SimulationAccount | null;
  explicit?: ScenarioStartOptions;
  mistakeLibrary?: MistakeLibrarySnapshot;
}): SimulationTrainingPlan {
  const records = input.records ?? [];
  const mastery = input.mastery ?? (records.length ? scoreAllCompetencyMastery(records) : []);
  const explicitFocus = input.explicit?.focus;
  const explicitEvent = input.explicit?.preferredEventKind;
  const library =
    input.mistakeLibrary ??
    (records.length ? composeMistakeLibrary({ uid: records[0]!.uid, records, now: Date.now() }) : undefined);
  const inferred = inferFocusFromLearner(records, mastery, library);
  const priorFocus = inferScenarioFocus(input.prior);
  const focus = explicitFocus ?? inferred?.focus ?? priorFocus;

  if (!focus && !explicitEvent) {
    return { personalized: false };
  }

  const preferredEventKind =
    explicitEvent ?? (focus === 'event_adaptation' ? inferred?.eventKind : undefined);
  const personalized = Boolean(explicitFocus || inferred || preferredEventKind);
  return {
    focus,
    preferredEventKind,
    trainingRationale: personalized ? GENERIC_SIMULATION_TRAINING_RATIONALE : undefined,
    personalized,
  };
}
