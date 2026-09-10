import { SURPRISE_REPLAY_IDS } from '@/features/competency/content/activity-concept-map';
import { CONTEXT_HREFS } from '@/features/competency/content/remediation-catalog';
import {
  detectFalseMastery,
  isApplicationSource,
  isExposureOnlyRecord,
  isIndependentEvidence,
  scoreTransferEvidence,
  selectTransferContext,
} from '@/features/competency';
import type {
  CompetencyEvidenceRecord,
  CompetencyMastery,
  TransferKind,
} from '@/features/competency';
import { replayTvEpisodeHref } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import type { MentorExperienceLevel } from '@/features/onboarding/types/mentor-setup.types';
import { PRACTICE_DRILLS, type PracticeDrill } from '@/features/practice/content/practice-drills';

import type {
  AdaptiveStage,
  DifficultyDimensions,
  PracticeTransferStep,
  ScaffoldingPolicy,
  TargetComplexity,
} from '../types/learning-engine.types';
import type { ConceptEvidenceSlice } from './learning-evidence.service';
import { getConcept } from './learning-graph.service';

const DAY = 24 * 60 * 60 * 1000;
const BEGINNER = new Set<MentorExperienceLevel>(['completely_new', 'beginner']);

export const TRANSFER_STEPS: PracticeTransferStep[] = [
  'same_format',
  'new_example',
  'new_condition',
  'new_asset',
  'mixed_concept',
  'concealed_scenario',
];

const SURPRISE_EPISODES = [...SURPRISE_REPLAY_IDS];

const MIXED_SIM_HREFS = [
  '/simulate?start=1&focus=event_adaptation',
  '/simulate?start=1&focus=uncertainty',
  '/simulate?start=1&prep=macro',
];

const ASSET_SIM_HREFS = ['/simulate?start=1&focus=correlation', '/simulate?start=1&prep=earnings'];

export interface AdaptivePickOptions {
  excludeSourceIds?: string[];
  rotationSalt?: number;
  recentActivityKeys?: string[];
}

export interface AdaptivePracticeSelection {
  stage: AdaptiveStage;
  transferStep: PracticeTransferStep;
  complexity: TargetComplexity;
  scaffolding: ScaffoldingPolicy;
  dimensions: DifficultyDimensions;
  activityKind: 'lesson' | 'practice' | 'replay' | 'simulation';
  href: string;
  reason: string;
  concealConcept: boolean;
  surpriseAssessment: boolean;
  falseMastery: boolean;
  showHints: boolean;
  showExamples: boolean;
}

export interface SurpriseAssessmentOffer {
  href: string;
  episodeId: string;
  conceptIds: string[];
  reason: string;
  concealConcept: true;
}

/**
 * Raise conceptual complexity after consistent success.
 * Lower it after struggle. Do not pad copy.
 */
export function targetComplexityFor(slice: ConceptEvidenceSlice | undefined): TargetComplexity {
  if (!slice) return 'foundations';
  const n = slice.drillRecentTotal || slice.drillAttempts;
  const hits = slice.drillRecentTotal ? slice.drillCorrectRecent : Math.max(0, slice.drillAttempts - slice.drillMisses);
  if (n < 2) return 'foundations';
  const accuracy = hits / n;
  if (accuracy >= 0.8 && n >= 3) return 'complex';
  if (accuracy < 0.5) return 'foundations';
  return 'applied';
}

export function complexityForStage(stage: AdaptiveStage): TargetComplexity {
  if (stage === 'guided_recognition') return 'foundations';
  if (stage === 'independent_application' || stage === 'unfamiliar_application') return 'applied';
  return 'complex';
}

export function stageToPracticeRank(stage: AdaptiveStage): number {
  if (stage === 'guided_recognition') return 0;
  if (stage === 'independent_application') return 1;
  if (stage === 'unfamiliar_application') return 2;
  if (stage === 'mixed_complexity') return 3;
  return 4;
}

function activityKeyOf(href: string): string {
  const [path, query] = href.split('?');
  if (!query) return path;
  const params = new URLSearchParams(query);
  const keep = new URLSearchParams();
  for (const name of ['drill', 'episode', 'prep', 'focus', 'start'] as const) {
    const value = params.get(name);
    if (value) keep.set(name, value);
  }
  const qs = keep.toString();
  return qs ? `${path}?${qs}` : path;
}

function sourceIdFromHref(href: string): string | null {
  const query = href.split('?')[1];
  if (!query) return null;
  const params = new URLSearchParams(query);
  return params.get('drill') ?? params.get('episode') ?? params.get('focus') ?? params.get('prep');
}

