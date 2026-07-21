import type { ActivationGoal, UserPreferences } from '@/shared/types/user';

export const ONBOARDING_DRAFT_VERSION = 1 as const;

export type OnboardingExperience = 'full' | 'demo_guide';
export type OnboardingResolutionReason =
  | 'explicit_completion'
  | 'decision_activity'
  | 'settings_sync'
  | 'today_coach_dismissed'
  | 'new_user'
  | 'demo_guide';

export interface OnboardingDraft {
  version: typeof ONBOARDING_DRAFT_VERSION;
  uid: string;
  timeBudgetMinutes?: number;
  activationGoal?: ActivationGoal;
  selectedUniverse?: string[];
  outcomeSymbol?: string;
  outcomeAction?: 'researched' | 'skipped';
  currentStep: number;
  updatedAt: number;
}

export interface OnboardingCompletionInput {
  timeBudgetMinutes: number;
  activationGoal: ActivationGoal;
  selectedUniverse: string[];
}

export interface OnboardingEvidence {
  uid: string;
  isDemo: boolean;
  activationDraftStarted?: boolean;
  profileCompleted: boolean;
  localCompleted: boolean;
  decisionLogCount: number;
  lastSettingsSyncAt: number | null;
  remoteSettingsExist: boolean;
  todayCoachDismissed: boolean;
}

export interface OnboardingResolution {
  completed: boolean;
  experience: OnboardingExperience;
  reason: OnboardingResolutionReason;
  shouldPersistCompletion: boolean;
}

export interface OnboardingCompletionResult {
  preferences: UserPreferences;
  completedAt: number;
}
