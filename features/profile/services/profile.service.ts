import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';

import { requireDb, isFirebaseConfigured } from '@/firebase/config';

import type {
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UserProfile,
  UserProfileDocument,
} from '../types/profile.types';

const USERS_COLLECTION = 'users';
const DEMO_PROFILE_KEY = 'tradevision-demo-profile';

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
    onboardingCompleted: true,
    createdAt: patch?.createdAt ?? now,
    updatedAt: patch?.updatedAt ?? now,
  };
}

async function loadDemoProfile(uid: string): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(`${DEMO_PROFILE_KEY}:${uid}`);
    if (raw) {
      return { ...demoProfile(uid), ...(JSON.parse(raw) as UserProfile), uid };
    }
  } catch {
    // fall through
  }
  return demoProfile(uid);
}

async function saveDemoProfile(profile: UserProfile): Promise<UserProfile> {
  const next = { ...profile, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(`${DEMO_PROFILE_KEY}:${profile.uid}`, JSON.stringify(next));
  return next;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) {
    return loadDemoProfile(uid);
  }

  const snapshot = await getDoc(profileDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }
  return toUserProfile(uid, snapshot.data());
}

export async function createUserProfile(input: CreateUserProfileInput): Promise<UserProfile> {
  const data = buildDefaultProfile(input);

  if (!isFirebaseConfigured()) {
    return saveDemoProfile({ uid: input.uid, ...data });
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
  if (!isFirebaseConfigured()) {
    const current = await loadDemoProfile(uid);
    return saveDemoProfile({ ...current, ...updates, uid });
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
  if (!isFirebaseConfigured()) {
    await AsyncStorage.removeItem(`${DEMO_PROFILE_KEY}:${uid}`);
    return;
  }
  await deleteDoc(profileDocRef(uid));
}