function rotationIndex(length: number, salt: number): number {
  if (length <= 0) return 0;
  const mixed = Math.imul(salt ^ 0x9e3779b9, 2654435761) >>> 0;
  return mixed % length;
}

function pickRotated<T>(items: T[], salt: number, exclude: (item: T) => boolean = () => false): T | undefined {
  if (!items.length) return undefined;
  const usable = items.filter((item) => !exclude(item));
  const pool = usable.length ? usable : items;
  return pool[rotationIndex(pool.length, salt)] ?? pool[0];
}

function independentPasses(records: readonly CompetencyEvidenceRecord[]): CompetencyEvidenceRecord[] {
  return records.filter(
    (item) =>
      !isExposureOnlyRecord(item) &&
      isIndependentEvidence(item) &&
      item.result === 'pass' &&
      (isApplicationSource(item.sourceType) ||
        item.sourceType === 'practice_drill' ||
        item.sourceType === 'calculation_exercise' ||
        item.sourceType === 'applied_exercise'),
  );
}

function consecutiveFails(records: readonly CompetencyEvidenceRecord[]): number {
  const graded = records
    .filter((item) => !isExposureOnlyRecord(item) && (item.result === 'pass' || item.result === 'fail'))
    .sort((a, b) => a.occurredAt - b.occurredAt);
  let count = 0;
  for (let i = graded.length - 1; i >= 0; i -= 1) {
    if (graded[i]?.result !== 'fail') break;
    count += 1;
  }
  return count;
}

function independentSuccessStreak(records: readonly CompetencyEvidenceRecord[]): number {
  const graded = records
    .filter((item) => !isExposureOnlyRecord(item) && (item.result === 'pass' || item.result === 'fail'))
    .sort((a, b) => a.occurredAt - b.occurredAt);
  let count = 0;
  for (let i = graded.length - 1; i >= 0; i -= 1) {
    const item = graded[i]!;
    if (item.result !== 'pass' || !isIndependentEvidence(item)) break;
    count += 1;
  }
  return count;
}

function failedSourceIds(records: readonly CompetencyEvidenceRecord[]): string[] {
  return records.filter((item) => item.result === 'fail').slice(-4).map((item) => item.sourceId);
}

export function adaptiveStageFor(
  mastery: CompetencyMastery | undefined,
  records: readonly CompetencyEvidenceRecord[],
): AdaptiveStage {
  if (!mastery || mastery.state === 'not_started' || mastery.state === 'learning') {
    return 'guided_recognition';
  }
  const independent = independentPasses(records);
  const transfer = scoreTransferEvidence(records);
  const falseMastery = detectFalseMastery(records).detected;
  const fails = consecutiveFails(records);

  if (independent.length === 0) {
    const graded = records.some(
      (item) => item.result === 'pass' || item.result === 'fail' || item.result === 'partial',
    );
    return graded ? 'independent_application' : 'guided_recognition';
  }

  if (mastery.state === 'needs_remediation') {
    return fails >= 4 ? 'guided_recognition' : 'independent_application';
  }
  if (falseMastery || !transfer.proven) return 'unfamiliar_application';
  if (mastery.state === 'due_for_redemonstration') return 'deliberate_practice';
  if (mastery.state === 'demonstrated' || mastery.competenceState === 'strong') {
    if (independent.length >= 3 && transfer.proven) return 'deliberate_practice';
    return 'mixed_complexity';
  }
  return 'unfamiliar_application';
}

export function nextTransferStep(
  records: readonly CompetencyEvidenceRecord[],
  options?: { struggling?: boolean; falseMastery?: boolean },
): PracticeTransferStep {
  const applied = independentPasses(records);
  const transfer = scoreTransferEvidence(records);
  const last = applied.at(-1);
  const sourceIds = new Set(applied.map((item) => item.sourceId));
  const fails = consecutiveFails(records);
  const struggling = Boolean(options?.struggling) || fails >= 2;

  let step: PracticeTransferStep = 'same_format';
  if (applied.length === 0) {
    step = 'same_format';
  } else if (sourceIds.size < 2 && transfer.formats.length < 2) {
    step = 'new_example';
  } else if (transfer.contexts.filter((ctx) => ctx !== 'standard').length < 2) {
    step = 'new_condition';
  } else if (transfer.assetClasses.length < 2) {
    step = 'new_asset';
  } else if (transfer.mixedConceptSourceIds.length < 1) {
    step = 'mixed_concept';
  } else {
    step = 'concealed_scenario';
  }

  if (options?.falseMastery && (step === 'same_format' || step === 'new_example')) {
    step = 'new_condition';
  }

  if (struggling) {
    const index = Math.max(0, TRANSFER_STEPS.indexOf(step) - 1);
    const pulled = TRANSFER_STEPS[index] ?? 'same_format';
    if (last && pulled === 'same_format') return 'new_example';
    return pulled;
  }
  return step;
}

