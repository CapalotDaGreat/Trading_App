import { ALL_LESSONS } from '@/features/academy/content';
import {
  getCompetencyConcept,
  recipeFor,
  scoreAllCompetencyMastery,
  selectNextDemonstration,
} from '@/features/competency';
import type {
  CompetencyEvidenceRecord,
  CompetencyMastery,
  EvidenceRole,
  RemediationPlan,
} from '@/features/competency';
import { isEventPersonalizationEligible } from '@/features/events/services/event-personalization.service';
import type { MentorExperienceLevel } from '@/features/onboarding/types/mentor-setup.types';

import type {
  PracticeTransferStep,
  QueueDisposition,
  TargetComplexity,
  TrainingEmptyState,
  TrainingLoopStep,
  TrainingPriority,
  TrainingQueueItem,
  TrainingQueueKind,
} from '../types/learning-engine.types';
import {
  consecutiveFailCount,
  pickDrillForConcept,
  pickReplayForConcept,
  selectAdaptivePractice,
  targetComplexityFor,
} from './adaptive-difficulty.service';
import { activityKey, withConceptHandoff } from './concept-handoff.service';
import { isSpacedReviewDue, scoreAllConceptMastery } from './concept-mastery.service';
import {
  conceptPracticeStage,
  conservativePracticeStage,
  detectEasySessionGrinding,
  deliberateTitle,
  deliberateWhy,
  laterTransferStep,
  minComplexity,
  overallPracticeStage,
  pickMaintenanceConcept,
  practiceStagePolicy,
  scaffoldingFor,
} from './deliberate-practice.service';
import { detectFocusAreas } from './focus-area.service';
import type { LearningEvidenceSnapshot } from './learning-evidence.service';
import { getConcept, lessonTitle, primaryConceptForLesson } from './learning-graph.service';

const EVENT_OK = new Set(['intermediate', 'advanced', 'professional']);

const BEGINNER_EXPERIENCE = new Set<MentorExperienceLevel>(['completely_new', 'beginner']);
const ADVANCED_EXPERIENCE = new Set<MentorExperienceLevel>(['advanced', 'professional']);

/** Beginner curriculum order: foundations → charts → risk → invalidation → thesis → psychology. */
export const BEGINNER_CURRICULUM: Array<{
  conceptId?: string;
  lessonId?: string;
  href: string;
  title: string;
}> = [
  { href: '/academy/path/path-foundations', title: 'Start with Foundations' },
  {
    conceptId: 'chart-interpretation',
    lessonId: 'ta-candles',
    href: '/academy/lesson/ta-candles',
    title: 'Simple chart interpretation',
  },
  {
    conceptId: 'support',
    lessonId: 'ta-structure',
    href: '/academy/lesson/ta-structure',
    title: 'Support and resistance',
  },
  {
    conceptId: 'risk-per-trade',
    lessonId: 'risk-per-trade',
    href: '/academy/lesson/risk-per-trade',
    title: 'Risk basics',
  },
  {
    conceptId: 'position-sizing',
    lessonId: 'risk-position-sizing',
    href: '/academy/lesson/risk-position-sizing',
    title: 'Position sizing',
  },
  {
    conceptId: 'invalidation',
    lessonId: 'dec-invalidation',
    href: '/academy/lesson/dec-invalidation',
    title: 'Invalidation',
  },
  {
    conceptId: 'thesis',
    lessonId: 'dec-thesis',
    href: '/academy/lesson/dec-thesis',
    title: 'Thesis construction',
  },
  {
    conceptId: 'fomo',
    lessonId: 'psych-fomo',
    href: '/academy/lesson/psych-fomo',
    title: 'Basic psychology',
  },
];

const ADVANCED_CONCEPTS = new Set([
  'event-risk',
  'earnings',
  'interest-rates',
  'divergence',
  'multi-timeframe',
  'valuation',
  'liquidity',
]);

export const PRIORITY_RANK: Record<TrainingPriority, number> = {
  remediation: 1,
  redemonstration: 2,
  in_progress: 3,
  weak_competency: 4,
  transfer_practice: 5,
  event_driven: 6,
  curriculum: 7,
  varied_practice: 8,
  optional_exploration: 9,
};

export interface ComposeTodaysTrainingOptions {
  competency?: CompetencyMastery[];
  evidence?: CompetencyEvidenceRecord[];
  recentActivityKeys?: string[];
  conceptDeferCounts?: Record<string, number>;
}

export interface TrainingEngineCandidate {
  id: string;
  conceptId?: string;
  title: string;
  priority: TrainingPriority;
  loopStep: TrainingLoopStep;
  kind: TrainingQueueKind;
  whyToday: string;
  evidence: string[];
  href: string;
  complexity?: TargetComplexity;
  concealConcept: boolean;
  deferCount: number;
  transferStep?: PracticeTransferStep;
  showHints?: boolean;
  showExamples?: boolean;
}

type Candidate = TrainingEngineCandidate;

function visible(item: TrainingQueueItem, dispositions: Record<string, QueueDisposition>, now: number): boolean {
  const row = dispositions[item.id];
  if (!row) return true;
  if (row.skippedUntil && now < row.skippedUntil) return false;
  if (row.deferredUntil && now < row.deferredUntil) return false;
  return true;
}

