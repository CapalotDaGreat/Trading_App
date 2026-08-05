import { useCallback, useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSettingsStore } from '@/shared/stores/settings.store';

import {
  shouldShowMentorSetupInvite,
} from '../services/coach-profile.service';
import { getCoachProfileSnapshot, useCoachProfileStore } from '../stores/coach-profile.store';
import type { CoachProfile } from '../types/mentor-setup.types';

export function useCoachProfile() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const mentorSetupCompletedFlag = useSettingsStore((s) => s.mentorSetupCompleted);
  const profile = useCoachProfileStore((s) => s.profile);
  const isHydrating = useCoachProfileStore((s) => s.isHydrating);
  const hydrate = useCoachProfileStore((s) => s.hydrate);
  const dismissInvite = useCoachProfileStore((s) => s.dismissInvite);
  const setProfile = useCoachProfileStore((s) => s.setProfile);

  useEffect(() => {
    if (!uid) {
      useCoachProfileStore.getState().reset();
      return;
    }
    void hydrate(uid);
  }, [uid, hydrate]);

  const resolved: CoachProfile =
    uid && profile?.uid === uid ? profile : getCoachProfileSnapshot(uid);

  const mentorSetupCompleted =
    mentorSetupCompletedFlag || resolved.mentorSetupCompleted;

  const showMentorSetupInvite = shouldShowMentorSetupInvite(
    { ...resolved, mentorSetupCompleted },
    hasCompletedOnboarding,
  );

  const dismissMentorInvite = useCallback(async () => {
    if (!uid) return;
    await dismissInvite(uid);
  }, [uid, dismissInvite]);

  return {
    uid,
    profile: resolved,
    isHydrating,
    mentorSetupCompleted,
    showMentorSetupInvite,
    dismissMentorInvite,
    setProfile,
    refresh: () => (uid ? hydrate(uid) : Promise.resolve(getCoachProfileSnapshot(null))),
  };
}
