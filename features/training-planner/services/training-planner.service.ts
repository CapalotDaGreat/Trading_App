import { ALL_LESSONS } from '@/features/academy/content';
import { selectNextDemonstration, type CompetencyEvidenceRecord, type CompetencyMastery } from '@/features/competency';
import { activityKey } from '@/features/learning-engine/services/concept-handoff.service';
import { interleaveByFamily, practiceStagePolicy } from '@/features/learning-engine/services/deliberate-practice.service';
import type { LearningEvidenceSnapshot } from '@/features/learning-engine/services/learning-evidence.service';
import { primaryConceptForLesson } from '@/features/learning-engine/services/learning-graph.service';
import { nextAfterLesson } from '@/features/learning-engine/services/lesson-next.service';
import {
  pickSurpriseAssessment,
  shouldOfferSurpriseAssessment,
  targetComplexityFor,
} from '@/features/learning-engine/services/adaptive-difficulty.service';
import {
  buildTrainingCandidatePool,
  emptyStateOf,
  headlineFor,
  isQueueItemVisible,
  toEngineQueueItem,
  type ComposeTodaysTrainingOptions,
  type TrainingEngineCandidate,
} from '@/features/learning-engine/services/training-candidate-pool.service';
import type {
  PracticeStage,
  QueueDisposition,
  TodaysTraining,
  TrainingQueueItem,
} from '@/features/learning-engine/types/learning-engine.types';
import { getPracticeDrill } from '@/features/practice/content/practice-drills';

import {
  activityTypeFor,
  comparePlannerScores,
  looksLikeTradeSignal,
  passContextCount,
  recentFailCount,
  scorePlannerCandidate,
} from './planner-scoring.service';
import { sessionBudgetMinutes, sessionLengthFromBudget } from './planner-session.service';
import type {
  TrainingPlan,
  TrainingRecommendation,
  TrainingSessionLength,
} from '../types/training-planner.types';
import { recommendationToQueueItem } from '../types/training-planner.types';
import type { LearnerModelSnapshot } from '@/features/learner-model';
import { getLearnerConcept } from '@/features/learner-model';
import {
  observationalReasonForCandidate,
  plannerScoreDeltaForMistakeLibrary,
} from '@/features/mistake-library/services/mistake-library.service';

const COACH_LINE =
  'Here is what you should train next, and why. Skip or defer anything — that is a scheduling choice, not a failed attempt. Process evidence ranks the queue; simulated P/L does not.';

export interface ComposeTrainingPlanInput {
  uid: string;
  snapshot: LearningEvidenceSnapshot;
  dispositions?: Record<string, QueueDisposition>;
  options?: ComposeTodaysTrainingOptions;
  sessionLength?: TrainingSessionLength;
  sessionBudgetMinutes?: number;
  learnerModel?: LearnerModelSnapshot;
}

function drillIdFromHref(href: string): string | undefined {
  const query = href.split('?')[1];
  if (!query) return undefined;
  return new URLSearchParams(query).get('drill') ?? undefined;
}

function lessonIdFromHref(href: string): string | undefined {
  const match = href.match(/\/academy\/lesson\/([^/?]+)/);
  return match?.[1];
}

export function estimateActivityMinutes(candidate: Pick<TrainingEngineCandidate, 'kind' | 'href'>): number {
  const drillId = drillIdFromHref(candidate.href);
  if (drillId) return getPracticeDrill(drillId)?.estimatedMinutes ?? 5;
  const lessonId = lessonIdFromHref(candidate.href);
  if (lessonId) {
    const lesson = ALL_LESSONS.find((row) => row.id === lessonId);
    return lesson?.durationMinutes ?? 12;
  }
  if (candidate.href.includes('/academy/path/')) return 15;
  if (candidate.href.includes('replay-tv')) return 15;
  if (candidate.href.startsWith('/simulate')) return 25;
  if (candidate.href.startsWith('/journal')) return 8;
  if (candidate.href.startsWith('/review')) return 10;
  if (candidate.href.startsWith('/events')) return 10;
  if (candidate.kind === 'chart_exercise') return 6;
  return 12;
}