function isBeginner(experience: MentorExperienceLevel | null): boolean {
  return !experience || BEGINNER_EXPERIENCE.has(experience);
}

function demonstratedCount(rows: CompetencyMastery[]): number {
  return rows.filter((row) => row.state === 'demonstrated').length;
}

function isAdvancedProfile(
  snapshot: LearningEvidenceSnapshot,
  competency: CompetencyMastery[],
): boolean {
  if (snapshot.experience && ADVANCED_EXPERIENCE.has(snapshot.experience)) {
    return demonstratedCount(competency) >= 2 || competency.some((row) => row.state === 'demonstrated');
  }
  return demonstratedCount(competency) >= 4;
}

function conceptTitle(conceptId: string): string {
  return getCompetencyConcept(conceptId)?.title ?? getConcept(conceptId)?.title ?? conceptId;
}

function deferCountFor(
  conceptId: string | undefined,
  itemId: string,
  dispositions: Record<string, QueueDisposition>,
  conceptDeferCounts: Record<string, number>,
): number {
  const fromItem = dispositions[itemId]?.deferCount ?? 0;
  const fromConcept = conceptId ? (conceptDeferCounts[conceptId] ?? 0) : 0;
  return Math.max(fromItem, fromConcept);
}

function appendDeferNote(why: string, deferCount: number): string {
  if (deferCount < 2) return why;
  return `${why} You have deferred this twice. We’ll keep it in your training queue because it remains one of your current practice priorities.`;
}

function nextLoopFromMissing(missing: EvidenceRole[]): TrainingLoopStep {
  if (missing.includes('knowledge')) return 'learn';
  if (missing.includes('calculation') || missing.includes('practice')) return 'practice';
  if (missing.includes('application')) return 'apply';
  if (missing.includes('reflection')) return 'review';
  if (missing.includes('remediation')) return 'remediate';
  if (missing.includes('redemonstration')) return 'redemonstrate';
  return 'demonstrate';
}

function rotateAwayFromRecent(hrefs: string[], recent: string[]): string {
  const unused = hrefs.filter((href) => !recent.includes(activityKey(href)));
  return unused[0] ?? hrefs[hrefs.length - 1] ?? hrefs[0]!;
}

function lessonHrefForConcept(conceptId: string): string | undefined {
  const node = getConcept(conceptId);
  const lessonId = node?.lessonIds[0];
  if (lessonId && ALL_LESSONS.some((lesson) => lesson.id === lessonId)) {
    return `/academy/lesson/${lessonId}`;
  }
  const beginner = BEGINNER_CURRICULUM.find((row) => row.conceptId === conceptId);
  return beginner?.href;
}

function drillHref(conceptId: string, complexity: TargetComplexity, recent: string[]): string | undefined {
  const preferred = pickDrillForConcept(conceptId, complexity);
  const node = getConcept(conceptId);
  const ids = node?.drillIds ?? [];
  const hrefs = ids.map((id) => `/practice?drill=${id}`);
  if (preferred) {
    const lead = `/practice?drill=${preferred.id}`;
    const ordered = [lead, ...hrefs.filter((href) => href !== lead)];
    return rotateAwayFromRecent(ordered, recent);
  }
  if (hrefs.length) return rotateAwayFromRecent(hrefs, recent);
  return undefined;
}

function replayHref(conceptId: string, complexity: TargetComplexity, recent: string[]): string | undefined {
  const node = getConcept(conceptId);
  const ids = node?.replayIds ?? [];
  if (!ids.length) return undefined;
  const preferred = pickReplayForConcept(conceptId, complexity) ?? ids[0];
  const hrefs = ids.map((id) => `/decision/replay-tv?episode=${id}`);
  const lead = `/decision/replay-tv?episode=${preferred}`;
  return rotateAwayFromRecent([lead, ...hrefs.filter((href) => href !== lead)], recent);
}

function simulateHref(conceptId: string, recent: string[], promptHref?: string): string {
  const node = getConcept(conceptId);
  const options = [
    promptHref,
    node?.simulateHref,
    '/simulate?start=1',
    '/simulate?start=1&focus=thesis_discipline',
    '/simulate?start=1&focus=position_sizing',
    '/simulate?start=1&prep=earnings',
  ].filter((href): href is string => Boolean(href));
  return rotateAwayFromRecent(options, recent);
}

