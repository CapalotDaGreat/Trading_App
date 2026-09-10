import { ALL_LESSONS } from '@/features/academy/content';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import {
  DRILL_TO_CONCEPT,
  LEARNING_CONCEPTS,
  LESSON_PRIMARY_CONCEPT,
} from '../content/learning-graph';
import type { LearningConceptNode } from '../types/learning-engine.types';

const BY_ID = new Map(LEARNING_CONCEPTS.map((node) => [node.id, node]));

export function getConcept(id: string): LearningConceptNode | undefined {
  return BY_ID.get(id);
}

export function allConcepts(): LearningConceptNode[] {
  return LEARNING_CONCEPTS;
}

export function relatedConceptIds(id: string, depth = 1): string[] {
  const seen = new Set<string>([id]);
  let frontier = [id];
  for (let i = 0; i < depth; i += 1) {
    const next: string[] = [];
    for (const current of frontier) {
      for (const related of getConcept(current)?.relatedIds ?? []) {
        if (seen.has(related)) continue;
        seen.add(related);
        next.push(related);
      }
    }
    frontier = next;
  }
  seen.delete(id);
  return [...seen];
}

export function conceptForDrill(drillId: string): LearningConceptNode | undefined {
  const mapped = DRILL_TO_CONCEPT[drillId];
  if (mapped) return getConcept(mapped);
  return LEARNING_CONCEPTS.find((node) => node.drillIds.includes(drillId));
}

export function primaryConceptForLesson(lessonId: string): LearningConceptNode | undefined {
  const mapped = LESSON_PRIMARY_CONCEPT[lessonId];
  if (mapped) return getConcept(mapped);
  return LEARNING_CONCEPTS.find((node) => node.lessonIds.includes(lessonId));
}

export function lessonTitle(lessonId: string): string {
  return ALL_LESSONS.find((lesson) => lesson.id === lessonId)?.title ?? lessonId;
}

export function drillTitle(drillId: string): string {
  return PRACTICE_DRILLS.find((drill) => drill.id === drillId)?.title ?? drillId;
}

export function walkConceptChain(startId: string): string[] {
  const start = getConcept(startId);
  if (!start) return [];
  const ids = start.examplePath?.length ? start.examplePath : [startId, ...start.relatedIds];
  return ids.map((id) => getConcept(id)?.title).filter((title): title is string => Boolean(title));
}