function transferCandidates(
  competency: CompetencyMastery[],
  evidence: CompetencyEvidenceRecord[],
  existing: TrainingEngineCandidate[],
): TrainingEngineCandidate[] {
  const out: TrainingEngineCandidate[] = [];
  for (const row of competency) {
    if (row.state === 'needs_remediation' || row.state === 'not_started' || row.state === 'learning') continue;
    if (row.independentDemonstrationCount < 1) continue;
    if (existing.some((item) => item.id === `transfer-${row.conceptId}` || item.priority === 'transfer_practice' && item.conceptId === row.conceptId)) {
      continue;
    }
    const contexts = passContextCount(evidence, row.conceptId);
    if (!row.falseMastery && contexts >= 2) continue;
    const prompt = selectNextDemonstration(
      row.conceptId,
      evidence.filter((item) => item.conceptId === row.conceptId),
    );
    const conceal = Boolean(prompt.concealConcept);
    out.push({
      id: `transfer-${row.conceptId}`,
      conceptId: row.conceptId,
      title: conceal ? 'Assess this situation and make your decision.' : `Apply ${row.title} in a new context`,
      priority: 'transfer_practice',
      loopStep: 'apply',
      kind: 'simulation_challenge',
      whyToday: conceal
        ? 'Assess this situation and make your decision. Several process skills are in play; the specific competency is not named. Simulated P/L is context, not the grade.'
        : `This exercise tests whether you can apply ${row.title.toLowerCase()} in a new context.`,
      evidence: ['Transfer distance: a previously practiced skill in an unfamiliar scenario.'],
      href: prompt.href,
    concealConcept: conceal,
    deferCount: 0,
    transferStep:
      prompt.transferKind === 'new_presentation' || prompt.transferKind == null
        ? prompt.transferKind === 'new_presentation'
          ? 'new_example'
          : undefined
        : prompt.transferKind,
  });
  }
  return out;
}

function surpriseCandidates(
  competency: CompetencyMastery[],
  evidence: CompetencyEvidenceRecord[],
  now: number,
  experience: LearningEvidenceSnapshot['experience'],
): TrainingEngineCandidate[] {
  if (!shouldOfferSurpriseAssessment({ mastery: competency, records: evidence, now, experience })) {
    return [];
  }
  const offer = pickSurpriseAssessment({ mastery: competency, now });
  if (!offer) return [];
  return [
    {
      id: `surprise-${offer.episodeId}`,
      conceptId: offer.conceptIds[0],
      title: 'Assess this situation and make your decision.',
      priority: 'varied_practice',
      loopStep: 'apply',
      kind: 'historical_replay',
      whyToday: offer.reason,
      evidence: ['Infrequent mixed assessment. Not a penalty.'],
      href: offer.href,
      complexity: 'complex',
      concealConcept: true,
      deferCount: 0,
      transferStep: 'concealed_scenario',
      showHints: false,
      showExamples: false,
    },
  ];
}