function pickHrefForStep(input: {
  conceptId: string;
  loopStep: TrainingLoopStep;
  complexity: TargetComplexity;
  recent: string[];
  rem?: RemediationPlan | null;
  promptHref?: string;
  snapshot: LearningEvidenceSnapshot;
}): { href: string; kind: TrainingQueueKind } {
  const { conceptId, loopStep, complexity, recent, rem, promptHref, snapshot } = input;

  if (loopStep === 'remediate' && rem?.steps.length) {
    const unused = rem.steps.find((step) => !recent.includes(activityKey(step.href))) ?? rem.steps[0]!;
    const kind: TrainingQueueKind =
      unused.kind === 'lesson'
        ? 'continue_lesson'
        : unused.kind === 'replay'
          ? 'historical_replay'
          : unused.kind === 'simulation' || unused.kind === 'redemonstration'
            ? 'simulation_challenge'
            : 'review_concept';
    return { href: unused.href, kind: kind === 'review_concept' ? 'remediation' : kind };
  }

  if (loopStep === 'redemonstrate') {
    return { href: simulateHref(conceptId, recent, promptHref), kind: 'redemonstration' };
  }

  if (loopStep === 'learn') {
    const lesson = lessonHrefForConcept(conceptId);
    if (lesson && !recent.includes(activityKey(lesson))) {
      return { href: lesson, kind: 'continue_lesson' };
    }
  }

  if (loopStep === 'review') {
    if (snapshot.hasSimulation && !snapshot.hasJournal) {
      return { href: '/journal', kind: 'journal_review' };
    }
    return { href: snapshot.hasJournal ? '/review' : '/journal', kind: 'journal_review' };
  }

  if (loopStep === 'apply') {
    const replay = replayHref(conceptId, complexity, recent);
    const sim = simulateHref(conceptId, recent, promptHref);
    const pick = rotateAwayFromRecent([replay, sim].filter((href): href is string => Boolean(href)), recent);
    if (pick?.includes('replay-tv')) return { href: pick, kind: 'historical_replay' };
    return { href: pick ?? sim, kind: 'simulation_challenge' };
  }

  const drill = drillHref(conceptId, complexity, recent);
  if (drill && (loopStep === 'practice' || loopStep === 'demonstrate')) {
    const replay = replayHref(conceptId, complexity, recent);
    const sim = simulateHref(conceptId, recent, promptHref);
    const ordered =
      loopStep === 'demonstrate' ? [drill, replay, sim] : [drill, replay, sim];
    const pick = rotateAwayFromRecent(
      ordered.filter((href): href is string => Boolean(href)),
      recent,
    );
    if (pick?.includes('replay-tv')) return { href: pick, kind: 'historical_replay' };
    if (pick?.startsWith('/simulate')) return { href: pick, kind: 'simulation_challenge' };
    return { href: pick ?? drill, kind: 'chart_exercise' };
  }

  if (drill) return { href: drill, kind: 'chart_exercise' };
  const lesson = lessonHrefForConcept(conceptId);
  if (lesson) return { href: lesson, kind: 'continue_lesson' };
  return { href: '/practice', kind: 'chart_exercise' };
}

function whyFor(input: {
  priority: TrainingPriority;
  conceptTitle: string;
  explanations: string[];
  diagnosis?: string;
  conceal: boolean;
  deferCount: number;
  missingRoles?: EvidenceRole[];
  drillAttempts?: number;
  lastProcessNote?: string;
}): string {
  if (input.conceal && (input.priority === 'redemonstration' || input.priority === 'varied_practice')) {
    return appendDeferNote(
      'Assess this situation and make your decision. Several process skills are in play; the specific competency is not named. Simulated P/L is context, not the grade.',
      input.deferCount,
    );
  }

  if (input.priority === 'remediation') {
    const process = input.lastProcessNote ?? input.diagnosis ?? input.explanations[0];
    return appendDeferNote(
      process
        ? `${process} This exercise gives you another chance to demonstrate the skill under different conditions. That is a process pattern, not a verdict.`
        : `Recent checks on ${input.conceptTitle} missed more than once. This is required practice, not a lockout.`,
      input.deferCount,
    );
  }

  if (input.priority === 'redemonstration') {
    return appendDeferNote(
      `Your ${input.conceptTitle.toLowerCase()} competency is due for re-demonstration. Recency matters; this is retrieval, not a new chapter.`,
      input.deferCount,
    );
  }

  if (input.priority === 'in_progress') {
    return appendDeferNote(
      `You learned ${input.conceptTitle.toLowerCase()}, but you have not yet demonstrated it. Reading is exposure — the next step is a check.`,
      input.deferCount,
    );
  }

  if (input.priority === 'weak_competency') {
    const attempts =
      input.drillAttempts && input.drillAttempts > 0
        ? `You have practiced ${input.conceptTitle.toLowerCase()} ${input.drillAttempts === 1 ? 'once' : `${input.drillAttempts} times`}, but the evidence is still thin.`
        : `Evidence for ${input.conceptTitle.toLowerCase()} is still thin.`;
    return appendDeferNote(
      `${attempts} This is a practice priority, not a claim that you cannot do the skill.`,
      input.deferCount,
    );
  }

  if (input.priority === 'curriculum') {
    return appendDeferNote(
      `Next appropriate lesson: ${input.conceptTitle}. This follows the curriculum because there is little process evidence yet — not because of simulated P/L.`,
      input.deferCount,
    );
  }

  return appendDeferNote(
    'Recent practice clustered on one scenario type. A mixed context helps the skill transfer. Simulated P/L does not decide this.',
    input.deferCount,
  );
}

