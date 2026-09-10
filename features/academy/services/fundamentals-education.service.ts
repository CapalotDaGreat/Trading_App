import { ALL_LESSONS } from '../content';
import { LEARNING_PATHS } from '../content/paths-and-checklists';
import type { Lesson, LessonExercise, LessonExerciseKind } from '../types/academy.types';
import { PRACTICE_DRILLS, type PracticeDrill } from '@/features/practice/content/practice-drills';
import {
  DRILL_CONCEPT_IDS,
  TRANSFER_DRILL_IDS,
  recipeFor,
  resolveCompetencyId,
  sourceTypeForLessonExercise,
} from '@/features/competency';
import { getConcept } from '@/features/learning-engine/services/learning-graph.service';

export const FUNDAMENTAL_PROGRESSION_STEPS = [
  'explanation',
  'recognition',
  'guided_interpretation',
  'independent_interpretation',
  'comparison',
  'unfamiliar_scenario',
  'mixed_application',
  'review',
] as const;

export type FundamentalProgressionStep = (typeof FUNDAMENTAL_PROGRESSION_STEPS)[number];

/** Canonical FA family IDs. Profitability / margins / cash-flow alias to earnings. */
export const IMPORTANT_FUNDAMENTAL_CONCEPTS = [
  'revenue-growth',
  'earnings',
  'balance-sheet',
  'valuation',
  'competitive-position',
  'business-quality',
  'fundamental-uncertainty',
] as const;

export type ImportantFundamentalConcept = (typeof IMPORTANT_FUNDAMENTAL_CONCEPTS)[number];

const MCQ_KINDS = new Set<LessonExerciseKind>(['identify', 'select', 'rank', 'choose']);
const APPLIED_KINDS = new Set<LessonExerciseKind>(['scenario', 'compare', 'explain', 'annotate']);
const INTRO_LESSON_IDS = new Set(['fund-basics']);

/** Correct-answer / takeaway copy must not become a trade instruction. Prompts may quote the misconception. */
const RECOMMENDATION_COPY =
  /\b(buy this|sell this|short this|buy now|sell now|guaranteed (return|profit)|price target)\b/i;

export interface FundamentalLessonGap {
  lessonId: string;
  missing: string[];
}

export interface FundamentalLessonAudit {
  lessonId: string;
  title: string;
  conceptIds: string[];
  unresolvedConceptIds: string[];
  appliedExerciseIds: string[];
  recognitionExerciseIds: string[];
  practiceDrillIds: string[];
  hasSimulation: boolean;
  hasReplay: boolean;
  hasJournal: boolean;
  hasPrerequisites: boolean;
  recommendationHits: string[];
  missing: string[];
}

export interface FundamentalConceptProgression {
  conceptId: string;
  lessonIds: string[];
  drillIds: string[];
  present: FundamentalProgressionStep[];
  missing: FundamentalProgressionStep[];
  recipeRequiresApplication: boolean;
}

export interface FundamentalsEducationAudit {
  lessons: FundamentalLessonAudit[];
  concepts: FundamentalConceptProgression[];
  pathLessonIds: string[];
  ok: boolean;
}

function hrefList(lesson: Lesson): string[] {
  return [
    ...(lesson.practiceLinks ?? []).map((link) => link.href),
    ...(lesson.simulationLinks ?? []).map((link) => link.href),
    ...(lesson.replayLinks ?? []).map((link) => link.href),
    lesson.journalHref ?? '',
  ].filter(Boolean);
}

