import { ALL_LESSONS } from '../content';
import type { Lesson } from '../types/academy.types';
import {
  DRILL_CONCEPT_IDS,
  LESSON_CONCEPT_IDS,
  TRANSFER_DRILL_IDS,
} from '@/features/competency/content/activity-concept-map';
import { COMPETENCY_CONCEPTS } from '@/features/competency/content/competency-taxonomy';
import { resolveCompetencyId } from '@/features/competency/services/taxonomy.service';
import { REPLAY_TV_EPISODES } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import { conceptIdsForReplayEpisode } from '@/features/decision-replay-tv/services/replay-scenario.adapter';
import { LEARNING_CONCEPTS } from '@/features/learning-engine/content/learning-graph';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';

/** Foundational families the curriculum must close — not the entire taxonomy. */
export const PRIORITY_CURRICULUM_CONCEPTS = [
  'position-sizing',
  'risk-per-trade',
  'invalidation',
  'uncertainty',
  'thesis',
  'volatility-aware-risk',
  'chart-interpretation',
  'support',
  'false-breakouts',
  'event-risk',
  'fomo',
  'confirmation-bias',
  'overconfidence',
  'revenge-trading',
  'earnings',
  'valuation',
  'fundamental-uncertainty',
] as const;

export type PriorityCurriculumConcept = (typeof PRIORITY_CURRICULUM_CONCEPTS)[number];

export const PRIMARY_LESSON_BY_CONCEPT: Record<PriorityCurriculumConcept, string> = {
  'position-sizing': 'risk-position-sizing',
  'risk-per-trade': 'risk-per-trade',
  invalidation: 'dec-invalidation',
  uncertainty: 'dec-uncertainty',
  thesis: 'dec-thesis',
  'volatility-aware-risk': 'foundations-volatility',
  'chart-interpretation': 'ta-trend-range',
  support: 'ta-structure',
  'false-breakouts': 'ta-false-breakouts',
  'event-risk': 'fund-calendar',
  fomo: 'psych-fomo',
  'confirmation-bias': 'psych-confirmation',
  overconfidence: 'psych-overconfidence',
  'revenge-trading': 'psych-revenge',
  earnings: 'fund-statements',
  valuation: 'fund-valuation-quality',
  'fundamental-uncertainty': 'fund-valuation-quality',
};

const CHART_REQUIRED = new Set<string>([
  'support',
  'false-breakouts',
  'chart-interpretation',
  'risk-per-trade',
  'position-sizing',
  'invalidation',
  'volatility-aware-risk',
]);

export type CoverageStatus = 'closed_loop' | 'partial' | 'nominal';

export interface ConceptCoverageRow {
  conceptId: string;
  title: string;
  family: string;
  status: CoverageStatus;
  lessonIds: string[];
  drillIds: string[];
  replayIds: string[];
  graphNode: boolean;
  hasSimulation: boolean;
  hasTransfer: boolean;
  primaryLessonId: string | null;
  missingFlagshipFields: string[];
}

function canonical(id: string): string | null {
  return resolveCompetencyId(id);
}

function lessonHrefs(lesson: Lesson): string[] {
  return [
    ...lesson.practiceLinks.map((link) => link.href),
    ...(lesson.simulationLinks ?? []).map((link) => link.href),
    ...(lesson.replayLinks ?? []).map((link) => link.href),
  ];
}

