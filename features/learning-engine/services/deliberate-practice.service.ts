import { getCompetencyConcept, isExposureOnlyRecord, isIndependentEvidence } from '@/features/competency';
import type {
  CompetencyEvidenceRecord,
  CompetencyFamily,
  CompetencyMastery,
} from '@/features/competency';
import type { MentorExperienceLevel } from '@/features/onboarding/types/mentor-setup.types';

import type {
  EasySessionGrinding,
  PracticeStage,
  PracticeStagePolicy,
  PracticeTransferStep,
  ScaffoldingPolicy,
  TargetComplexity,
  TrainingLoopStep,
  TrainingQueueItem,
} from '../types/learning-engine.types';
import { getConcept } from './learning-graph.service';

const DAY = 24 * 60 * 60 * 1000;
const BEGINNER = new Set<MentorExperienceLevel>(['completely_new', 'beginner']);
const ADVANCED = new Set<MentorExperienceLevel>(['advanced', 'professional']);

const STAGE_RANK: Record<PracticeStage, number> = {
  foundation: 0,
  application: 1,
  integration: 2,
  deliberate: 3,
  maintenance: 4,
};

export const PRACTICE_STAGE_LABELS: Record<PracticeStage, string> = {
  foundation: 'Foundation',
  application: 'Application',
  integration: 'Integration',
  deliberate: 'Deliberate practice',
  maintenance: 'Maintenance',
};

const ASSESS_COPY = 'Assess this situation and make your decision.';

const TRANSFER_LADDER: PracticeTransferStep[] = [
  'same_format',
  'new_example',
  'new_condition',
  'new_asset',
  'mixed_concept',
  'concealed_scenario',
];

const COMPLEXITY_RANK: Record<TargetComplexity, number> = {
  foundations: 0,
  applied: 1,
  complex: 2,
};

export function conservativePracticeStage(user: PracticeStage, concept: PracticeStage): PracticeStage {
  return STAGE_RANK[concept] < STAGE_RANK[user] ? concept : user;
}

export function practiceStagePolicy(stage: PracticeStage): PracticeStagePolicy {
  switch (stage) {
    case 'foundation':
      return {
        stage,
        complexity: 'foundations',
        preferredLoop: 'learn',
        reviewIntervalMultiplier: 0.8,
        minTransferStep: 'same_format',
        interleaveRelated: false,
        concealByDefault: false,
      };
    case 'application':
      return {
        stage,
        complexity: 'applied',
        preferredLoop: 'practice',
        reviewIntervalMultiplier: 0.9,
        minTransferStep: 'new_example',
        interleaveRelated: false,
        concealByDefault: false,
      };
    case 'integration':
      return {
        stage,
        complexity: 'applied',
        preferredLoop: 'apply',
        reviewIntervalMultiplier: 1,
        minTransferStep: 'new_condition',
        interleaveRelated: true,
        concealByDefault: false,
      };
    case 'deliberate':
      return {
        stage,
        complexity: 'complex',
        preferredLoop: 'apply',
        reviewIntervalMultiplier: 1.15,
        minTransferStep: 'mixed_concept',
        interleaveRelated: true,
        concealByDefault: true,
      };
    case 'maintenance':
    default:
      return {
        stage: 'maintenance',
        complexity: 'complex',
        preferredLoop: 'redemonstrate',
        reviewIntervalMultiplier: 1,
        minTransferStep: 'concealed_scenario',
        interleaveRelated: true,
        concealByDefault: true,
      };
  }
}

export function minComplexity(a: TargetComplexity, b: TargetComplexity): TargetComplexity {
  return COMPLEXITY_RANK[a] <= COMPLEXITY_RANK[b] ? a : b;
}

export function laterTransferStep(
  current: PracticeTransferStep | undefined,
  floor: PracticeTransferStep,
): PracticeTransferStep {
  const currentRank = current ? TRANSFER_LADDER.indexOf(current) : -1;
  const floorRank = TRANSFER_LADDER.indexOf(floor);
  if (currentRank < 0) return floor;
  return TRANSFER_LADDER[Math.max(currentRank, floorRank)] ?? floor;
}

export function preferredLoopForStage(stage: PracticeStage): TrainingLoopStep {
  return practiceStagePolicy(stage).preferredLoop;
}

export function isBeginnerExperience(experience: MentorExperienceLevel | null | undefined): boolean {
  return !experience || BEGINNER.has(experience);
}