function explainCandidate(
  candidate: TrainingEngineCandidate,
  mastery: CompetencyMastery | undefined,
  evidence: CompetencyEvidenceRecord[],
  now: number,
  learner?: LearnerModelSnapshot,
): string {
  if (candidate.concealConcept) return candidate.whyToday;
  if (looksLikeTradeSignal(candidate.whyToday)) {
    return 'Practice the decision process on this educational scenario. It is not a trade instruction.';
  }
  const learnerConcept = candidate.conceptId && learner ? getLearnerConcept(learner, candidate.conceptId) : undefined;
  const fails = recentFailCount(evidence, candidate.conceptId, now);
  const staleDays =
    mastery?.lastIndependentSuccessAt || mastery?.lastEvidenceAt
      ? Math.floor((now - (mastery.lastIndependentSuccessAt ?? mastery.lastEvidenceAt ?? now)) / (24 * 60 * 60 * 1000))
      : null;
  const hasKnowledge = mastery?.missingRoles.includes('application') && !mastery.missingRoles.includes('knowledge');
  const patternReason = observationalReasonForCandidate(
    { href: candidate.href, conceptId: candidate.conceptId, concealConcept: candidate.concealConcept },
    learner?.mistakePatterns,
  );
  if (patternReason && (candidate.priority === 'remediation' || candidate.priority === 'weak_competency' || candidate.priority === 'in_progress')) {
    return patternReason;
  }
  if (
    hasKnowledge &&
    fails === 0 &&
    (candidate.priority === 'in_progress' || candidate.priority === 'weak_competency')
  ) {
    return `You understood ${mastery!.title.toLowerCase()} in quizzes, but have not demonstrated it in a simulation yet.`;
  }
  if (mastery?.falseMastery && candidate.priority === 'transfer_practice' && !candidate.concealConcept) {
    return 'You demonstrated this skill in familiar settings. This activity asks for the same process in an unfamiliar context.';
  }
  if (learnerConcept?.state === 'transfer_unproven' && candidate.priority === 'transfer_practice' && !candidate.concealConcept) {
    return `This exercise tests whether you can apply ${learnerConcept.title.toLowerCase()} in a new context.`;
  }
  if (candidate.priority === 'transfer_practice' && !candidate.concealConcept) {
    return `This exercise tests whether you can apply ${mastery?.title.toLowerCase() ?? 'the concept'} in a new context.`;
  }
  if (candidate.priority === 'redemonstration' && staleDays != null && staleDays >= 14) {
    return `You have not revisited this competency in ${staleDays} days. It is due for re-demonstration — retrieval, not a new chapter.`;
  }
  if (fails >= 2 && candidate.priority === 'remediation') {
    const title = mastery?.title.toLowerCase() ?? 'this skill';
    return `You struggled with ${title} in two recent scenarios. This practice isolates that skill. Simulated P/L is not the grade.`;
  }
  return candidate.whyToday;
}

function toRecommendation(
  candidate: TrainingEngineCandidate,
  ctx: {
    now: number;
    evidence: CompetencyEvidenceRecord[];
    competency: CompetencyMastery[];
    sessionBudgetMinutes: number;
    sessionLength: TrainingSessionLength;
    grinding: boolean;
    recentActivityKeys: string[];
    learner?: LearnerModelSnapshot;
    stage?: PracticeStage;
  },
): TrainingRecommendation {
  const minutes = estimateActivityMinutes(candidate);
  const { score, band } = scorePlannerCandidate(candidate, minutes, {
    now: ctx.now,
    recentActivityKeys: ctx.recentActivityKeys,
    evidence: ctx.evidence,
    competency: ctx.competency,
    sessionBudgetMinutes: ctx.sessionBudgetMinutes,
    sessionLength: ctx.sessionLength,
    grinding: ctx.grinding,
    mistakeLibrary: ctx.learner?.mistakePatterns,
    stage: ctx.stage,
  });
  const mastery = candidate.conceptId
    ? ctx.competency.find((row) => row.conceptId === candidate.conceptId)
    : undefined;
  const reason = explainCandidate(candidate, mastery, ctx.evidence, ctx.now, ctx.learner);
  const item = toEngineQueueItem({ ...candidate, whyToday: reason });
  const activityType = activityTypeFor(candidate.kind, item.href);
  const isRemediation = band === 'critical_remediation' || candidate.priority === 'remediation';
  const isRedemonstration = band === 'overdue_redemonstration' || candidate.priority === 'redemonstration';
  const isTransfer = band === 'transfer_practice';
  const isEvent = band === 'event_driven';
  const isOptional = band === 'optional_exploration';
  const knowledgeMissing = Boolean(mastery?.missingRoles.includes('knowledge'));
  const applicationActivity = activityType === 'simulation' || activityType === 'replay';

  return {
    id: candidate.id,
    activityType: candidate.id === 'explore-library' ? 'exploration' : activityType,
    conceptId: candidate.conceptId,
    title: looksLikeTradeSignal(candidate.title)
      ? 'Practice this decision process'
      : candidate.title,
    href: item.href,
    reason,
    priority: candidate.priority,
    band,
    score,
    difficulty: candidate.complexity ?? 'foundations',
    estimatedMinutes: minutes,
    expectedTrainingValue: Math.max(8, Math.min(99, Math.round(score / 10))),
    prerequisiteReady: !(knowledgeMissing && applicationActivity),
    isRemediation,
    isRedemonstration,
    isTransferPractice: isTransfer,
    isEventDriven: isEvent,
    isOptional,
    deferralEligible: true,
    dueAt: mastery?.nextRedemonstrationAt ?? undefined,
    kind: candidate.kind,
    loopStep: candidate.loopStep,
    concealConcept: candidate.concealConcept,
    evidence: candidate.evidence,
    transferStep: candidate.transferStep,
    showHints: candidate.showHints,
    showExamples: candidate.showExamples,
  };
}