function candidatesFromCompetency(
  rows: CompetencyMastery[],
  snapshot: LearningEvidenceSnapshot,
  evidence: CompetencyEvidenceRecord[],
  recent: string[],
  dispositions: Record<string, QueueDisposition>,
  conceptDeferCounts: Record<string, number>,
): Candidate[] {
  const beginner = isBeginner(snapshot.experience);
  const advanced = isAdvancedProfile(snapshot, rows);
  const userStage = overallPracticeStage({
    competency: rows,
    evidence,
    experience: snapshot.experience,
  });
  const out: Candidate[] = [];

  for (const row of rows) {
    if (row.state === 'not_started') continue;
    if (beginner && ADVANCED_CONCEPTS.has(row.conceptId)) continue;

    const conceptStage = conceptPracticeStage(row);
    const policy = practiceStagePolicy(conservativePracticeStage(userStage, conceptStage));
    const complexity = beginner
      ? 'foundations'
      : minComplexity(targetComplexityFor(snapshot.byConcept[row.conceptId]), policy.complexity);
    const scaffolding = scaffoldingFor({
      stage: userStage,
      conceptStage,
      experience: snapshot.experience,
      recentRecords: evidence.filter((item) => item.conceptId === row.conceptId),
    });
    const adaptive = selectAdaptivePractice({
      conceptId: row.conceptId,
      records: evidence.filter((item) => item.conceptId === row.conceptId),
      mastery: row,
      experience: snapshot.experience,
      recentActivityKeys: recent,
      now: snapshot.now,
      scaffolding,
    });
    const conceal =
      scaffolding.concealConcept &&
      advanced &&
      (row.state === 'due_for_redemonstration' ||
        recipeFor(row.conceptId).concealOnRetest ||
        conceptStage === 'deliberate' ||
        conceptStage === 'maintenance');
    const idBase =
      row.state === 'needs_remediation'
        ? `remediation-${row.conceptId}`
        : row.state === 'due_for_redemonstration'
          ? `redemo-${row.conceptId}`
          : row.state === 'learning'
            ? `progress-${row.conceptId}`
            : `weak-${row.conceptId}`;
    const deferCount = deferCountFor(row.conceptId, idBase, dispositions, conceptDeferCounts);

    let priority: TrainingPriority | null = null;
    let loopStep: TrainingLoopStep = 'practice';
    if (row.state === 'needs_remediation') {
      priority = 'remediation';
      loopStep = 'remediate';
    } else if (row.state === 'due_for_redemonstration') {
      priority = 'redemonstration';
      loopStep = 'redemonstrate';
    } else if (row.state === 'learning') {
      priority = 'in_progress';
      loopStep = nextLoopFromMissing(row.missingRoles.length ? row.missingRoles : ['practice']);
      if (loopStep === 'practice') loopStep = 'demonstrate';
    } else if (row.state === 'practiced' && (row.strength == null || row.strength < 55 || row.missingRoles.length)) {
      priority = 'weak_competency';
      loopStep = nextLoopFromMissing(row.missingRoles);
    } else if (row.state === 'practiced') {
      priority = 'weak_competency';
      loopStep = nextLoopFromMissing(row.missingRoles.length ? row.missingRoles : ['application']);
    }

    if (!priority) continue;

    const slice = snapshot.byConcept[row.conceptId];
    const lastFail = evidence
      .filter((item) => item.conceptId === row.conceptId && item.processMetrics?.flags?.exceededRiskLimit)
      .at(-1);
    const lastProcessNote = lastFail
      ? `You have practiced ${row.title.toLowerCase()}, but a recent simulation exceeded your planned risk.`
      : undefined;

    const picked = pickHrefForStep({
      conceptId: row.conceptId,
      loopStep,
      complexity: beginner ? 'foundations' : complexity,
      recent,
      rem: row.remediation,
      promptHref: adaptive.href ?? row.nextDemonstration?.href,
      snapshot,
    });
    const href =
      priority === 'remediation' && row.remediation?.steps.length
        ? picked.href
        : consecutiveFailCount(evidence.filter((item) => item.conceptId === row.conceptId)) >= 2
          ? adaptive.href
          : picked.href;

    const kind: TrainingQueueKind =
      priority === 'remediation'
        ? 'remediation'
        : priority === 'redemonstration'
          ? 'redemonstration'
          : href.includes('replay-tv')
            ? 'historical_replay'
            : href.startsWith('/simulate')
              ? 'simulation_challenge'
              : href.startsWith('/academy')
                ? 'continue_lesson'
                : picked.kind;

    const why = whyFor({
      priority,
      conceptTitle: row.title,
      explanations: row.explanations,
      diagnosis: row.remediation?.diagnosis,
      conceal: Boolean(conceal && (priority === 'redemonstration' || loopStep === 'redemonstrate' || adaptive.concealConcept)),
      deferCount,
      missingRoles: row.missingRoles,
      drillAttempts: (slice?.drillAttempts ?? 0) + (slice?.quizAttempts ?? 0),
      lastProcessNote,
    });

    const namedTitle =
      row.state === 'needs_remediation'
        ? `Practice ${row.title}`
        : row.state === 'due_for_redemonstration'
          ? `${row.title} is due for re-demonstration`
          : row.state === 'learning'
            ? `Demonstrate ${row.title}`
            : `Apply ${row.title}.`;

    out.push({
      id: idBase,
      conceptId: row.conceptId,
      title: deliberateTitle(scaffolding, namedTitle),
      priority,
      loopStep,
      kind,
      whyToday:
        adaptive.falseMastery || adaptive.concealConcept
          ? adaptive.reason
          : conceal
            ? deliberateWhy(scaffolding, why)
            : why,
      evidence: row.explanations.slice(0, 3),
      href,
      complexity: beginner ? 'foundations' : minComplexity(adaptive.complexity, policy.complexity),
      concealConcept: Boolean(
        conceal && (priority === 'redemonstration' || loopStep === 'redemonstrate' || scaffolding.concealConcept || adaptive.concealConcept),
      ),
      deferCount,
      transferStep: laterTransferStep(adaptive.transferStep, policy.minTransferStep),
      showHints: adaptive.showHints,
      showExamples: adaptive.showExamples,
    });
  }

  return out;
}