export function conceptPracticeStage(row: CompetencyMastery): PracticeStage {
  if (row.state === 'not_started' || row.state === 'learning') return 'foundation';
  if (row.state === 'needs_remediation') return 'application';
  if (row.state === 'due_for_redemonstration') return 'maintenance';
  if (row.state === 'demonstrated') {
    if ((row.quality.recency ?? 100) < 45) return 'maintenance';
    return 'deliberate';
  }
  if (row.missingRoles.includes('application') || row.contextCount < 1) return 'application';
  return 'integration';
}

export function overallPracticeStage(input: {
  competency: CompetencyMastery[];
  evidence: CompetencyEvidenceRecord[];
  experience?: MentorExperienceLevel | null;
}): PracticeStage {
  const active = input.competency.filter((row) => row.state !== 'not_started');
  if (active.length === 0 && input.evidence.length === 0) return 'foundation';

  const grinding = detectEasySessionGrinding(input.evidence, input.evidence.at(-1)?.occurredAt ?? Date.now());
  const stages = active.map(conceptPracticeStage);
  const highest = stages.reduce<PracticeStage>(
    (max, stage) => (STAGE_RANK[stage] > STAGE_RANK[max] ? stage : max),
    'foundation',
  );

  const independentApps = input.evidence.filter(
    (item) =>
      !isExposureOnlyRecord(item) &&
      isIndependentEvidence(item) &&
      (item.sourceType === 'replay_decision' ||
        item.sourceType === 'simulation_decision' ||
        item.sourceType === 're_demonstration' ||
        item.sourceType === 'transfer_exercise' ||
        item.sourceType === 'applied_exercise') &&
      item.result === 'pass',
  ).length;
  const demonstrated = active.filter((row) => row.state === 'demonstrated' || row.state === 'due_for_redemonstration');
  const due = active.some((row) => row.state === 'due_for_redemonstration');

  if (isBeginnerExperience(input.experience) && demonstrated.length < 2) {
    return independentApps > 0 ? 'application' : 'foundation';
  }
  if (grinding.grinding && independentApps < 2) {
    return STAGE_RANK[highest] >= STAGE_RANK.application ? 'application' : 'foundation';
  }
  if (due && demonstrated.length >= 2) return 'maintenance';
  if (demonstrated.length >= 3 && independentApps >= 3) return highest === 'maintenance' ? 'maintenance' : 'deliberate';
  if (independentApps >= 2 && demonstrated.length >= 1) return STAGE_RANK[highest] >= STAGE_RANK.integration ? highest : 'integration';
  if (active.some((row) => row.state === 'practiced')) return 'application';
  return highest === 'foundation' ? 'foundation' : 'application';
}

