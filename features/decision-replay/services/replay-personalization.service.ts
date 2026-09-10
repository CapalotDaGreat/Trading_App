import type {
  CompetencyEvidenceRecord,
  CompetencyMastery,
  CompetenceState,
} from '@/features/competency';
import type { ProcessFlags } from '@/features/competency/types/competency.types';
import { scoreAllCompetencyMastery } from '@/features/competency';
import {
  composeMistakeLibrary,
  replayBoostFromMistakeLibrary,
} from '@/features/mistake-library/services/mistake-library.service';
import type { MistakeLibrarySnapshot } from '@/features/mistake-library/types/mistake-library.types';

import type { ReplayPracticeDifficulty } from '../types/replay-scenario.types';
import { REPLAY_CORE_QUESTION } from '../types/replay-scenario.types';

/** Shown before a personalized room. Does not name the skill or a historical “correct” trade. */
export const GENERIC_REPLAY_TRAINING_RATIONALE =
  'This scenario targets a skill you are currently practicing.';

export type ReplayTrainingIntent =
  | 'weak_competency'
  | 'recurring_mistake'
  | 'transfer'
  | 'event_awareness'
  | 'regime_gap'
  | 'retention'
  | 'psychology';

export interface ReplayCatalogEntry {
  id: string;
  conceptIds: string[];
  collections: string[];
  skills: string[];
  eventKind?: string;
  topics?: string[];
  practiceDifficulty: ReplayPracticeDifficulty;
}

