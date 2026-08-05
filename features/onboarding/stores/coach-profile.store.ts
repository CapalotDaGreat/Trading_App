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
  isHydrating: boolean;
  hydrate: (uid: string) => Promise<CoachProfile>;
  setProfile: (profile: CoachProfile) => void;
  dismissInvite: (uid: string) => Promise<CoachProfile>;
  reset: () => void;
}

export const useCoachProfileStore = create<CoachProfileState>((set) => ({
  profile: null,
  isHydrating: false,
  hydrate: async (uid) => {
    set({ isHydrating: true });
    try {
      const profile = await loadCoachProfile(uid);
      set({ profile });
      return profile;
    } finally {
      set({ isHydrating: false });
    }
  },
  setProfile: (profile) => {
    set({ profile });
    void saveCoachProfileLocal(profile);
  },
  dismissInvite: async (uid) => {
    const profile = await dismissMentorSetupInvite(uid);
    set({ profile });
    return profile;
  },
  reset: () => set({ profile: null, isHydrating: false }),
}));

export function getCoachProfileSnapshot(uid: string | null): CoachProfile {
  const state = useCoachProfileStore.getState();
  if (uid && state.profile?.uid === uid) return state.profile;
  return buildEmptyCoachProfile(uid ?? '');
}