export function transferKindFromStep(step: PracticeTransferStep): TransferKind {
  return step;
}

export function difficultyDimensionsFor(
  stage: AdaptiveStage,
  step: PracticeTransferStep,
  scaffolding: ScaffoldingPolicy,
): DifficultyDimensions {
  const competing: 0 | 1 | 2 =
    step === 'concealed_scenario' || step === 'mixed_concept' ? 2 : step === 'new_asset' || step === 'new_condition' ? 1 : 0;
  const information: DifficultyDimensions['information'] = scaffolding.incompleteInformation
    ? scaffolding.competingExplanations
      ? 'ambiguous'
      : 'partial'
    : 'obvious';
  const scaffold: DifficultyDimensions['scaffolding'] = scaffolding.showHints && scaffolding.showExamples
    ? scaffolding.guidedQuestions
      ? 'full'
      : 'hints'
    : scaffolding.showExamples
      ? 'examples_only'
      : 'none';
  return {
    scaffolding: scaffold,
    information,
    competingConcepts: competing,
    timePressure: scaffolding.timePressure,
    eventContext: step === 'mixed_concept' || step === 'concealed_scenario' || stage === 'deliberate_practice',
    conflictingEvidence: scaffolding.competingExplanations,
    unfamiliarAsset: step === 'new_asset' || step === 'concealed_scenario',
    regimeShift: step === 'new_condition' || step === 'mixed_concept' || step === 'concealed_scenario',
    simultaneousRisks: competing === 2 ? 3 : competing === 1 ? 2 : 1,
  };
}

function drillsForConcept(conceptId: string): PracticeDrill[] {
  const node = getConcept(conceptId);
  const ids = node?.drillIds ?? [];
  return ids
    .map((id) => PRACTICE_DRILLS.find((drill) => drill.id === id))
    .filter((drill): drill is PracticeDrill => Boolean(drill));
}

export function pickDrillForConcept(
  conceptId: string,
  complexity: TargetComplexity,
  options: AdaptivePickOptions = {},
): PracticeDrill | undefined {
  const drills = drillsForConcept(conceptId);
  if (drills.length === 0) return undefined;
  const excluded = new Set(options.excludeSourceIds ?? []);
  const salt = options.rotationSalt ?? 0;

  const byDifficulty =
    complexity === 'foundations'
      ? drills.filter((drill) => drill.difficulty === 'beginner')
      : complexity === 'complex'
        ? drills.filter((drill) => drill.difficulty === 'intermediate')
        : drills;
  const pool = (byDifficulty.length ? byDifficulty : drills).filter((drill) => !excluded.has(drill.id));
  const usable = pool.length ? pool : drills.filter((drill) => !excluded.has(drill.id));
  const finalPool = usable.length ? usable : drills;
  if (complexity === 'foundations' && salt === 0 && !options.excludeSourceIds?.length) {
    return drills.find((drill) => drill.difficulty === 'beginner') ?? drills[0];
  }
  if (complexity === 'complex' && salt === 0 && !options.excludeSourceIds?.length) {
    return drills.find((drill) => drill.difficulty === 'intermediate') ?? drills[drills.length - 1];
  }
  if (complexity === 'applied' && salt === 0 && !options.excludeSourceIds?.length) {
    return drills[Math.min(1, drills.length - 1)] ?? drills[0];
  }
  return pickRotated(finalPool, salt) ?? finalPool[0];
}

export function pickReplayForConcept(
  conceptId: string,
  complexity: TargetComplexity,
  options: AdaptivePickOptions = {},
): string | undefined {
  const node = getConcept(conceptId);
  if (!node?.replayIds.length) return undefined;
  const excluded = new Set(options.excludeSourceIds ?? []);
  const salt = options.rotationSalt ?? 0;
  const ids = node.replayIds.filter((id) => !excluded.has(id));
  const pool = ids.length ? ids : node.replayIds;
  if (complexity === 'foundations' && salt === 0 && !options.excludeSourceIds?.length) {
    return node.replayIds[0];
  }
  if (salt === 0 && !options.excludeSourceIds?.length) {
    return node.replayIds[node.replayIds.length - 1];
  }
  return pickRotated(pool, salt) ?? pool[0];
}

