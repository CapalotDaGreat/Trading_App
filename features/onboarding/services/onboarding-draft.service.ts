import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OnboardingDraft } from '../types/onboarding.types';

import { migrateOnboardingDraft } from './onboarding-migration.service';

export const ONBOARDING_DRAFT_KEY_PREFIX = 'tradevision:onboarding-draft:v1';
const queues = new Map<string, Promise<unknown>>();

export function onboardingDraftStorageKey(uid: string): string {
  return `${ONBOARDING_DRAFT_KEY_PREFIX}:${encodeURIComponent(uid)}`;
}

async function readDraft(uid: string): Promise<OnboardingDraft> {
  const raw = await AsyncStorage.getItem(onboardingDraftStorageKey(uid));
  if (!raw) return migrateOnboardingDraft(null, uid);
  try {
    return migrateOnboardingDraft(JSON.parse(raw) as unknown, uid);
  } catch {
    return migrateOnboardingDraft(null, uid);
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

export function loadOnboardingDraft(uid: string): Promise<OnboardingDraft> {
  return runExclusive(uid, () => readDraft(uid));
}

export async function saveOnboardingDraft(
  uid: string,
  updates: Partial<Omit<OnboardingDraft, 'uid' | 'version' | 'updatedAt'>>,
): Promise<OnboardingDraft> {
  return runExclusive(uid, async () => {
    const current = await readDraft(uid);
    const next = migrateOnboardingDraft({ ...current, ...updates, updatedAt: Date.now() }, uid);
    await AsyncStorage.setItem(onboardingDraftStorageKey(uid), JSON.stringify(next));
    return next;
  });
}

export function clearOnboardingDraft(uid: string): Promise<void> {
  return runExclusive(uid, () => AsyncStorage.removeItem(onboardingDraftStorageKey(uid)));
}