export function scaffoldingFor(input: {
  stage: PracticeStage;
  conceptStage?: PracticeStage;
  experience?: MentorExperienceLevel | null;
  recentRecords?: CompetencyEvidenceRecord[];
}): ScaffoldingPolicy {
  const beginner = isBeginnerExperience(input.experience);
  const conceptRank = input.conceptStage ? STAGE_RANK[input.conceptStage] : STAGE_RANK[input.stage];
  const userRank = STAGE_RANK[input.stage];
  const rank = Math.min(conceptRank, userRank);
  const stage = (Object.keys(STAGE_RANK) as PracticeStage[]).find((key) => STAGE_RANK[key] === rank) ?? 'foundation';

  const recent = input.recentRecords ?? [];
  const independentStreak = recent
    .filter((item) => !isExposureOnlyRecord(item) && (item.result === 'pass' || item.result === 'fail'))
    .slice(-4)
    .filter((item) => item.result === 'pass' && isIndependentEvidence(item)).length;
  const recentFails = recent.filter((item) => item.result === 'fail').slice(-3).length;
  const fade = independentStreak >= 3 && recentFails === 0;
  const support = recentFails >= 2;

  const withPressure = (policy: ScaffoldingPolicy): ScaffoldingPolicy => {
    if (support) {
      return {
        ...policy,
        showHints: true,
        showExamples: true,
        guidedQuestions: policy.stage === 'foundation' || policy.stage === 'application' ? true : policy.guidedQuestions,
        concealConcept: false,
        incompleteInformation: false,
        competingExplanations: false,
        timePressure: 'none',
      };
    }
    if (fade && !beginner) {
      return {
        ...policy,
        showHints: false,
        showExamples: false,
        guidedQuestions: false,
        incompleteInformation: true,
        competingExplanations: policy.stage === 'deliberate' || policy.stage === 'maintenance' || policy.stage === 'integration',
        timePressure: policy.stage === 'deliberate' || policy.stage === 'maintenance' ? 'educational' : 'soft',
      };
    }
    return policy;
  };

  if (beginner && rank < STAGE_RANK.deliberate) {
    if (stage === 'foundation') {
      return withPressure({
        stage,
        nameConcept: true,
        showHints: true,
        guidedQuestions: true,
        showExamples: true,
        concealConcept: false,
        mixedConcepts: false,
        incompleteInformation: false,
        competingExplanations: false,
        timePressure: 'none',
      });
    }
    return withPressure({
      stage: 'application',
      nameConcept: true,
      showHints: true,
      guidedQuestions: true,
      showExamples: true,
      concealConcept: false,
      mixedConcepts: false,
      incompleteInformation: false,
      competingExplanations: false,
      timePressure: 'none',
    });
  }

  if (stage === 'foundation') {
    return withPressure({
      stage,
      nameConcept: true,
      showHints: true,
      guidedQuestions: true,
      showExamples: true,
      concealConcept: false,
      mixedConcepts: false,
      incompleteInformation: false,
      competingExplanations: false,
      timePressure: 'none',
    });
  }
  if (stage === 'application') {
    return withPressure({
      stage,
      nameConcept: true,
      showHints: true,
      guidedQuestions: false,
      showExamples: true,
      concealConcept: false,
      mixedConcepts: false,
      incompleteInformation: false,
      competingExplanations: false,
      timePressure: 'none',
    });
  }
  if (stage === 'integration') {
    return withPressure({
      stage,
      nameConcept: true,
      showHints: false,
      guidedQuestions: false,
      showExamples: false,
      concealConcept: false,
      mixedConcepts: true,
      incompleteInformation: true,
      competingExplanations: false,
      timePressure: 'soft',
    });
  }

  const advanced = Boolean(input.experience && ADVANCED.has(input.experience));
  return withPressure({
    stage,
    nameConcept: false,
    showHints: false,
    guidedQuestions: false,
    showExamples: false,
    concealConcept: advanced || stage === 'deliberate' || stage === 'maintenance',
    mixedConcepts: true,
    incompleteInformation: true,
    competingExplanations: true,
    timePressure: 'educational',
  });
}

export function deliberateTitle(scaffolding: ScaffoldingPolicy, namedTitle: string): string {
  if (scaffolding.concealConcept) return ASSESS_COPY;
  if (scaffolding.stage === 'foundation' || scaffolding.stage === 'application') {
    return namedTitle.startsWith('Apply ') || namedTitle.startsWith('Demonstrate ') || namedTitle.startsWith('Practice ')
      ? namedTitle
      : `Apply ${namedTitle}.`;
  }
  return namedTitle;
}

export function deliberateWhy(scaffolding: ScaffoldingPolicy, namedWhy: string): string {
  if (scaffolding.concealConcept) {
    return `${ASSESS_COPY} Evidence may be incomplete and more than one explanation can fit. Process quality is the grade — not simulated P/L.`;
  }
  return namedWhy;
}

export function familyForConcept(conceptId: string | undefined): CompetencyFamily | 'unknown' {
  if (!conceptId) return 'unknown';
  return getCompetencyConcept(conceptId)?.family ?? 'unknown';
}

/**
 * Keep the priority lead, then avoid long same-concept / same-family blocks.
 * When the learner is ready, prefer mixing related neighbors (trend with momentum,
 * volume, invalidation, risk) instead of a 30-session RSI block.
 */
export function interleaveByFamily<T extends { conceptId?: string }>(
  items: T[],
  options?: { mixRelated?: boolean },
): T[] {
  if (items.length <= 2) return items;
  const lead = items[0]!;
  const rest = items.slice(1);
  const out: T[] = [lead];
  const remaining = [...rest];
  const mixRelated = Boolean(options?.mixRelated);

  while (remaining.length) {
    const prevId = out[out.length - 1]?.conceptId;
    const prevFamily = familyForConcept(prevId);
    const run = consecutiveTailFamily(out);
    const relatedIds = new Set(relatedConceptIds(prevId));

    const pickIndex = remaining.findIndex((item) => {
      const id = item.conceptId;
      const family = familyForConcept(id);
      const related = Boolean(id && relatedIds.has(id));
      const sameFamily = family === prevFamily && family !== 'unknown';
      if (run >= 2 && sameFamily) return false;
      if (mixRelated && related && id !== prevId) return true;
      return family !== prevFamily;
    });
    const next = remaining.splice(pickIndex >= 0 ? pickIndex : 0, 1)[0];
    if (!next) break;
    out.push(next);
  }
  return out;
}

