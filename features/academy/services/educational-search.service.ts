import { GLOSSARY_TERMS } from '@/features/academy/content/glossary';
import { searchAcademyLessons, type AcademySearchHit } from '@/features/academy/services/academy-search.service';
import type { Lesson } from '@/features/academy/types/academy.types';
import { PRACTICE_DRILLS, type PracticeDrill } from '@/features/practice/content/practice-drills';

export interface PracticeSearchHit {
  drill: PracticeDrill;
  score: number;
  why: string;
}

export interface GlossarySearchHit {
  term: string;
  short: string;
  lessonId?: string;
  why: string;
}

export interface ExerciseSearchHit {
  lessonId: string;
  lessonTitle: string;
  exerciseId: string;
  prompt: string;
  why: string;
}

export interface EducationalSearchResults {
  lessons: AcademySearchHit[];
  practice: PracticeSearchHit[];
  glossary: GlossarySearchHit[];
  exercises: ExerciseSearchHit[];
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export function searchPracticeDrills(query: string, limit = 5): PracticeSearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const hits: PracticeSearchHit[] = [];
  for (const drill of PRACTICE_DRILLS) {
    const haystack = `${drill.title} ${drill.prompt} ${drill.explanation} ${drill.skill} ${drill.topic} ${drill.lessonId ?? ''}`.toLowerCase();
    const matched = tokens.filter((token) => haystack.includes(token));
    if (matched.length === 0) continue;
    hits.push({
      drill,
      score: matched.length * 2 + (haystack.includes(query.toLowerCase()) ? 3 : 0),
      why: `Practice drill for ${drill.skill} — matches ${matched.slice(0, 3).join(', ')}.`,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function searchGlossary(query: string, limit = 4): GlossarySearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const hits: GlossarySearchHit[] = [];
  for (const term of GLOSSARY_TERMS) {
    const haystack = `${term.term} ${term.aliases.join(' ')} ${term.short}`.toLowerCase();
    const matched = tokens.filter((token) => haystack.includes(token));
    if (matched.length === 0) continue;
    hits.push({
      term: term.term,
      short: term.short,
      lessonId: term.lessonId,
      why: `Glossary: ${term.term} is related to this question.`,
    });
  }
  return hits.slice(0, limit);
}

export function searchLessonExercises(lessons: Lesson[], query: string, limit = 4): ExerciseSearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const hits: ExerciseSearchHit[] = [];
  for (const lesson of lessons) {
    for (const exercise of lesson.exercises ?? []) {
      const haystack = `${exercise.prompt} ${exercise.explanation} ${exercise.kind} ${exercise.conceptId ?? ''}`.toLowerCase();
      const matched = tokens.filter((token) => haystack.includes(token));
      if (matched.length === 0) continue;
      hits.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        exerciseId: exercise.id,
        prompt: exercise.prompt,
        why: `Exercise in “${lesson.title}” — ${exercise.kind}.`,
      });
    }
  }
  return hits.slice(0, limit);
}

export function searchEducation(
  lessons: Lesson[],
  query: string,
  options?: { includePremium?: boolean },
): EducationalSearchResults {
  return {
    lessons: searchAcademyLessons(lessons, query, { limit: 8, includePremium: options?.includePremium }),
    practice: searchPracticeDrills(query),
    glossary: searchGlossary(query),
    exercises: searchLessonExercises(lessons, query),
  };
}