function hrefForStep(input: {
  conceptId: string;
  step: PracticeTransferStep;
  complexity: TargetComplexity;
  records: readonly CompetencyEvidenceRecord[];
  options: AdaptivePickOptions;
}): { href: string; activityKind: AdaptivePracticeSelection['activityKind'] } {
  const { conceptId, step, complexity, records, options } = input;
  const recent = options.recentActivityKeys ?? [];
  const excluded = [
    ...(options.excludeSourceIds ?? []),
    ...failedSourceIds(records),
  ];
  const salt = options.rotationSalt ?? records.length;
  const node = getConcept(conceptId);
  const context = selectTransferContext(conceptId, records);
  const contextHref = CONTEXT_HREFS[context];

  const unused = (hrefs: string[]) => hrefs.filter((href) => !recent.includes(activityKeyOf(href)));

  if (step === 'same_format' || step === 'new_example') {
    const drill = pickDrillForConcept(conceptId, complexity, { excludeSourceIds: excluded, rotationSalt: salt });
    if (drill && !excluded.includes(drill.id)) {
      return { href: `/practice?drill=${drill.id}`, activityKind: 'practice' };
    }
    const lessonId = node?.lessonIds[0];
    if (lessonId && step === 'same_format') {
      return { href: `/academy/lesson/${lessonId}`, activityKind: 'lesson' };
    }
  }

  if (step === 'new_condition') {
    const hrefs = unused([contextHref, `/simulate?start=1&focus=position_sizing`, '/simulate?start=1']).filter(
      (href) => !excluded.includes(sourceIdFromHref(href) ?? ''),
    );
    const picked = pickRotated(hrefs.length ? hrefs : [contextHref, '/simulate?start=1'], salt);
    return { href: picked ?? '/simulate?start=1', activityKind: 'simulation' };
  }

  if (step === 'new_asset') {
    const replay = pickReplayForConcept('fx', 'complex', { excludeSourceIds: excluded, rotationSalt: salt });
    const hrefs = unused([
      replay ? replayTvEpisodeHref(replay) : '',
      ...ASSET_SIM_HREFS,
      node?.simulateHref ?? '/simulate?start=1',
    ]).filter(Boolean);
    const picked = pickRotated(hrefs.length ? hrefs : ASSET_SIM_HREFS, salt + 3);
    return {
      href: picked ?? '/simulate?start=1',
      activityKind: picked?.includes('replay-tv') ? 'replay' : 'simulation',
    };
  }

  if (step === 'mixed_concept') {
    const hrefs = unused([...MIXED_SIM_HREFS, contextHref]);
    const picked = pickRotated(hrefs.length ? hrefs : MIXED_SIM_HREFS, salt + 5);
    return { href: picked ?? MIXED_SIM_HREFS[0]!, activityKind: 'simulation' };
  }

  const surprise = pickRotated(
    SURPRISE_EPISODES.filter((id) => !excluded.includes(id)),
    salt + 7,
  );
  if (surprise) {
    return { href: replayTvEpisodeHref(surprise), activityKind: 'replay' };
  }
  return { href: '/simulate?start=1', activityKind: 'simulation' };
}

function reasonFor(input: {
  stage: AdaptiveStage;
  step: PracticeTransferStep;
  falseMastery: boolean;
  struggling: boolean;
  conceal: boolean;
  misconception?: string | null;
}): string {
  if (input.conceal) {
    return 'A mixed situation using skills you have already practiced. This is a check, not a penalty. Process quality is the grade — not simulated P/L.';
  }
  if (input.falseMastery) {
    return 'You demonstrated this skill in familiar settings. This activity asks for the same process in an unfamiliar context.';
  }
  if (input.struggling) {
    const misconception = input.misconception
      ? ` Likely process pattern: ${input.misconception}.`
      : '';
    return `This area still needs practice.${misconception} Hints stay available. The next attempt uses a different example — not the same question.`;
  }
  if (input.step === 'new_example') return 'Same skill, a different example. Reading the first prompt was not enough.';
  if (input.step === 'new_condition') return 'Apply the same process under a different market condition.';
  if (input.step === 'new_asset') return 'Apply the same process on a different asset type.';
  if (input.step === 'mixed_concept') return 'More than one concept is in play. Name the process before acting.';
  if (input.step === 'concealed_scenario') {
    return 'The skill is inside a broader scenario and is not named. Process quality is the grade.';
  }
  if (input.stage === 'independent_application') {
    return 'You have seen the idea. The next step is an independent check — hints can fade when you are ready.';
  }
  return 'Start with a guided example of the idea, then apply it yourself.';
}

/**
 * Adaptive activity for Academy, Practice, Replay, or Simulation.
 * Struggle changes context and restores scaffolding; it does not loop the same prompt.
 */