function episodeIdFromHref(href: string): string | null {
  const match = href.match(/[?&]episode=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function drillIdFromHref(href: string): string | null {
  const match = href.match(/[?&]drill=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function lessonHasChart(lesson: Lesson): boolean {
  if (lesson.educationalCharts?.length) return true;
  return lesson.sections.some((section) => Boolean(section.chart));
}

function flagshipGaps(lesson: Lesson | undefined, conceptId: string): string[] {
  if (!lesson) return ['primary_lesson'];
  const hrefs = lessonHrefs(lesson);
  const missing: string[] = [];
  if (!lesson.learningObjectives?.length) missing.push('objectives');
  if (!lesson.whyItMatters) missing.push('why_it_matters');
  if (!lesson.commonMistakes?.length) missing.push('common_mistakes');
  if (!lesson.whenItWorks?.length) missing.push('when_it_works');
  if (!lesson.whenItFails?.length) missing.push('when_it_fails');
  if (!lesson.exercises?.length) missing.push('mini_exercise');
  if (!lesson.quiz.length) missing.push('knowledge_check');
  if (!lesson.keyTakeaways.length) missing.push('takeaways');
  if (!hrefs.some((href) => drillIdFromHref(href))) missing.push('practice_connection');
  if (!hrefs.some((href) => href.includes('/simulate'))) missing.push('simulation_connection');
  if (!hrefs.some((href) => Boolean(episodeIdFromHref(href)) || href.includes('replay-tv') || href.includes('/decision/replay'))) {
    missing.push('replay_connection');
  }
  if (CHART_REQUIRED.has(conceptId) && !lessonHasChart(lesson)) missing.push('visual_chart');
  return missing;
}

function indexByConcept(): {
  lessons: Map<string, Set<string>>;
  drills: Map<string, Set<string>>;
  replays: Map<string, Set<string>>;
  transfer: Map<string, Set<string>>;
  simulation: Set<string>;
  graph: Set<string>;
} {
  const lessons = new Map<string, Set<string>>();
  const drills = new Map<string, Set<string>>();
  const replays = new Map<string, Set<string>>();
  const transfer = new Map<string, Set<string>>();
  const simulation = new Set<string>();
  const graph = new Set<string>();

  const add = (map: Map<string, Set<string>>, conceptId: string, value: string) => {
    const id = canonical(conceptId) ?? conceptId;
    const bucket = map.get(id) ?? new Set<string>();
    bucket.add(value);
    map.set(id, bucket);
  };

  for (const [lessonId, ids] of Object.entries(LESSON_CONCEPT_IDS)) {
    for (const id of ids) add(lessons, id, lessonId);
  }
  for (const lesson of ALL_LESSONS) {
    for (const id of lesson.conceptIds ?? []) add(lessons, id, lesson.id);
    const hrefs = lessonHrefs(lesson);
    if (hrefs.some((href) => href.includes('/simulate'))) {
      for (const id of lesson.conceptIds ?? []) {
        const resolved = canonical(id) ?? id;
        simulation.add(resolved);
      }
    }
    for (const href of hrefs) {
      const episodeId = episodeIdFromHref(href);
      if (!episodeId) continue;
      for (const id of lesson.conceptIds ?? []) add(replays, id, episodeId);
    }
    for (const exercise of lesson.exercises ?? []) {
      if (!exercise.asTransfer) continue;
      if (exercise.conceptId) add(transfer, exercise.conceptId, exercise.id);
    }
  }

  for (const [drillId, ids] of Object.entries(DRILL_CONCEPT_IDS)) {
    for (const id of ids) add(drills, id, drillId);
  }
  for (const drill of PRACTICE_DRILLS) {
    if (drill.simulateHref) {
      for (const id of DRILL_CONCEPT_IDS[drill.id] ?? []) {
        simulation.add(canonical(id) ?? id);
      }
    }
    if (TRANSFER_DRILL_IDS.has(drill.id)) {
      for (const id of DRILL_CONCEPT_IDS[drill.id] ?? []) add(transfer, id, drill.id);
    }
  }

  for (const episode of REPLAY_TV_EPISODES) {
    for (const id of conceptIdsForReplayEpisode(episode)) {
      add(replays, id, episode.id);
    }
  }

  for (const node of LEARNING_CONCEPTS) {
    const id = canonical(node.id) ?? node.id;
    graph.add(id);
    for (const lessonId of node.lessonIds) add(lessons, id, lessonId);
    for (const drillId of node.drillIds) add(drills, id, drillId);
    for (const replayId of node.replayIds) add(replays, id, replayId);
    if (node.simulateHref) simulation.add(id);
  }

  return { lessons, drills, replays, transfer, simulation, graph };
}

export function buildCurriculumCoverageMatrix(): ConceptCoverageRow[] {
  const index = indexByConcept();
  return COMPETENCY_CONCEPTS.map((concept) => {
    const lessonIds = [...(index.lessons.get(concept.id) ?? [])].sort();
    const drillIds = [...(index.drills.get(concept.id) ?? [])].sort();
    const replayIds = [...(index.replays.get(concept.id) ?? [])].sort();
    const hasTransfer = (index.transfer.get(concept.id)?.size ?? 0) > 0;
    const graphNode = index.graph.has(concept.id);
    const hasSimulation = index.simulation.has(concept.id);
    const primaryLessonId =
      (PRIMARY_LESSON_BY_CONCEPT as Record<string, string>)[concept.id] ?? lessonIds[0] ?? null;
    const primaryLesson = primaryLessonId
      ? ALL_LESSONS.find((lesson) => lesson.id === primaryLessonId)
      : undefined;
    const isPriority = (PRIORITY_CURRICULUM_CONCEPTS as readonly string[]).includes(concept.id);
    const missingFlagshipFields = isPriority ? flagshipGaps(primaryLesson, concept.id) : [];

    let status: CoverageStatus = 'nominal';
    if (lessonIds.length && drillIds.length && replayIds.length && hasSimulation) {
      status = 'closed_loop';
    } else if (lessonIds.length || drillIds.length || replayIds.length) {
      status = 'partial';
    }

    return {
      conceptId: concept.id,
      title: concept.title,
      family: concept.family,
      status,
      lessonIds,
      drillIds,
      replayIds,
      graphNode,
      hasSimulation,
      hasTransfer,
      primaryLessonId,
      missingFlagshipFields,
    };
  });
}

export function getPriorityCoverageRows(): ConceptCoverageRow[] {
  const byId = new Map(buildCurriculumCoverageMatrix().map((row) => [row.conceptId, row]));
  return PRIORITY_CURRICULUM_CONCEPTS.map((id) => {
    const row = byId.get(id);
    if (!row) {
      throw new Error(`Priority concept missing from taxonomy: ${id}`);
    }
    return row;
  });
}

export function getNominalConceptIds(): string[] {
  return buildCurriculumCoverageMatrix()
    .filter((row) => row.status === 'nominal')
    .map((row) => row.conceptId);
}

export function formatCurriculumCoverageMarkdown(
  rows: ConceptCoverageRow[] = buildCurriculumCoverageMatrix(),
): string {
  const header =
    '| Concept | Status | Lesson | Drill | Replay | Graph | Sim | Transfer | Flagship gaps |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const body = rows
    .map((row) => {
      const gaps = row.missingFlagshipFields.length ? row.missingFlagshipFields.join(', ') : '—';
      return `| \`${row.conceptId}\` | ${row.status} | ${row.lessonIds[0] ?? '—'} | ${row.drillIds[0] ?? '—'} | ${row.replayIds[0] ?? '—'} | ${row.graphNode ? 'yes' : 'no'} | ${row.hasSimulation ? 'yes' : 'no'} | ${row.hasTransfer ? 'yes' : 'no'} | ${gaps} |`;
    })
    .join('\n');
  return `${header}\n${body}`;
}
