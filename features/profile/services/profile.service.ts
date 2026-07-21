import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';

import { requireDb } from '@/firebase/config';
import { getLocalUserRepository, resolveUserDataBackend } from '@/shared/services/user-data';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/shared/types/user';

import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
  UserProfileDocument,
} from '../types/profile.types';

const USERS_COLLECTION = 'users';

function profileDocRef(uid: string) {
  return doc(requireDb(), USERS_COLLECTION, uid);
}

function serializeTimestamp(value: unknown): string {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function toPreferences(value: unknown): UserPreferences {
  return value && typeof value === 'object'
    ? { ...DEFAULT_USER_PREFERENCES, ...(value as Partial<UserPreferences>) }
    : { ...DEFAULT_USER_PREFERENCES };
}

function toUserProfile(uid: string, data: DocumentData): UserProfile {
  return {
    uid,
    email: (data.email as string | null) ?? null,
    displayName: (data.displayName as string) ?? 'Trader',
    photoURL: (data.photoURL as string | null) ?? null,
    bio: (data.bio as string) ?? '',
    timezone: (data.timezone as string) ?? 'UTC',
    currency: (data.currency as string) ?? 'USD',
    experienceLevel: (data.experienceLevel as UserProfile['experienceLevel']) ?? 'beginner',
    notificationsEnabled: (data.notificationsEnabled as boolean) ?? true,
    mfaEnabled: (data.mfaEnabled as boolean) ?? false,
    onboardingCompleted: (data.onboardingCompleted as boolean) ?? false,
    preferences: toPreferences(data.preferences),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function buildDefaultProfile(input: CreateUserProfileInput): UserProfileDocument {
  const now = new Date().toISOString();
  return {
    email: input.email,
    displayName: input.displayName?.trim() || 'Trader',
    photoURL: input.photoURL ?? null,
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    currency: 'USD',
    experienceLevel: 'beginner',
    notificationsEnabled: true,
    mfaEnabled: false,
    onboardingCompleted: false,
    preferences: { ...DEFAULT_USER_PREFERENCES },
    createdAt: now,
    updatedAt: now,
  };
}

function demoProfile(uid: string, patch?: Partial<UserProfile>): UserProfile {
  const now = new Date().toISOString();
  return {
    uid,
    email: patch?.email ?? 'demo@tradevision.local',
    displayName: patch?.displayName ?? 'Demo Trader',
    photoURL: patch?.photoURL ?? null,
    bio: patch?.bio ?? '',
    timezone: patch?.timezone ?? (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
    currency: patch?.currency ?? 'USD',
    experienceLevel: patch?.experienceLevel ?? 'intermediate',
    notificationsEnabled: patch?.notificationsEnabled ?? true,
    mfaEnabled: false,
    onboardingCompleted: patch?.onboardingCompleted ?? false,
    preferences: toPreferences(patch?.preferences),
    createdAt: patch?.createdAt ?? now,
    updatedAt: patch?.updatedAt ?? now,
  };
}

async function saveLocalProfile(profile: UserProfile): Promise<UserProfile> {
  const next = { ...profile, updatedAt: new Date().toISOString() };
  return getLocalUserRepository(profile.uid).put<UserProfile & { id: string }>('profiles', {
    ...next,
    id: profile.uid,
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (resolveUserDataBackend(uid) === 'local') {
    const stored = await getLocalUserRepository(uid).get<UserProfile & { id: string }>(
      'profiles',
      uid,
    );
    return stored ? { ...demoProfile(uid), ...stored, uid } : demoProfile(uid);
  }

  const snapshot = await getDoc(profileDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }
  return toUserProfile(uid, snapshot.data());
}

export async function createUserProfile(input: CreateUserProfileInput): Promise<UserProfile> {
  const data = buildDefaultProfile(input);

  if (resolveUserDataBackend(input.uid) === 'local') {
    return saveLocalProfile({ uid: input.uid, ...data });
  }

  await setDoc(profileDocRef(input.uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    uid: input.uid,
    ...data,
  };
}

export async function upsertUserProfile(input: CreateUserProfileInput): Promise<UserProfile> {
  const existing = await getUserProfile(input.uid);
  if (existing) {
    return existing;
  }
  return createUserProfile(input);
}

export async function updateUserProfile(
  uid: string,
  updates: UpdateUserProfileInput,
): Promise<UserProfile> {
  if (resolveUserDataBackend(uid) === 'local') {
    const current = (await getUserProfile(uid)) ?? demoProfile(uid);
    return saveLocalProfile({ ...current, ...updates, uid });
  }

  const ref = profileDocRef(uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('Profile not found.');
  }

  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  const updated = await getDoc(ref);
  return toUserProfile(uid, updated.data()!);
}

export async function deleteUserProfile(uid: string): Promise<void> {
  if (resolveUserDataBackend(uid) === 'local') {
    await getLocalUserRepository(uid).delete('profiles', uid);
    return;
  }
  await deleteDoc(profileDocRef(uid));
}