function candidatesFromLegacySnapshot(
  snapshot: LearningEvidenceSnapshot,
  dispositions: Record<string, QueueDisposition>,
  conceptDeferCounts: Record<string, number>,
  recent: string[],
): Candidate[] {
  const now = snapshot.now;
  const mastery = scoreAllConceptMastery(snapshot.byConcept, now);
  const beginner = isBeginner(snapshot.experience);
  const out: Candidate[] = [];

  const developing = mastery.find((row) => row.state === 'developing');
  if (developing && !(beginner && ADVANCED_CONCEPTS.has(developing.conceptId))) {
    const id = `remediation-${developing.conceptId}`;
    const deferCount = deferCountFor(developing.conceptId, id, dispositions, conceptDeferCounts);
    const complexity = beginner ? 'foundations' : targetComplexityFor(snapshot.byConcept[developing.conceptId]);
    const picked = pickHrefForStep({
      conceptId: developing.conceptId,
      loopStep: 'remediate',
      complexity,
      recent,
      snapshot,
    });
    out.push({
      id,
      conceptId: developing.conceptId,
      title: `Practice ${developing.title}`,
      priority: 'remediation',
      loopStep: 'remediate',
      kind: 'remediation',
      whyToday: whyFor({
        priority: 'remediation',
        conceptTitle: developing.title,
        explanations: developing.evidence,
        deferCount,
        conceal: false,
        drillAttempts: snapshot.byConcept[developing.conceptId]?.drillAttempts,
      }),
      evidence: developing.evidence,
      href: picked.href,
      complexity: 'foundations',
      concealConcept: false,
      deferCount,
    });
  }

  const due = mastery.find((row) => isSpacedReviewDue(row, now));
  if (due && !(beginner && ADVANCED_CONCEPTS.has(due.conceptId))) {
    const id = `redemo-${due.conceptId}`;
    const deferCount = deferCountFor(due.conceptId, id, dispositions, conceptDeferCounts);
    const picked = pickHrefForStep({
      conceptId: due.conceptId,
      loopStep: 'redemonstrate',
      complexity: 'applied',
      recent,
      snapshot,
    });
    out.push({
      id,
      conceptId: due.conceptId,
      title: `${due.title} is due for re-demonstration`,
      priority: 'redemonstration',
      loopStep: 'redemonstrate',
      kind: 'redemonstration',
      whyToday: whyFor({
        priority: 'redemonstration',
        conceptTitle: due.title,
        explanations: due.evidence,
        conceal: false,
        deferCount,
      }),
      evidence: due.lastSuccessAt
        ? [`Last successful demonstration ${new Date(due.lastSuccessAt).toISOString().slice(0, 10)}.`]
        : due.evidence,
      href: picked.href,
      concealConcept: false,
      deferCount,
    });
  }

  const exposed = mastery.find((row) => row.state === 'exposed');
  if (exposed && !(beginner && ADVANCED_CONCEPTS.has(exposed.conceptId))) {
    const id = `progress-${exposed.conceptId}`;
    const deferCount = deferCountFor(exposed.conceptId, id, dispositions, conceptDeferCounts);
    const picked = pickHrefForStep({
      conceptId: exposed.conceptId,
      loopStep: 'demonstrate',
      complexity: 'foundations',
      recent,
      snapshot,
    });
    out.push({
      id,
      conceptId: exposed.conceptId,
      title: `Demonstrate ${exposed.title}`,
      priority: 'in_progress',
      loopStep: 'demonstrate',
      kind: picked.kind,
      whyToday: whyFor({
        priority: 'in_progress',
        conceptTitle: exposed.title,
        explanations: exposed.evidence,
        conceal: false,
        deferCount,
      }),
      evidence: exposed.evidence,
      href: picked.href,
      complexity: 'foundations',
      concealConcept: false,
      deferCount,
    });
  }

  return out;
}

