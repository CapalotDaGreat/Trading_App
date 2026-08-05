import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CoachProfileAnswers, MentorSetupDraft } from '../types/mentor-setup.types';
import { EMPTY_COACH_ANSWERS, MENTOR_SETUP_DRAFT_VERSION } from '../types/mentor-setup.types';

export const MENTOR_SETUP_DRAFT_KEY_PREFIX = 'tradevision:mentor-setup-draft:v2';
const queues = new Map<string, Promise<unknown>>();

export function mentorSetupDraftStorageKey(uid: string): string {
  return `${MENTOR_SETUP_DRAFT_KEY_PREFIX}:${encodeURIComponent(uid)}`;
}

function emptyDraft(uid: string): MentorSetupDraft {
  return {
    version: MENTOR_SETUP_DRAFT_VERSION,
    uid,
    answers: {},
    currentStep: 0,
    updatedAt: Date.now(),
  };
}

function migrateDraft(value: unknown, uid: string): MentorSetupDraft {
  if (!value || typeof value !== 'object') return emptyDraft(uid);
  const candidate = value as Record<string, unknown>;
  const answers =
    candidate.answers && typeof candidate.answers === 'object'
      ? (candidate.answers as Partial<CoachProfileAnswers>)
      : {};
  const step = candidate.currentStep;
  return {
    version: MENTOR_SETUP_DRAFT_VERSION,
    uid,
    answers: { ...answers },
    currentStep:
      typeof step === 'number' && Number.isInteger(step) ? Math.max(0, Math.min(12, step)) : 0,
    updatedAt:
      typeof candidate.updatedAt === 'number' && Number.isFinite(candidate.updatedAt)
        ? candidate.updatedAt
        : Date.now(),
  };
}

async function readDraft(uid: string): Promise<MentorSetupDraft> {
  const raw = await AsyncStorage.getItem(mentorSetupDraftStorageKey(uid));
  if (!raw) return emptyDraft(uid);
  try {
    return migrateDraft(JSON.parse(raw) as unknown, uid);
  } catch {
    return emptyDraft(uid);
  }
}

async function runExclusive<T>(uid: string, operation: () => Promise<T>): Promise<T> {
  const previous = queues.get(uid) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  queues.set(uid, current);
  try {
    return await current;
  } finally {
    if (queues.get(uid) === current) queues.delete(uid);
  }
}

export function loadMentorSetupDraft(uid: string): Promise<MentorSetupDraft> {
  return runExclusive(uid, () => readDraft(uid));
}

export async function saveMentorSetupDraft(
  uid: string,
  updates: Partial<Pick<MentorSetupDraft, 'answers' | 'currentStep'>> & {
    answerPatch?: Partial<CoachProfileAnswers>;
  },
): Promise<MentorSetupDraft> {
  return runExclusive(uid, async () => {
    const current = await readDraft(uid);
    const next: MentorSetupDraft = {
      ...current,
      answers: {
        ...EMPTY_COACH_ANSWERS,
        ...current.answers,
        ...(updates.answers ?? {}),
        ...(updates.answerPatch ?? {}),
      },
      currentStep: updates.currentStep ?? current.currentStep,
      updatedAt: Date.now(),
    };
    // Strip empty defaults that weren't set
    const cleanedAnswers: Partial<CoachProfileAnswers> = {};
    for (const [key, value] of Object.entries(next.answers) as [
      keyof CoachProfileAnswers,
      CoachProfileAnswers[keyof CoachProfileAnswers],
    ][]) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      cleanedAnswers[key] = value as never;
    }
    next.answers = cleanedAnswers;
    await AsyncStorage.setItem(mentorSetupDraftStorageKey(uid), JSON.stringify(next));
    return next;
  });
}

export function clearMentorSetupDraft(uid: string): Promise<void> {
  return runExclusive(uid, () => AsyncStorage.removeItem(mentorSetupDraftStorageKey(uid)));
}

export function mergeDraftAnswers(draft: MentorSetupDraft): CoachProfileAnswers {
  return { ...EMPTY_COACH_ANSWERS, ...draft.answers };
}