export interface ReplayTrainingPlan {
  personalized: boolean;
  intent?: ReplayTrainingIntent;
  preferredConceptIds: string[];
  preferredCollections: string[];
  preferredEventKinds: string[];
  preferredDifficulty?: ReplayPracticeDifficulty;
  preferredEpisodeId?: string;
  trainingRationale?: string;
  coreQuestion: string;
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

function retentionDue(mastery: CompetencyMastery | undefined, now: number): boolean {
  if (!mastery) return false;
  if (mastery.state === 'due_for_redemonstration') return true;
  if (mastery.competenceState !== 'demonstrated' && mastery.competenceState !== 'strong') return false;
  return mastery.nextRedemonstrationAt != null && mastery.nextRedemonstrationAt <= now;
}

export function scoreReplayCatalogMatch(entry: ReplayCatalogEntry, plan: ReplayTrainingPlan): number {
  if (!plan.personalized) return 0;
  let value = 0;
  const concepts = new Set(entry.conceptIds);
  const collections = new Set(entry.collections);
  const skills = entry.skills.join(' ').toLowerCase();
  const topics = (entry.topics ?? []).join(' ').toLowerCase();

  for (const id of plan.preferredConceptIds) {
    if (concepts.has(id) || skills.includes(id.replace(/-/g, '_')) || skills.includes(id)) value += 10;
  }
  for (const collection of plan.preferredCollections) {
    if (collections.has(collection)) value += 6;
  }
  if (entry.eventKind && plan.preferredEventKinds.includes(entry.eventKind)) value += 12;
  if (plan.preferredDifficulty && entry.practiceDifficulty === plan.preferredDifficulty) value += 5;
  if (plan.intent === 'psychology' && (collections.has('psychology') || collections.has('patience'))) value += 8;
  if (plan.intent === 'regime_gap' && (collections.has('regime_changes') || topics.includes('regime'))) value += 8;
  if (plan.intent === 'event_awareness' && (collections.has('earnings') || collections.has('policy') || collections.has('employment'))) {
    value += 8;
  }
  if (plan.intent === 'transfer' && (entry.practiceDifficulty === 'mixed' || entry.practiceDifficulty === 'advanced')) {
    value += 8;
  }
  if (plan.preferredEpisodeId && entry.id === plan.preferredEpisodeId) value += 4;
  return value;
}

/**
 * Chooses a training *context* from learner state.
 * Never selects a guaranteed historical winner or a “correct trade.”
 */
export function personalizeReplayTraining(input: {
  records?: CompetencyEvidenceRecord[];
  mastery?: CompetencyMastery[];
  catalog?: ReplayCatalogEntry[];
  completedIds?: string[];
  now?: number;
  mistakeLibrary?: MistakeLibrarySnapshot;
}): ReplayTrainingPlan {
  const records = input.records ?? [];
  const now = input.now ?? Date.now();
  const mastery = input.mastery ?? (records.length ? scoreAllCompetencyMastery(records, now) : []);
  const completed = new Set(input.completedIds ?? []);
  const library =
    input.mistakeLibrary ??
    (records.length ? composeMistakeLibrary({ uid: records[0]!.uid, records, now }) : undefined);
  const libraryBoost = replayBoostFromMistakeLibrary(library);

  const psychology = Math.max(
    weaknessScore(mastery, records, 'fomo', 'fomoEntry'),
    weaknessScore(mastery, records, 'overconfidence'),
    weaknessScore(mastery, records, 'emotional-decision-making'),
    flagCount(records, 'fomoEntry') >= 2 ? 70 : 0,
  );
  const invalidation = Math.max(
    weaknessScore(mastery, records, 'invalidation', 'missingInvalidation'),
    weaknessScore(mastery, records, 'stop-logic', 'movedInvalidation'),
  );
  const sizing = Math.max(
    weaknessScore(mastery, records, 'position-sizing', 'exceededRiskLimit'),
    weaknessScore(mastery, records, 'risk-per-trade'),
  );
  const eventRisk = Math.max(
    weaknessScore(mastery, records, 'event-risk'),
    weaknessScore(mastery, records, 'information-timing'),
    weaknessScore(mastery, records, 'earnings'),
  );
  const regime = Math.max(
    weaknessScore(mastery, records, 'trend-identification'),
    weaknessScore(mastery, records, 'chart-interpretation'),
  );
  const transfer = mastery.filter((item) => item.competenceState === 'transfer_unproven' || item.falseMastery).length
    ? 60 + mastery.filter((item) => item.falseMastery).length * 8
    : 0;
  const retention = mastery.filter((item) => retentionDue(item, now)).length
    ? 50 + mastery.filter((item) => retentionDue(item, now)).length * 8
    : 0;

  const recurringMistake = Math.max(
    flagCount(records, 'fomoEntry') >= 2 ? psychology : 0,
    flagCount(records, 'missingInvalidation') >= 2 ? invalidation : 0,
    flagCount(records, 'exceededRiskLimit') >= 2 ? sizing : 0,
    libraryBoost.score,
  );

  const scored: Array<{ intent: ReplayTrainingIntent; score: number; concepts: string[]; collections: string[]; events: string[]; difficulty?: ReplayPracticeDifficulty }> = [
    {
      intent: 'recurring_mistake',
      score: recurringMistake,
      concepts: [
        ...(psychology >= invalidation && psychology >= sizing ? ['fomo'] : invalidation >= sizing ? ['invalidation'] : ['position-sizing']),
        ...libraryBoost.concepts,
      ].filter((id, index, all) => all.indexOf(id) === index),
      collections: [
        ...(psychology >= invalidation ? ['psychology'] : ['risk_management']),
        ...libraryBoost.collections,
      ].filter((id, index, all) => all.indexOf(id) === index),
      events: [],
    },
    {
      intent: 'psychology',
      score: psychology,
      concepts: ['fomo', 'overconfidence', 'emotional-decision-making'],
      collections: ['psychology', 'patience', 'manias'],
      events: [],
    },
    {
      intent: 'weak_competency',
      score: Math.max(invalidation, sizing),
      concepts: invalidation >= sizing ? ['invalidation', 'stop-logic'] : ['position-sizing', 'risk-per-trade'],
      collections: ['risk_management', 'false_breakouts'],
      events: [],
    },
    {
      intent: 'event_awareness',
      score: eventRisk,
      concepts: ['event-risk', 'earnings', 'information-timing'],
      collections: ['earnings', 'policy', 'employment'],
      events: ['earnings', 'rate_decision', 'inflation', 'employment'],
      difficulty: 'intermediate',
    },
    {
      intent: 'regime_gap',
      score: regime,
      concepts: ['trend-identification', 'chart-interpretation'],
      collections: ['regime_changes', 'crashes', 'recoveries'],
      events: [],
    },
    {
      intent: 'transfer',
      score: transfer,
      concepts: mastery.filter((item) => item.competenceState === 'transfer_unproven').map((item) => item.conceptId),
      collections: ['uncertainty', 'regime_changes'],
      events: [],
      difficulty: 'mixed',
    },
    {
      intent: 'retention',
      score: retention,
      concepts: mastery.filter((item) => retentionDue(item, now)).map((item) => item.conceptId),
      collections: [],
      events: [],
      difficulty: 'advanced',
    },
  ];

  scored.sort((a, b) => b.score - a.score);
  const lead = scored[0];
  if (!lead || lead.score < 40) {
    return { personalized: false, preferredConceptIds: [], preferredCollections: [], preferredEventKinds: [], coreQuestion: REPLAY_CORE_QUESTION };
  }

  const catalog = input.catalog ?? [];
  const draft: ReplayTrainingPlan = {
    personalized: true,
    intent: lead.intent,
    preferredConceptIds: lead.concepts,
    preferredCollections: lead.collections,
    preferredEventKinds: lead.events,
    preferredDifficulty: lead.difficulty,
    trainingRationale: GENERIC_REPLAY_TRAINING_RATIONALE,
    coreQuestion: REPLAY_CORE_QUESTION,
  };

  const ranked = [...catalog]
    .filter((item) => !completed.has(item.id))
    .sort((a, b) => scoreReplayCatalogMatch(b, draft) - scoreReplayCatalogMatch(a, draft));
  return {
    ...draft,
    preferredEpisodeId: ranked[0] && scoreReplayCatalogMatch(ranked[0], draft) > 0 ? ranked[0].id : undefined,
  };
}