export function selectAdaptivePractice(input: {
  conceptId: string;
  records: readonly CompetencyEvidenceRecord[];
  mastery?: CompetencyMastery;
  experience?: MentorExperienceLevel | null;
  recentActivityKeys?: string[];
  now?: number;
  scaffolding: ScaffoldingPolicy;
}): AdaptivePracticeSelection {
  const records = input.records;
  const falseMastery = detectFalseMastery(records);
  const fails = consecutiveFails(records);
  const struggling = fails >= 2;
  const stage = adaptiveStageFor(input.mastery, records);
  const step = nextTransferStep(records, { struggling, falseMastery: falseMastery.detected });
  const complexity = complexityForStage(stage);
  const salt =
    (input.now != null ? Math.floor(input.now / DAY) : 0) +
    records.length +
    (input.recentActivityKeys?.length ?? 0);
  const picked = hrefForStep({
    conceptId: input.conceptId,
    step,
    complexity: struggling ? 'foundations' : complexity,
    records,
    options: {
      excludeSourceIds: failedSourceIds(records),
      rotationSalt: salt,
      recentActivityKeys: input.recentActivityKeys,
    },
  });

  const conceal =
    input.scaffolding.concealConcept ||
    step === 'concealed_scenario' ||
    (stage === 'deliberate_practice' && !struggling && !BEGINNER.has(input.experience ?? 'beginner'));

  const dimensions = difficultyDimensionsFor(stage, step, input.scaffolding);
  const surpriseAssessment = Boolean(
    conceal && (picked.href.includes('surprise') || SURPRISE_EPISODES.some((id) => picked.href.includes(id))),
  );

  return {
    stage,
    transferStep: step,
    complexity: struggling ? 'foundations' : complexity,
    scaffolding: input.scaffolding,
    dimensions,
    activityKind: picked.activityKind,
    href: picked.href,
    reason: reasonFor({
      stage,
      step,
      falseMastery: falseMastery.detected,
      struggling,
      conceal,
      misconception: input.mastery?.remediation?.misconception?.label,
    }),
    concealConcept: conceal,
    surpriseAssessment,
    falseMastery: falseMastery.detected,
    showHints: struggling ? true : input.scaffolding.showHints,
    showExamples: struggling ? true : input.scaffolding.showExamples,
  };
}

export function shouldOfferSurpriseAssessment(input: {
  mastery: CompetencyMastery[];
  records: readonly CompetencyEvidenceRecord[];
  now: number;
  experience?: MentorExperienceLevel | null;
}): boolean {
  if (input.experience && BEGINNER.has(input.experience)) return false;
  const demonstrated = input.mastery.filter(
    (row) =>
      row.state === 'demonstrated' ||
      row.competenceState === 'demonstrated' ||
      row.competenceState === 'strong',
  );
  if (demonstrated.length < 2) return false;
  if (input.mastery.some((row) => row.state === 'needs_remediation')) return false;
  const last = input.records.slice().sort((a, b) => a.occurredAt - b.occurredAt).at(-1);
  if (last?.result === 'fail') return false;
  const lastSurprise = input.records
    .filter((item) => item.sourceType === 'surprise_assessment')
    .sort((a, b) => a.occurredAt - b.occurredAt)
    .at(-1);
  if (lastSurprise && input.now - lastSurprise.occurredAt < 7 * DAY) return false;
  return Math.floor(input.now / DAY) % 4 === 1;
}

export function pickSurpriseAssessment(input: {
  mastery: CompetencyMastery[];
  now: number;
}): SurpriseAssessmentOffer | null {
  const demonstrated = input.mastery
    .filter(
      (row) =>
        row.state === 'demonstrated' ||
        row.competenceState === 'demonstrated' ||
        row.competenceState === 'strong',
    )
    .map((row) => row.conceptId);
  if (demonstrated.length < 2) return null;
  const episodeId = pickRotated(SURPRISE_EPISODES, Math.floor(input.now / DAY)) ?? SURPRISE_EPISODES[0]!;
  return {
    href: replayTvEpisodeHref(episodeId),
    episodeId,
    conceptIds: demonstrated.slice(0, 3),
    reason:
      'A mixed situation using skills you have already practiced. This is a check, not a penalty. The specific competencies are not named.',
    concealConcept: true,
  };
}

export function independentSuccessStreakOf(records: readonly CompetencyEvidenceRecord[]): number {
  return independentSuccessStreak(records);
}

export function consecutiveFailCount(records: readonly CompetencyEvidenceRecord[]): number {
  return consecutiveFails(records);
}