function applySessionLead(
  ranked: TrainingRecommendation[],
  budgetMinutes: number,
  sessionLength: TrainingSessionLength,
): TrainingRecommendation[] {
  const lead = ranked[0];
  if (!lead) return ranked;
  const critical = lead.isRemediation || lead.isRedemonstration;
  if (lead.estimatedMinutes <= budgetMinutes && sessionLength !== 'quick') return ranked;
  if (critical && lead.estimatedMinutes <= budgetMinutes) return ranked;
  const alternative = ranked.find((row, index) => {
    if (index === 0) return false;
    if (row.isOptional) return false;
    if (row.estimatedMinutes > budgetMinutes) return false;
    if (sessionLength === 'quick') {
      return true;
    }
    return row.score >= lead.score - 110;
  });
  if (!alternative) return ranked;
  const swapped: TrainingRecommendation = {
    ...alternative,
    reason:
      sessionLength === 'quick' && lead.estimatedMinutes > budgetMinutes
        ? `This fits a quick session on the same gap. ${alternative.reason}`
        : alternative.reason,
  };
  return [swapped, ...ranked.filter((row) => row.id !== alternative.id)];
}

/**
 * Canonical Training Planner. Other systems supply candidates; this ranks the next activity.
 * Deterministic for identical learner state. No LLM. Simulated P/L is never an input.
 */
