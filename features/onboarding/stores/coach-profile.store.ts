import { create } from 'zustand';

import {
  buildEmptyCoachProfile,
  dismissMentorSetupInvite,
  loadCoachProfile,
  saveCoachProfileLocal,
} from '../services/coach-profile.service';
import type { CoachProfile } from '../types/mentor-setup.types';

interface CoachProfileState {
  profile: CoachProfile | null;
  activeUid: string | null;
  isHydrating: boolean;
  hydrate: (uid: string) => Promise<CoachProfile>;
  setProfile: (profile: CoachProfile) => void;
  dismissInvite: (uid: string) => Promise<CoachProfile>;
  reset: () => void;
}

export const useCoachProfileStore = create<CoachProfileState>((set) => ({
  profile: null,
  activeUid: null,
  isHydrating: false,
  hydrate: async (uid) => {
    set((state) => ({
      activeUid: uid,
      isHydrating: true,
      profile: state.profile?.uid === uid ? state.profile : null,
    }));
    try {
      const profile = await loadCoachProfile(uid);
      set((state) => (state.activeUid === uid ? { profile, isHydrating: false } : state));
      return profile;
    } finally {
      set((state) => (state.activeUid === uid ? { isHydrating: false } : state));
    }
  },
  setProfile: (profile) => {
    set({ profile, activeUid: profile.uid });
    void saveCoachProfileLocal(profile);
  },
  dismissInvite: async (uid) => {
    const profile = await dismissMentorSetupInvite(uid);
    set({ profile });
    return profile;
  },
  reset: () => set({ profile: null, activeUid: null, isHydrating: false }),
}));

export function getCoachProfileSnapshot(uid: string | null): CoachProfile {
  const state = useCoachProfileStore.getState();
  if (uid && state.profile?.uid === uid) return state.profile;
  return buildEmptyCoachProfile(uid ?? '');
}
