import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';

import { isFirebaseConfigured, requireDb } from '@/firebase/config';

import {
  getLocalChecklistById,
  getLocalChecklists,
  getLocalLessonById,
  getLocalLessons,
  getLocalPathById,
  getLocalPaths,
} from '../content';
import type {
  ChecklistItem,
  Lesson,
  LessonCategory,
  LessonSection,
  LearningPath,
  PracticeLink,
  QuizQuestion,
  TradingChecklist,
} from '../types/academy.types';

export type {
  ChecklistItem,
  Lesson,
  LessonCategory,
  LessonDifficulty,
  LessonSection,
  LearningPath,
  PracticeLink,
  QuizQuestion,
  TradingChecklist,
  AcademyTrack,
} from '../types/academy.types';

export type { AcademyPathMeta } from '../content/paths-and-checklists';
export { CATEGORY_LABELS } from '../types/academy.types';
export {
  buildDefaultNextLesson,
  buildPersonalizedCurriculum,
  evaluatePathUnlocks,
  getDefaultOperatorPath,
  mapMistakeToLesson,
  auditLessonsWithoutPractice,
} from './curriculum.service';
export type { CurriculumRecommendation, PathUnlockStatus } from './curriculum.service';

const LESSONS_COLLECTION = 'academy_lessons';
const CHECKLISTS_COLLECTION = 'academy_checklists';

function serializeTimestamp(value: unknown): string {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function toLesson(id: string, data: DocumentData): Lesson {
  const local = getLocalLessonById(id);
  const content = (data.content as string) ?? local?.content ?? '';
  const sections = (data.sections as LessonSection[] | undefined) ??
    local?.sections ?? [
      { heading: 'Overview', body: content },
    ];

  return {
    id,
    title: (data.title as string) ?? local?.title ?? '',
    description: (data.description as string) ?? local?.description ?? '',
    category: (data.category as Lesson['category']) ?? local?.category ?? 'basics',
    difficulty: (data.difficulty as Lesson['difficulty']) ?? local?.difficulty ?? 'beginner',
    durationMinutes: (data.durationMinutes as number) ?? local?.durationMinutes ?? 5,
    content,
    sections,
    keyTakeaways: (data.keyTakeaways as string[]) ?? local?.keyTakeaways ?? [],
    quiz: (data.quiz as QuizQuestion[]) ?? local?.quiz ?? [],
    practiceLinks: (data.practiceLinks as PracticeLink[]) ?? local?.practiceLinks ?? [],
    relatedLessonIds: (data.relatedLessonIds as string[]) ?? local?.relatedLessonIds ?? [],
    track: (data.track as Lesson['track']) ?? local?.track ?? 'classic',
    sortOrder: (data.sortOrder as number) ?? local?.sortOrder ?? 0,
    isPremium: (data.isPremium as boolean) ?? local?.isPremium ?? false,
    tags: (data.tags as string[]) ?? local?.tags ?? [],
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function toChecklist(id: string, data: DocumentData): TradingChecklist {
  const local = getLocalChecklistById(id);
  return {
    id,
    title: (data.title as string) ?? local.title,
    description: (data.description as string) ?? local.description,
    items: (data.items as ChecklistItem[]) ?? local.items,
    isPremium: (data.isPremium as boolean) ?? local.isPremium,
  };
}

export async function getLessons(includePremium = true): Promise<Lesson[]> {
  const fallback = getLocalLessons(includePremium);
  if (!isFirebaseConfigured()) return fallback;

  try {
    const q = query(collection(requireDb(), LESSONS_COLLECTION), orderBy('sortOrder', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return fallback;

    const remote = snapshot.docs.map((docSnap) => toLesson(docSnap.id, docSnap.data()));
    const byId = new Map(fallback.map((l) => [l.id, l]));
    for (const lesson of remote) byId.set(lesson.id, lesson);
    const merged = Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    return includePremium ? merged : merged.filter((l) => !l.isPremium);
  } catch {
    return fallback;
  }
}

export async function getLessonsByCategory(
  category: LessonCategory,
  includePremium = true,
): Promise<Lesson[]> {
  const all = await getLessons(includePremium);
  return all.filter((l) => l.category === category);
}

export async function getLessonsByTrack(
  track: Lesson['track'],
  includePremium = true,
): Promise<Lesson[]> {
  const all = await getLessons(includePremium);
  return all.filter((l) => l.track === track);
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const local = getLocalLessonById(lessonId);
  if (!isFirebaseConfigured()) return local;

  try {
    const snapshot = await getDoc(doc(requireDb(), LESSONS_COLLECTION, lessonId));
    if (!snapshot.exists()) return local;
    return toLesson(snapshot.id, snapshot.data());
  } catch {
    return local;
  }
}

export async function getLearningPaths(): Promise<LearningPath[]> {
  return getLocalPaths();
}

export async function getLearningPathById(pathId: string): Promise<LearningPath | null> {
  return getLocalPathById(pathId);
}

export async function getPathLessons(
  pathId: string,
  includePremium = true,
): Promise<{ path: LearningPath; lessons: Lesson[] } | null> {
  const path = getLocalPathById(pathId);
  if (!path) return null;
  const all = await getLessons(true);
  const lessons = path.lessonIds
    .map((id) => all.find((l) => l.id === id))
    .filter((l): l is Lesson => Boolean(l))
    .filter((l) => includePremium || !l.isPremium);
  return { path, lessons };
}

export async function getTradingChecklist(
  checklistId = 'pre-trade-checklist',
): Promise<TradingChecklist> {
  const local = getLocalChecklistById(checklistId);
  if (!isFirebaseConfigured()) return local;

  try {
    const snapshot = await getDoc(doc(requireDb(), CHECKLISTS_COLLECTION, checklistId));
    if (!snapshot.exists()) return local;
    return toChecklist(snapshot.id, snapshot.data());
  } catch {
    return local;
  }
}

export async function getAllChecklists(): Promise<TradingChecklist[]> {
  const local = getLocalChecklists();
  if (!isFirebaseConfigured()) return local;

  try {
    const snapshot = await getDocs(collection(requireDb(), CHECKLISTS_COLLECTION));
    if (snapshot.empty) return local;
    const remote = snapshot.docs.map((docSnap) => toChecklist(docSnap.id, docSnap.data()));
    const byId = new Map(local.map((c) => [c.id, c]));
    for (const checklist of remote) byId.set(checklist.id, checklist);
    return Array.from(byId.values());
  } catch {
    return local;
  }
}

/** @deprecated Prefer getLessonsByCategory — kept for older callers */
export async function getLessonsByCategoryQuery(
  category: LessonCategory,
  includePremium = true,
): Promise<Lesson[]> {
  if (!isFirebaseConfigured()) {
    return getLocalLessons(includePremium).filter((l) => l.category === category);
  }
  try {
    const q = query(
      collection(requireDb(), LESSONS_COLLECTION),
      where('category', '==', category),
      orderBy('sortOrder', 'asc'),
    );
    const snapshot = await getDocs(q);
    const lessons = snapshot.docs.map((docSnap) => toLesson(docSnap.id, docSnap.data()));
    return includePremium ? lessons : lessons.filter((l) => !l.isPremium);
  } catch {
    return getLocalLessons(includePremium).filter((l) => l.category === category);
  }
}