function continueLessonCandidate(
  snapshot: LearningEvidenceSnapshot,
  dispositions: Record<string, QueueDisposition>,
  conceptDeferCounts: Record<string, number>,
): Candidate | null {
  const continueId = snapshot.openedLessonIds[0] ?? snapshot.nextLessonId;
  if (!continueId || !ALL_LESSONS.some((lesson) => lesson.id === continueId)) return null;
  const conceptId = primaryConceptForLesson(continueId)?.id;
  const id = `continue-${continueId}`;
  const opened = snapshot.openedLessonIds.includes(continueId);
  const deferCount = deferCountFor(conceptId, id, dispositions, conceptDeferCounts);
  const title = lessonTitle(continueId);
  return {
    id,
    conceptId,
    title: opened ? `Continue: ${title}` : `Next lesson: ${title}`,
    priority: opened ? 'in_progress' : 'curriculum',
    loopStep: opened ? 'learn' : 'learn',
    kind: 'continue_lesson',
    whyToday: opened
      ? whyFor({
          priority: 'in_progress',
          conceptTitle: conceptId ? conceptTitle(conceptId) : title,
          explanations: ['Academy progress / opened lesson.'],
          conceal: false,
          deferCount,
        })
      : whyFor({
          priority: 'curriculum',
          conceptTitle: title,
          explanations: ['Next lesson on your path — chosen from the curriculum, not at random.'],
          conceal: false,
          deferCount,
        }),
    evidence: ['Academy progress / recommended path.'],
    href: `/academy/lesson/${continueId}`,
    concealConcept: false,
    deferCount,
  };
}

function curriculumCandidate(
  snapshot: LearningEvidenceSnapshot,
  competency: CompetencyMastery[],
  dispositions: Record<string, QueueDisposition>,
  conceptDeferCounts: Record<string, number>,
): Candidate {
  const done = new Set(
    competency.filter((row) => row.state !== 'not_started').map((row) => row.conceptId),
  );
  const sliceDone = Object.values(snapshot.byConcept).filter(
    (row) => row.lessonRead || row.drillAttempts > 0 || row.successCount > 0,
  );
  for (const row of sliceDone) done.add(row.conceptId);

  const next =
    BEGINNER_CURRICULUM.find((item) => !item.conceptId || !done.has(item.conceptId)) ?? BEGINNER_CURRICULUM[0]!;
  const id = `curriculum-${next.conceptId ?? 'foundations'}`;
  const deferCount = deferCountFor(next.conceptId, id, dispositions, conceptDeferCounts);
  return {
    id,
    conceptId: next.conceptId,
    title: next.title,
    priority: 'curriculum',
    loopStep: 'learn',
    kind: 'continue_lesson',
    whyToday: whyFor({
      priority: 'curriculum',
      conceptTitle: next.title,
      explanations: ['Beginner curriculum order.'],
      conceal: false,
      deferCount,
    }),
    evidence: ['Curriculum order: foundations, charts, risk, invalidation, thesis, psychology.'],
    href: next.href,
    complexity: 'foundations',
    concealConcept: false,
    deferCount,
  };
}

function journalCandidate(snapshot: LearningEvidenceSnapshot): Candidate {
  const simNoJournal = snapshot.hasSimulation && !snapshot.hasJournal;
  return {
    id: 'journal-review',
    title: simNoJournal ? 'Review your last simulated decision' : snapshot.hasJournal ? 'Journal review' : 'Start a decision journal',
    priority: simNoJournal ? 'in_progress' : 'varied_practice',
    loopStep: 'review',
    kind: 'journal_review',
    whyToday: simNoJournal
      ? 'You have a simulation on the book but no journal yet. Review that decision: name the thesis, invalidation, and what you would change. Simulated P/L is context.'
      : snapshot.hasJournal
        ? 'A written review is part of the loop. Name process, invalidation, and what you would change. P/L is context.'
        : 'A written decision is evidence. The coach cannot guess what you meant.',
    evidence: snapshot.hasJournal ? ['Existing journal entries.'] : ['No journal yet.'],
    href: snapshot.hasJournal && !simNoJournal ? '/review' : '/journal',
    concealConcept: false,
    deferCount: 0,
  };
}

function simulationCandidate(snapshot: LearningEvidenceSnapshot): Candidate {
  return {
    id: 'sim-challenge',
    title: snapshot.hasSimulation ? 'Advance the uncertain paper book' : 'Simulation challenge',
    priority: 'varied_practice',
    loopStep: 'apply',
    kind: 'simulation_challenge',
    whyToday: snapshot.hasSimulation
      ? 'Keep writing thesis and size. Simulated P/L does not grade the decision and does not decide this recommendation.'
      : 'Open a $100,000 fictional book and apply one concept under uncertainty. Simulated P/L does not grade the decision. Unique synthetic path — seed is never shown.',
    evidence: ['Unique synthetic path. Seed is never shown. Process evidence only.'],
    href: '/simulate?start=1',
    concealConcept: false,
    deferCount: 0,
  };
}