function drillIdFromHref(href: string): string | null {
  const match = href.match(/[?&]drill=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function replayIdFromHref(href: string): string | null {
  const match = href.match(/[?&]episode=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function resolveId(raw: string | undefined): string | null {
  if (!raw) return null;
  return resolveCompetencyId(raw);
}

function exerciseTouches(exercise: LessonExercise, conceptId: string): boolean {
  const primary = resolveId(exercise.conceptId);
  if (primary === conceptId) return true;
  return (exercise.interactingConceptIds ?? []).some((id) => resolveId(id) === conceptId);
}

function correctCopy(exercise: LessonExercise): string[] {
  const out: string[] = [exercise.explanation, exercise.modelAnswer ?? ''];
  if (exercise.choices && exercise.correctIndex != null) {
    out.push(exercise.choices[exercise.correctIndex] ?? '');
  }
  if (exercise.correctIndex === 0 && exercise.leftLabel) out.push(exercise.leftLabel);
  if (exercise.correctIndex === 1 && exercise.rightLabel) out.push(exercise.rightLabel);
  return out.filter(Boolean);
}

function lessonRecommendationHits(lesson: Lesson): string[] {
  const blobs = [
    ...(lesson.keyTakeaways ?? []),
    ...(lesson.limitations ?? []),
    ...(lesson.quiz ?? []).flatMap((question) => [
      question.choices[question.correctIndex] ?? '',
      question.explanation,
    ]),
    ...(lesson.exercises ?? []).flatMap(correctCopy),
  ];
  return blobs.filter((text) => RECOMMENDATION_COPY.test(text));
}

export function fundamentalAnalysisLessons(): Lesson[] {
  return ALL_LESSONS.filter((lesson) => lesson.category === 'fundamental_analysis');
}

export function auditFundamentalLesson(lesson: Lesson): FundamentalLessonAudit {
  const declared = [...(lesson.conceptIds ?? [])];
  const fromMapExtras = [
    ...(lesson.exercises ?? []).flatMap((exercise) => [
      exercise.conceptId,
      ...(exercise.interactingConceptIds ?? []),
    ]),
    ...(lesson.quiz ?? []).map((question) => question.conceptId),
  ].filter((id): id is string => Boolean(id));
  const conceptIds = [...new Set([...declared, ...fromMapExtras])];
  const unresolvedConceptIds = conceptIds.filter((id) => !resolveId(id));

  const appliedExerciseIds = (lesson.exercises ?? [])
    .filter((exercise) => APPLIED_KINDS.has(exercise.kind))
    .map((exercise) => exercise.id);
  const recognitionExerciseIds = (lesson.exercises ?? [])
    .filter((exercise) => MCQ_KINDS.has(exercise.kind))
    .map((exercise) => exercise.id);

  const hrefs = hrefList(lesson);
  const practiceDrillIds = hrefs.map(drillIdFromHref).filter((id): id is string => Boolean(id));
  const hasSimulation = hrefs.some((href) => href.includes('/simulate'));
  const graph = declared.map((id) => getConcept(resolveId(id) ?? id)).find(Boolean);
  const hasReplay =
    hrefs.some((href) => href.includes('replay-tv') || href.includes('/decision/replay')) ||
    Boolean(graph?.replayIds.length) ||
    hrefs.map(replayIdFromHref).some(Boolean);
  const hasJournal = Boolean(lesson.journalHref);
  const hasPrerequisites = INTRO_LESSON_IDS.has(lesson.id) || Boolean(lesson.prerequisiteIds?.length);
  const recommendationHits = lessonRecommendationHits(lesson);

  const missing: string[] = [];
  if (unresolvedConceptIds.length) missing.push('unresolved_concept_ids');
  if (!declared.length) missing.push('concept_ids');
  if (!appliedExerciseIds.length) missing.push('applied_exercises');
  if (!recognitionExerciseIds.length && !lesson.quiz.length) missing.push('recognition');
  if (!practiceDrillIds.length) missing.push('practice_drills');
  if (!hasSimulation) missing.push('simulation');
  if (!hasReplay) missing.push('replay');
  if (!hasJournal) missing.push('journal_review');
  if (!hasPrerequisites) missing.push('prerequisites');
  if (!lesson.quiz.length) missing.push('quiz');
  if (recommendationHits.length) missing.push('recommendation_copy');

  return {
    lessonId: lesson.id,
    title: lesson.title,
    conceptIds: declared.map((id) => resolveId(id) ?? id),
    unresolvedConceptIds,
    appliedExerciseIds,
    recognitionExerciseIds,
    practiceDrillIds,
    hasSimulation,
    hasReplay,
    hasJournal,
    hasPrerequisites,
    recommendationHits,
    missing,
  };
}

function drillsForConcept(conceptId: string): PracticeDrill[] {
  return PRACTICE_DRILLS.filter((drill) =>
    (DRILL_CONCEPT_IDS[drill.id] ?? []).some((id) => resolveId(id) === conceptId),
  );
}

function coveringLessons(conceptId: string): Lesson[] {
  return fundamentalAnalysisLessons().filter((lesson) => {
    const onLesson = (lesson.conceptIds ?? []).some((id) => resolveId(id) === conceptId);
    const onExercise = (lesson.exercises ?? []).some((exercise) => exerciseTouches(exercise, conceptId));
    const onQuiz = (lesson.quiz ?? []).some((question) => resolveId(question.conceptId) === conceptId);
    return onLesson || onExercise || onQuiz;
  });
}

export function auditFundamentalConceptProgression(conceptId: string): FundamentalConceptProgression {
  const lessons = coveringLessons(conceptId);
  const drills = drillsForConcept(conceptId);
  const exercises = lessons.flatMap((lesson) => lesson.exercises ?? []);
  const touching = exercises.filter((exercise) => exerciseTouches(exercise, conceptId));
  const primaryApplied = touching.filter(
    (exercise) => APPLIED_KINDS.has(exercise.kind) && resolveId(exercise.conceptId) === conceptId,
  );
  const recipe = recipeFor(conceptId);
  const present = new Set<FundamentalProgressionStep>();

  if (lessons.some((lesson) => lesson.sections.length > 0 && lesson.whyItMatters)) {
    present.add('explanation');
  }
  if (
    lessons.some((lesson) => lesson.quiz.some((question) => resolveId(question.conceptId) === conceptId)) ||
    touching.some((exercise) => MCQ_KINDS.has(exercise.kind) && resolveId(exercise.conceptId) === conceptId)
  ) {
    present.add('recognition');
  }
  if (touching.some((exercise) => APPLIED_KINDS.has(exercise.kind) && exercise.guided)) {
    present.add('guided_interpretation');
  }
  if (
    primaryApplied.some((exercise) => !exercise.guided && !exercise.asTransfer) ||
    drills.length > 0
  ) {
    present.add('independent_interpretation');
  }
  if (
    touching.some((exercise) => exercise.kind === 'compare') ||
    drills.some((drill) => drill.id === 'compare-two-businesses' || /versus|vs\.|compared/i.test(drill.prompt))
  ) {
    present.add('comparison');
  }
  if (
    touching.some((exercise) => exercise.asTransfer) ||
    drills.some((drill) => TRANSFER_DRILL_IDS.has(drill.id))
  ) {
    present.add('unfamiliar_scenario');
  }
  if (
    touching.some(
      (exercise) =>
        (exercise.interactingConceptIds ?? []).some((id) => resolveId(id) === conceptId) ||
        (resolveId(exercise.conceptId) === conceptId && (exercise.interactingConceptIds ?? []).length > 0),
    ) ||
    drills.some((drill) => (DRILL_CONCEPT_IDS[drill.id] ?? []).length > 1)
  ) {
    present.add('mixed_application');
  }
  if (lessons.some((lesson) => lesson.quiz.length > 0 && lesson.journalHref)) {
    present.add('review');
  }

  return {
    conceptId,
    lessonIds: lessons.map((lesson) => lesson.id),
    drillIds: drills.map((drill) => drill.id),
    present: FUNDAMENTAL_PROGRESSION_STEPS.filter((step) => present.has(step)),
    missing: FUNDAMENTAL_PROGRESSION_STEPS.filter((step) => !present.has(step)),
    recipeRequiresApplication: recipe.requirements.some((item) => item.role === 'application'),
  };
}

export function auditFundamentalsEducation(): FundamentalsEducationAudit {
  const lessons = fundamentalAnalysisLessons().map(auditFundamentalLesson);
  const concepts = IMPORTANT_FUNDAMENTAL_CONCEPTS.map(auditFundamentalConceptProgression);
  const pathLessonIds = LEARNING_PATHS.find((path) => path.id === 'path-beyond-charts')?.lessonIds ?? [];
  const ok =
    lessons.every((item) => item.missing.length === 0) &&
    concepts.every((item) => item.missing.length === 0 && item.recipeRequiresApplication);
  return { lessons, concepts, pathLessonIds, ok };
}

export function isFundamentalAppliedKind(kind: LessonExerciseKind | string | undefined): boolean {
  return Boolean(kind && APPLIED_KINDS.has(kind as LessonExerciseKind));
}

export function fundamentalExerciseEvidenceType(kind: LessonExerciseKind | string | undefined) {
  return sourceTypeForLessonExercise(kind);
}

export function lessonGaps(audit = auditFundamentalsEducation()): FundamentalLessonGap[] {
  return audit.lessons
    .filter((item) => item.missing.length)
    .map((item) => ({ lessonId: item.lessonId, missing: item.missing }));
}