export function composeTrainingPlan(input: ComposeTrainingPlanInput): TrainingPlan {
  const dispositions = input.dispositions ?? {};
  const options = input.options ?? {};
  const built = buildTrainingCandidatePool(input.snapshot, dispositions, options);
  const sessionLength =
    input.sessionLength ?? sessionLengthFromBudget(input.sessionBudgetMinutes);
  const budget = sessionBudgetMinutes(sessionLength, input.sessionBudgetMinutes, {
    preferLength: Boolean(input.sessionLength),
  });
  const recent = options.recentActivityKeys ?? [];
  const now = input.snapshot.now;

  const pool = [
    ...built.pool,
    ...transferCandidates(built.competency, built.evidence, built.pool),
    ...surpriseCandidates(built.competency, built.evidence, now, input.snapshot.experience),
  ];

  const seen = new Set<string>();
  const unique = pool.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  const scored = unique.map((candidate) =>
    toRecommendation(candidate, {
      now,
      evidence: built.evidence,
      competency: built.competency,
      sessionBudgetMinutes: budget,
      sessionLength,
      grinding: built.grinding.grinding,
      recentActivityKeys: recent,
      learner: input.learnerModel,
      stage: built.stage,
    }),
  );

  scored.sort(comparePlannerScores);

  const visible = scored.filter((row) => isQueueItemVisible(row, dispositions, now));
  const fitted = applySessionLead(visible, budget, sessionLength);
  const lead = fitted[0];
  const rest = lead
    ? interleaveByFamily(fitted.slice(1).map(recommendationToQueueItem), {
        mixRelated: practiceStagePolicy(built.stage).interleaveRelated,
      })
    : [];
  const restIds = new Set(rest.map((item) => item.id));
  const restRecs = rest
    .map((item) => fitted.find((row) => row.id === item.id))
    .filter((row): row is TrainingRecommendation => Boolean(row));
  const leftover = fitted.filter((row) => row.id !== lead?.id && !restIds.has(row.id));
  let queue = (lead ? [lead, ...restRecs, ...leftover] : fitted).slice(0, 6);

  const bookmarked = Object.entries(dispositions)
    .filter(([, row]) => row.bookmarked)
    .map(([id]) => scored.find((item) => item.id === id))
    .filter((item): item is TrainingRecommendation => item != null && !queue.some((row) => row.id === item.id));
  queue = [...queue, ...bookmarked].slice(0, 7);

  if (built.grinding.grinding && queue[0] && queue[0].priority === 'curriculum') {
    const mixed = queue.find((item) => item.kind === 'simulation_challenge' || item.concealConcept);
    if (mixed) {
      queue = [
        {
          ...mixed,
          reason: `${built.grinding.reason ?? 'Mixed independent practice is the next step.'} ${mixed.reason}`.trim(),
        },
        ...queue.filter((item) => item.id !== mixed.id),
      ];
    }
  }

  const primaryRaw = queue[0] ?? null;
  const deferredConcept =
    primaryRaw?.conceptId && (options.conceptDeferCounts?.[primaryRaw.conceptId] ?? 0) > 0;
  const primary =
    primaryRaw && deferredConcept
      ? {
          ...primaryRaw,
          reason: `You deferred a longer activity on this gap. Here is a shorter way to work on it. ${primaryRaw.reason}`,
        }
      : primaryRaw;
  if (primary && queue[0] && primary.reason !== queue[0].reason) {
    queue = [primary, ...queue.slice(1)];
  }

  const items: TrainingQueueItem[] = queue.map(recommendationToQueueItem);
  const empty = emptyStateOf(input.snapshot, built.competency, items[0]);
  const continueId = input.snapshot.openedLessonIds[0] ?? input.snapshot.nextLessonId;
  const lessonChain = continueId
    ? nextAfterLesson(
        continueId,
        targetComplexityFor(input.snapshot.byConcept[primaryConceptForLesson(continueId)?.id ?? '']),
      )
    : null;

  const today: TodaysTraining = {
    headline: headlineFor(empty, items[0]),
    coachLine: COACH_LINE,
    items,
    focusAreas: built.focusAreas,
    lessonChain,
    emptyState: empty,
    stage: built.stage,
  };

  return {
    uid: input.uid,
    sessionLength,
    sessionBudgetMinutes: budget,
    generatedAt: now,
    primary,
    queue,
    whyPrimary: primary?.reason ?? today.coachLine,
    headline: today.headline,
    coachLine: today.coachLine,
    emptyState: empty,
    stage: built.stage,
    today,
  };
}

export function composeTodaysTraining(
  snapshot: LearningEvidenceSnapshot,
  dispositions: Record<string, QueueDisposition> = {},
  options: ComposeTodaysTrainingOptions = {},
): TodaysTraining {
  return composeTrainingPlan({
    uid: 'local',
    snapshot,
    dispositions,
    options,
  }).today;
}

export function explainRecommendation(item: Pick<TrainingQueueItem, 'whyToday' | 'reason'>): string {
  return item.whyToday ?? item.reason;
}

export function activityKeyOf(href: string): string {
  return activityKey(href);
}
