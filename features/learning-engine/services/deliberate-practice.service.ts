import { getCompetencyConcept, isExposureOnlySource } from '@/features/competency';
import type {
  CompetencyEvidenceRecord,
  CompetencyFamily,
  CompetencyMastery,
} from '@/features/competency';
import type { MentorExperienceLevel } from '@/features/onboarding/types/mentor-setup.types';

import type {
  EasySessionGrinding,
  PracticeStage,
  ScaffoldingPolicy,
  TrainingQueueItem,
} from '../types/learning-engine.types';

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
      !isExposureOnlySource(item.sourceType) &&
      item.independent &&
      !item.hintsUsed &&
      (item.sourceType === 'replay_decision' ||
        item.sourceType === 'simulation_decision' ||
        item.sourceType === 're_demonstration') &&
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
}): ScaffoldingPolicy {
  const beginner = isBeginnerExperience(input.experience);
  const conceptRank = input.conceptStage ? STAGE_RANK[input.conceptStage] : STAGE_RANK[input.stage];
  const userRank = STAGE_RANK[input.stage];
  const rank = Math.min(conceptRank, userRank);
  const stage = (Object.keys(STAGE_RANK) as PracticeStage[]).find((key) => STAGE_RANK[key] === rank) ?? 'foundation';

  if (beginner && rank < STAGE_RANK.deliberate) {
    if (stage === 'foundation') {
      return {
        stage,
        nameConcept: true,
        showHints: true,
        guidedQuestions: true,
        showExamples: true,
        concealConcept: false,
        mixedConcepts: false,
        incompleteInformation: false,
        competingExplanations: false,
      };
    }
    return {
      stage: 'application',
      nameConcept: true,
      showHints: true,
      guidedQuestions: true,
      showExamples: true,
      concealConcept: false,
      mixedConcepts: false,
      incompleteInformation: false,
      competingExplanations: false,
    };
  }

  if (stage === 'foundation') {
    return {
      stage,
      nameConcept: true,
      showHints: true,
      guidedQuestions: true,
      showExamples: true,
      concealConcept: false,
      mixedConcepts: false,
      incompleteInformation: false,
      competingExplanations: false,
    };
  }
  if (stage === 'application') {
    return {
      stage,
      nameConcept: true,
      showHints: true,
      guidedQuestions: false,
      showExamples: true,
      concealConcept: false,
      mixedConcepts: false,
      incompleteInformation: false,
      competingExplanations: false,
    };
  }
  if (stage === 'integration') {
    return {
      stage,
      nameConcept: true,
      showHints: false,
      guidedQuestions: false,
      showExamples: false,
      concealConcept: false,
      mixedConcepts: true,
      incompleteInformation: true,
      competingExplanations: false,
    };
  }

  const advanced = Boolean(input.experience && ADVANCED.has(input.experience));
  return {
    stage,
    nameConcept: false,
    showHints: false,
    guidedQuestions: false,
    showExamples: false,
    concealConcept: advanced || stage === 'deliberate' || stage === 'maintenance',
    mixedConcepts: true,
    incompleteInformation: true,
    competingExplanations: true,
  };
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
 * Keep the priority lead, then avoid long same-family blocks.
 */
export function interleaveByFamily<T extends { conceptId?: string }>(items: T[]): T[] {
  if (items.length <= 2) return items;
  const lead = items[0]!;
  const rest = items.slice(1);
  const out: T[] = [lead];
  const remaining = [...rest];
  while (remaining.length) {
    const prevFamily = familyForConcept(out[out.length - 1]?.conceptId);
    const mixedIndex = remaining.findIndex((item) => familyForConcept(item.conceptId) !== prevFamily);
    const next = remaining.splice(mixedIndex >= 0 ? mixedIndex : 0, 1)[0];
    if (!next) break;
    out.push(next);
  }
  return out;
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
  const independentApplications = recent.filter(
    (item) =>
      item.independent &&
      !item.hintsUsed &&
      (item.sourceType === 'replay_decision' ||
        item.sourceType === 'simulation_decision' ||
        item.sourceType === 're_demonstration') &&
      item.result === 'pass',
  ).length;
  const simNoise = recent.filter(
    (item) =>
      item.sourceType === 'simulation_decision' &&
      (item.processMetrics?.processQuality == null || (item.processMetrics.simulatedProfitable && item.result === 'fail')),
  ).length;

  const grinding = easySessions >= 8 && independentApplications < 2;
  const tradeGrinding = simNoise >= 8 && independentApplications < 2;
  if (!grinding && !tradeGrinding) {
    return { grinding: false, easySessions, independentApplications, reason: null };
  }
  return {
    grinding: true,
    easySessions,
    independentApplications,
    reason:
      'Completing many easy sessions or generating simulated trades is not spaced mastery. Mixed, independent practice is the next step.',
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
