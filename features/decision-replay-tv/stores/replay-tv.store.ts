import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  advanceReplayTvPhase,
  createReplayTvSession,
  hydrateReplayTvSessionCandles,
  patchReplayTvChecklist,
  submitReplayTvDecision,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type {
  ReplayTvChecklist,
  ReplayTvCollectionId,
  ReplayTvDecision,
  ReplayTvProgress,
  ReplayTvSession,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

function dayKey(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function monthKey(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 7);
}

function nextStreak(prev: ReplayTvProgress, completedAt = Date.now()): Pick<
  ReplayTvProgress,
  'streakDays' | 'lastCompletedDayKey'
> {
  const today = dayKey(completedAt);
  if (prev.lastCompletedDayKey === today) {
    return { streakDays: prev.streakDays, lastCompletedDayKey: today };
  }
  const yesterday = dayKey(completedAt - 24 * 60 * 60 * 1000);
  const streakDays =
    prev.lastCompletedDayKey === yesterday ? prev.streakDays + 1 : 1;
  return { streakDays, lastCompletedDayKey: today };
}

interface ReplayTvState {
  activeSession: ReplayTvSession | null;
  progress: ReplayTvProgress;
  startEpisode: (episodeId: string) => ReplayTvSession;
  restartEpisode: () => ReplayTvSession | null;
  advancePhase: () => void;
  updateChecklist: (patch: Partial<ReplayTvChecklist>) => void;
  submitDecision: (decision: ReplayTvDecision, reasoning: string) => void;
  markComplete: (input: {
    episodeId: string;
    collectionIds: ReplayTvCollectionId[];
    processScore: number;
  }) => void;
  clearActive: () => void;
}

const EMPTY_PROGRESS: ReplayTvProgress = {
  completedEpisodeIds: [],
  attemptCount: 0,
  streakDays: 0,
  lastCompletedDayKey: null,
  masteryByCollection: {},
  bestProcessByEpisode: {},
  monthlyKey: null,
  monthlyCompletions: 0,
};

function stripCandles(session: ReplayTvSession | null): ReplayTvSession | null {
  if (!session) return null;
  return { ...session, fullCandles: [] };
}

export const useReplayTvStore = create<ReplayTvState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      progress: EMPTY_PROGRESS,
      startEpisode: (episodeId) => {
        const session = createReplayTvSession(episodeId);
        set({ activeSession: session });
        return session;
      },
      restartEpisode: () => {
        const active = get().activeSession;
        if (!active) return null;
        const session = createReplayTvSession(active.episodeId);
        set({ activeSession: session });
        return session;
      },
      advancePhase: () => {
        const active = get().activeSession;
        if (!active) return;
        set({ activeSession: advanceReplayTvPhase(active) });
      },
      updateChecklist: (patch) => {
        const active = get().activeSession;
        if (!active) return;
        set({ activeSession: patchReplayTvChecklist(active, patch) });
      },
      submitDecision: (decision, reasoning) => {
        const active = get().activeSession;
        if (!active) return;
        set({
          activeSession: submitReplayTvDecision({
            session: active,
            decision,
            reasoning,
          }),
        });
      },
      markComplete: ({ episodeId, collectionIds, processScore }) => {
        const prev = get().progress;
        const completedEpisodeIds = prev.completedEpisodeIds.includes(episodeId)
          ? prev.completedEpisodeIds
          : [...prev.completedEpisodeIds, episodeId];
        const masteryByCollection = { ...prev.masteryByCollection };
        for (const id of collectionIds) {
          masteryByCollection[id] = (masteryByCollection[id] ?? 0) + 1;
        }
        const best = prev.bestProcessByEpisode[episodeId] ?? 0;
        const mk = monthKey();
        const monthlyCompletions =
          prev.monthlyKey === mk ? prev.monthlyCompletions + 1 : 1;
        set({
          progress: {
            ...prev,
            completedEpisodeIds,
            attemptCount: prev.attemptCount + 1,
            ...nextStreak(prev),
            masteryByCollection,
            bestProcessByEpisode: {
              ...prev.bestProcessByEpisode,
              [episodeId]: Math.max(best, processScore),
            },
            monthlyKey: mk,
            monthlyCompletions,
          },
        });
      },
      clearActive: () => set({ activeSession: null }),
    }),
    {
      name: 'tradevision-replay-tv-v2',
      storage: createPersistedStorage(),
      partialize: (state) => ({
        progress: state.progress,
        activeSession: stripCandles(state.activeSession),
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ReplayTvState>;
        let activeSession = p.activeSession ?? null;
        if (activeSession?.episodeId) {
          try {
            activeSession = hydrateReplayTvSessionCandles(activeSession);
          } catch {
            activeSession = null;
          }
        }
        return {
          ...current,
          ...p,
          activeSession,
          progress: {
            ...EMPTY_PROGRESS,
            ...p.progress,
            monthlyKey: p.progress?.monthlyKey ?? null,
            monthlyCompletions: p.progress?.monthlyCompletions ?? 0,
          },
        };
      },
    },
  ),
);
