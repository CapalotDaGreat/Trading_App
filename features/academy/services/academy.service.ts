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

import { requireDb, isFirebaseConfigured } from '@/firebase/config';

export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonCategory =
  | 'basics'
  | 'technical_analysis'
  | 'fundamental_analysis'
  | 'risk_management'
  | 'psychology'
  | 'options'
  | 'crypto';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  durationMinutes: number;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface TradingChecklist {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  isPremium: boolean;
}

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
  return {
    id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    category: (data.category as Lesson['category']) ?? 'basics',
    difficulty: (data.difficulty as Lesson['difficulty']) ?? 'beginner',
    durationMinutes: (data.durationMinutes as number) ?? 5,
    content: (data.content as string) ?? '',
    videoUrl: (data.videoUrl as string | undefined) ?? undefined,
    thumbnailUrl: (data.thumbnailUrl as string | undefined) ?? undefined,
    sortOrder: (data.sortOrder as number) ?? 0,
    isPremium: (data.isPremium as boolean) ?? false,
    tags: (data.tags as string[]) ?? [],
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function toChecklist(id: string, data: DocumentData): TradingChecklist {
  return {
    id,
    title: (data.title as string) ?? '',
    description: (data.description as string) ?? '',
    items: (data.items as ChecklistItem[]) ?? [],
    isPremium: (data.isPremium as boolean) ?? false,
  };
}

const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Understanding Market Orders',
    description: 'Learn the difference between market, limit, and stop orders.',
    category: 'basics',
    difficulty: 'beginner',
    durationMinutes: 8,
    content:
      'Market orders execute immediately at the best available price. Limit orders specify a maximum buy or minimum sell price. Stop orders trigger a market order when a price level is reached.',
    sortOrder: 1,
    isPremium: false,
    tags: ['orders', 'basics'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lesson-2',
    title: 'Risk Management Fundamentals',
    description: 'Position sizing, stop losses, and the 1% rule.',
    category: 'risk_management',
    difficulty: 'beginner',
    durationMinutes: 12,
    content:
      'Never risk more than 1-2% of your account on a single trade. Always define your stop loss before entering. Calculate position size based on the distance to your stop.',
    sortOrder: 2,
    isPremium: false,
    tags: ['risk', 'position-sizing'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lesson-3',
    title: 'Reading Candlestick Patterns',
    description: 'Identify key reversal and continuation patterns.',
    category: 'technical_analysis',
    difficulty: 'intermediate',
    durationMinutes: 15,
    content:
      'Doji candles signal indecision. Engulfing patterns can indicate reversals. Always confirm patterns with volume and support/resistance levels.',
    sortOrder: 3,
    isPremium: true,
    tags: ['candlesticks', 'patterns'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CHECKLIST: TradingChecklist = {
  id: 'pre-trade-checklist',
  title: 'Pre-Trade Checklist',
  description: 'Run through this checklist before every trade.',
  isPremium: false,
  items: [
    { id: '1', text: 'Defined entry, stop loss, and take profit levels', category: 'plan', sortOrder: 1, isRequired: true },
    { id: '2', text: 'Risk is ≤ 1% of account balance', category: 'risk', sortOrder: 2, isRequired: true },
    { id: '3', text: 'Checked economic calendar for high-impact events', category: 'fundamentals', sortOrder: 3, isRequired: true },
    { id: '4', text: 'Trend and key levels identified on chart', category: 'technical', sortOrder: 4, isRequired: true },
    { id: '5', text: 'Emotional state is calm and focused', category: 'psychology', sortOrder: 5, isRequired: false },
    { id: '6', text: 'Trade aligns with overall strategy', category: 'plan', sortOrder: 6, isRequired: true },
  ],
};

export async function getLessons(includePremium = true): Promise<Lesson[]> {
  if (!isFirebaseConfigured()) {
    return includePremium ? DEFAULT_LESSONS : DEFAULT_LESSONS.filter((l) => !l.isPremium);
  }
  try {
    const q = query(collection(requireDb(), LESSONS_COLLECTION), orderBy('sortOrder', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return includePremium ? DEFAULT_LESSONS : DEFAULT_LESSONS.filter((l) => !l.isPremium);
    }

    const lessons = snapshot.docs.map((docSnap) => toLesson(docSnap.id, docSnap.data()));
    return includePremium ? lessons : lessons.filter((l) => !l.isPremium);
  } catch {
    return includePremium ? DEFAULT_LESSONS : DEFAULT_LESSONS.filter((l) => !l.isPremium);
  }
}

export async function getLessonsByCategory(
  category: LessonCategory,
  includePremium = true,
): Promise<Lesson[]> {
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
    const filtered = DEFAULT_LESSONS.filter((l) => l.category === category);
    return includePremium ? filtered : filtered.filter((l) => !l.isPremium);
  }
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  try {
    const snapshot = await getDoc(doc(requireDb(), LESSONS_COLLECTION, lessonId));
    if (!snapshot.exists()) {
      return DEFAULT_LESSONS.find((l) => l.id === lessonId) ?? null;
    }
    return toLesson(snapshot.id, snapshot.data());
  } catch {
    return DEFAULT_LESSONS.find((l) => l.id === lessonId) ?? null;
  }
}

export async function getTradingChecklist(checklistId = 'pre-trade-checklist'): Promise<TradingChecklist> {
  try {
    const snapshot = await getDoc(doc(requireDb(), CHECKLISTS_COLLECTION, checklistId));
    if (!snapshot.exists()) {
      return DEFAULT_CHECKLIST;
    }
    return toChecklist(snapshot.id, snapshot.data());
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

export async function getAllChecklists(): Promise<TradingChecklist[]> {
  try {
    const snapshot = await getDocs(collection(requireDb(), CHECKLISTS_COLLECTION));
    if (snapshot.empty) {
      return [DEFAULT_CHECKLIST];
    }
    return snapshot.docs.map((docSnap) => toChecklist(docSnap.id, docSnap.data()));
  } catch {
    return [DEFAULT_CHECKLIST];
  }
}