function variedPracticeCandidate(
  snapshot: LearningEvidenceSnapshot,
  competency: CompetencyMastery[],
  evidence: CompetencyEvidenceRecord[],
  recent: string[],
  advanced: boolean,
): Candidate | null {
  const practiced = competency.filter(
    (row) => row.state === 'demonstrated' || row.state === 'practiced' || row.state === 'due_for_redemonstration',
  );
  if (practiced.length < 2 && evidence.length < 4) return null;

  const contexts = evidence.map((item) => item.scenarioContext ?? 'standard');
  const last = contexts.at(-1);
  const clustered = last != null && contexts.filter((item) => item === last).length >= Math.max(3, Math.ceil(contexts.length * 0.6));
  if (!clustered && !advanced) return null;

  const conceptId = practiced[0]?.conceptId ?? 'thesis';
  const prompt = selectNextDemonstration(conceptId, evidence.filter((item) => item.conceptId === conceptId));
  const href = rotateAwayFromRecent(
    [prompt.href, '/simulate?start=1', '/simulate?start=1&focus=thesis_discipline'],
    recent,
  );
  return {
    id: `varied-${conceptId}`,
    conceptId,
    title: advanced ? 'Assess this situation and make your decision.' : 'Mixed practice scenario',
    priority: 'varied_practice',
    loopStep: 'apply',
    kind: 'simulation_challenge',
    whyToday: whyFor({
      priority: 'varied_practice',
      conceptTitle: conceptTitle(conceptId),
      explanations: [],
      conceal: advanced,
      deferCount: 0,
    }),
    evidence: ['Anti-repetition: vary scenario, context, and format.'],
    href,
    concealConcept: advanced,
    deferCount: 0,
  };
}

function eventPrepCandidate(snapshot: LearningEvidenceSnapshot, masteryHasEvent: boolean): Candidate | null {
  const canEvent =
    snapshot.eventPlan &&
    snapshot.experience &&
    (isEventPersonalizationEligible(snapshot.experience) ||
      (EVENT_OK.has(snapshot.experience) && masteryHasEvent));
  if (!canEvent || !snapshot.eventPlan) return null;
  const gap = snapshot.eventPlan.practiceGapNote;
  const reason = gap
    ? `${gap} Prepare educationally — do not predict the print.`
    : 'An upcoming event type matches your level. Prepare educationally — do not predict the print.';
  return {
    id: `event-${snapshot.eventPlan.eventTitle}`,
    kind: 'event_prep',
    title: snapshot.eventPlan.headline,
    whyToday: reason,
    evidence: [snapshot.eventPlan.reminder],
    href: '/events',
    loopStep: 'learn',
    priority: 'event_driven',
    concealConcept: false,
    deferCount: 0,
  };
}

export function toEngineQueueItem(candidate: TrainingEngineCandidate): TrainingQueueItem {
  const href = withConceptHandoff(candidate.href, {
    conceptId: candidate.conceptId,
    loop: candidate.loopStep,
    conceal: candidate.concealConcept,
    priority: candidate.priority,
    transferStep: candidate.transferStep,
    showHints: candidate.showHints,
    showExamples: candidate.showExamples,
  });
  return {
    id: candidate.id,
    kind: candidate.kind,
    title: candidate.title,
    reason: candidate.whyToday,
    whyToday: candidate.whyToday,
    evidence: candidate.evidence,
    href,
    conceptId: candidate.conceptId,
    complexity: candidate.complexity,
    loopStep: candidate.loopStep,
    priority: candidate.priority,
    concealConcept: candidate.concealConcept,
    transferStep: candidate.transferStep,
    showHints: candidate.showHints,
    showExamples: candidate.showExamples,
  };
}

export function emptyStateOf(
  snapshot: LearningEvidenceSnapshot,
  competency: CompetencyMastery[],
  lead: TrainingQueueItem | undefined,
): TrainingEmptyState {
  const noEvidence =
    competency.every((row) => row.state === 'not_started') &&
    !snapshot.openedLessonIds.length &&
    !snapshot.hasJournal &&
    !snapshot.hasSimulation &&
    Object.values(snapshot.byConcept).every(
      (row) => !row.lessonRead && row.drillAttempts === 0 && row.quizAttempts === 0,
    );
  if (noEvidence) return 'new_user';
  if (snapshot.hasSimulation && !snapshot.hasJournal && lead?.kind === 'journal_review') return 'sim_no_journal';
  if (lead?.priority === 'weak_competency' || lead?.priority === 'remediation') return 'weak_competency';
  if (lead?.priority === 'varied_practice' && lead.concealConcept) return 'strong_mixed';
  if (demonstratedCount(competency) >= 4 && lead?.kind === 'simulation_challenge') return 'strong_mixed';
  return 'standard';
}

export function headlineFor(state: TrainingEmptyState, lead: TrainingQueueItem | undefined): string {
  if (state === 'new_user') return 'Start with Foundations.';
  if (state === 'sim_no_journal') return 'Review your last simulated decision.';
  if (state === 'weak_competency') return 'Practice your weakest area.';
  if (state === 'strong_mixed') return 'Try a mixed scenario that tests multiple skills.';
  return lead?.title ?? 'Start with Foundations.';
}

function hasAnyCompetencySignal(rows: CompetencyMastery[], evidence: CompetencyEvidenceRecord[]): boolean {
  return evidence.length > 0 || rows.some((row) => row.state !== 'not_started');
}

export function isQueueItemVisible(
  item: { id: string },
  dispositions: Record<string, QueueDisposition>,
  now: number,
): boolean {
  return visible(item as TrainingQueueItem, dispositions, now);
}

