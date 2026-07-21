import type { UserPreferences } from '@/shared/types/user';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL: string | null;
  bio: string;
  timezone: string;
  currency: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  notificationsEnabled: boolean;
  mfaEnabled: boolean;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserProfileInput {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface UpdateUserProfileInput {
  displayName?: string;
  photoURL?: string | null;
  bio?: string;
  timezone?: string;
  currency?: string;
  experienceLevel?: UserProfile['experienceLevel'];
  notificationsEnabled?: boolean;
  mfaEnabled?: boolean;
  onboardingCompleted?: boolean;
  preferences?: UserPreferences;
}

export type UserProfileDocument = Omit<UserProfile, 'uid'>;