function relatedConceptIds(conceptId: string | undefined): string[] {
  if (!conceptId) return [];
  const node = getConcept(conceptId);
  return node?.relatedIds ?? [];
}

function consecutiveTailFamily<T extends { conceptId?: string }>(items: T[]): number {
  if (items.length === 0) return 0;
  const family = familyForConcept(items[items.length - 1]?.conceptId);
  let run = 1;
  for (let i = items.length - 2; i >= 0; i -= 1) {
    if (familyForConcept(items[i]?.conceptId) !== family) break;
    run += 1;
  }
  return run;
}

export function detectEasySessionGrinding(
  records: readonly CompetencyEvidenceRecord[],
  now: number,
): EasySessionGrinding {
  const windowStart = now - 14 * DAY;
  const recent = records.filter((item) => item.occurredAt >= windowStart && item.occurredAt <= now);
  const easySessions = recent.filter(
    (item) =>
      item.sourceType === 'lesson_completion' ||
      (item.difficulty === 'foundations' &&
        (item.sourceType === 'practice_drill' || item.sourceType === 'knowledge_check')),
  ).length;
  const questionSessions = recent.filter((item) => item.sourceType === 'knowledge_check').length;
  const independentApplications = recent.filter(
    (item) =>
      isIndependentEvidence(item) &&
      item.result === 'pass' &&
      (item.sourceType === 'replay_decision' ||
        item.sourceType === 'simulation_decision' ||
        item.sourceType === 're_demonstration' ||
        item.sourceType === 'transfer_exercise' ||
        item.sourceType === 'applied_exercise'),
  ).length;
  const simulationSessions = recent.filter((item) => item.sourceType === 'simulation_decision').length;
  const simNoise = recent.filter(
    (item) =>
      item.sourceType === 'simulation_decision' &&
      (item.processMetrics?.processQuality == null || (item.processMetrics.simulatedProfitable && item.result === 'fail')),
  ).length;

  const grinding =
    independentApplications < 2 && (easySessions >= 8 || questionSessions >= 10 || simNoise >= 8);
  if (!grinding) {
    return {
      grinding: false,
      easySessions,
      questionSessions,
      simulationSessions,
      independentApplications,
      reason: null,
    };
  }
  return {
    grinding: true,
    easySessions,
    questionSessions,
    simulationSessions,
    independentApplications,
    reason:
      'Completing many questions, easy lessons, or noisy simulations is not spaced mastery. Mixed, independent practice is the next step.',
  };
}

export function pickMaintenanceConcept(
  competency: CompetencyMastery[],
  lastConceptId?: string,
): CompetencyMastery | null {
  const demonstrated = competency.filter(
    (row) => row.state === 'demonstrated' || row.state === 'due_for_redemonstration',
  );
  if (demonstrated.length === 0) return null;
  const due = demonstrated.find((row) => row.state === 'due_for_redemonstration' && row.conceptId !== lastConceptId);
  if (due) return due;
  const stale = demonstrated
    .filter((row) => row.conceptId !== lastConceptId)
    .sort((a, b) => (a.quality.recency ?? 100) - (b.quality.recency ?? 100) || (a.quality.variety ?? 100) - (b.quality.variety ?? 100));
  return stale[0] ?? demonstrated[0] ?? null;
}

export function consecutiveSameFamilyCount(items: Array<{ conceptId?: string }>): number {
  if (items.length === 0) return 0;
  let max = 1;
  let run = 1;
  for (let i = 1; i < items.length; i += 1) {
    if (familyForConcept(items[i]?.conceptId) === familyForConcept(items[i - 1]?.conceptId)) {
      run += 1;
      max = Math.max(max, run);
    } else {
      run = 1;
    }
  }
  return max;
}

export function isTrainingQueueItemInterleaved(items: TrainingQueueItem[]): boolean {
  return consecutiveSameFamilyCount(items.filter((item) => item.conceptId)) <= 2;
}