export interface TrainingCandidatePool {
  pool: TrainingEngineCandidate[];
  grinding: ReturnType<typeof detectEasySessionGrinding>;
  stage: ReturnType<typeof overallPracticeStage>;
  focusAreas: ReturnType<typeof detectFocusAreas>;
  competency: CompetencyMastery[];
  evidence: CompetencyEvidenceRecord[];
  advanced: boolean;
  beginner: boolean;
}

/**
 * Candidate activities only. The Training Planner ranks the final next action.
 * Simulated P/L is never a ranking input.
 */
export function buildTrainingCandidatePool(
  snapshot: LearningEvidenceSnapshot,
  dispositions: Record<string, QueueDisposition> = {},
  options: ComposeTodaysTrainingOptions = {},
): TrainingCandidatePool {
  const now = snapshot.now;
  const recent = options.recentActivityKeys ?? [];
  const conceptDeferCounts = options.conceptDeferCounts ?? {};
  const evidence = options.evidence ?? [];
  const competency =
    options.competency ?? (evidence.length ? scoreAllCompetencyMastery(evidence, now) : []);
  const focusAreas = detectFocusAreas(snapshot);
  const beginner = isBeginner(snapshot.experience);
  const advanced = isAdvancedProfile(snapshot, competency);

  const grinding = detectEasySessionGrinding(evidence, now);
  const stage = overallPracticeStage({
    competency,
    evidence,
    experience: snapshot.experience,
  });

  const pool: Candidate[] = [];

  if (hasAnyCompetencySignal(competency, evidence)) {
    pool.push(
      ...candidatesFromCompetency(competency, snapshot, evidence, recent, dispositions, conceptDeferCounts),
    );
  } else {
    pool.push(...candidatesFromLegacySnapshot(snapshot, dispositions, conceptDeferCounts, recent));
  }

  const continued = continueLessonCandidate(snapshot, dispositions, conceptDeferCounts);
  if (continued && !pool.some((item) => item.id === continued.id)) pool.push(continued);

  const noSignal =
    !hasAnyCompetencySignal(competency, evidence) &&
    !snapshot.openedLessonIds.length &&
    Object.values(snapshot.byConcept).every((row) => !row.lessonRead && row.drillAttempts === 0);
  if (noSignal || beginner) {
    const curriculum = curriculumCandidate(snapshot, competency, dispositions, conceptDeferCounts);
    if (!pool.some((item) => item.priority === 'curriculum' && item.conceptId === curriculum.conceptId)) {
      pool.push(curriculum);
    }
  }

  if (snapshot.hasSimulation && !snapshot.hasJournal) {
    pool.push(journalCandidate(snapshot));
  }

  const varied = variedPracticeCandidate(snapshot, competency, evidence, recent, advanced);
  if (varied) pool.push(varied);

  if (stage === 'maintenance' || stage === 'deliberate') {
    const maintenance = pickMaintenanceConcept(competency, varied?.conceptId);
    if (
      maintenance &&
      !pool.some((item) => item.conceptId === maintenance.conceptId && item.priority === 'redemonstration')
    ) {
      const prompt = maintenance.nextDemonstration;
      pool.push({
        id: `maintain-${maintenance.conceptId}`,
        conceptId: maintenance.conceptId,
        title: advanced ? 'Assess this situation and make your decision.' : `Revisit ${maintenance.title} in a new context`,
        priority: maintenance.state === 'due_for_redemonstration' ? 'redemonstration' : 'varied_practice',
        loopStep: 'redemonstrate',
        kind: 'redemonstration',
        whyToday: advanced
          ? 'Assess this situation and make your decision. Previously demonstrated process still needs an unfamiliar context.'
          : `A demonstrated skill returns in a different context. Recency and variety matter more than an old success.`,
        evidence: ['Spaced maintenance: old success does not permanently guarantee mastery.'],
        href: prompt?.href ?? '/simulate?start=1&focus=uncertainty',
        concealConcept: advanced,
        deferCount: 0,
      });
    }
  }

  if (!pool.some((item) => item.kind === 'simulation_challenge')) {
    pool.push(simulationCandidate(snapshot));
  }
  if (!pool.some((item) => item.kind === 'journal_review')) {
    pool.push(journalCandidate(snapshot));
  }

  const masteryHasEvent = competency.some((row) => row.conceptId === 'event-risk' && row.state !== 'not_started');
  const eventItem = eventPrepCandidate(snapshot, masteryHasEvent);
  if (eventItem && !beginner && !pool.some((item) => item.id === eventItem.id)) {
    pool.push(eventItem);
  }

  if (!pool.some((item) => item.id === 'explore-library')) {
    pool.push({
      id: 'explore-library',
      title: 'Browse the exercise library',
      priority: 'optional_exploration',
      loopStep: 'practice',
      kind: 'chart_exercise',
      whyToday: 'Optional exploration — only if you want a different drill than the planner’s next activity.',
      evidence: ['Learner-chosen exploration, not a ranked gap.'],
      href: '/practice',
      concealConcept: false,
      deferCount: 0,
    });
  }

  return { pool, grinding, stage, focusAreas, competency, evidence, advanced, beginner };
}
