import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  advanceReplayTvPhase,
  advanceReplayTvReveal,
  attachReplayTvReflection,
  createReplayTvSession,
  patchReplayTvAnnotations,
  patchReplayTvChecklist,
  patchReplayTvDraftReasoning,
  rehydrateReplayTvSession,
  stripReplayTvSessionForPersist,
  submitReplayTvDecision,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import type {
  ReplayTvAnnotation,
  ReplayTvChecklist,
  ReplayTvCollectionId,
  ReplayTvDecision,
  ReplayTvProgress,
  ReplayTvReasoning,
  ReplayTvSession,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import { DEMO_USER_UID } from '@/firebase/config';
import { createDebouncedPersistedStorage } from '@/shared/stores/create-persisted-storage';

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

export const EMPTY_REPLAY_TV_PROGRESS: ReplayTvProgress = {
  completedEpisodeIds: [],
  attemptCount: 0,
  streakDays: 0,
  lastCompletedDayKey: null,
  masteryByCollection: {},
  bestProcessByEpisode: {},
  monthlyKey: null,
  monthlyCompletions: 0,
};

export function migrateReplayTvPersistedState(persisted: unknown): {
  progressByUser: Record<string, ReplayTvProgress>;
  activeSessionByUser: Record<string, ReplayTvSession | null>;
} {
  const p = (persisted ?? {}) as {
    progressByUser?: Record<string, ReplayTvProgress>;
    activeSessionByUser?: Record<string, ReplayTvSession | null>;
    progress?: ReplayTvProgress;
    activeSession?: ReplayTvSession | null;
  };
  if (p.progressByUser) {
    const sessions: Record<string, ReplayTvSession | null> = {};
    for (const [uid, session] of Object.entries(p.activeSessionByUser ?? {})) {
      sessions[uid] = rehydrateReplayTvSession(session ?? null);
    }
    return {
      progressByUser: p.progressByUser,
      activeSessionByUser: sessions,
    };
  }
  return {
    progressByUser: {
      [DEMO_USER_UID]: {
        ...EMPTY_REPLAY_TV_PROGRESS,
        ...p.progress,
        monthlyKey: p.progress?.monthlyKey ?? null,
        monthlyCompletions: p.progress?.monthlyCompletions ?? 0,
      },
    },
    activeSessionByUser: {
      [DEMO_USER_UID]: rehydrateReplayTvSession(p.activeSession ?? null),
    },
  };
}

function writeSession(
  set: (partial: Partial<ReplayTvState> | ((state: ReplayTvState) => Partial<ReplayTvState>)) => void,
  get: () => ReplayTvState,
  userId: string,
  session: ReplayTvSession | null,
): ReplayTvSession | null {
  set({ activeSessionByUser: { ...get().activeSessionByUser, [userId]: session } });
  return session;
}

interface ReplayTvState {
  progressByUser: Record<string, ReplayTvProgress>;
  activeSessionByUser: Record<string, ReplayTvSession | null>;
  progressFor: (userId: string) => ReplayTvProgress;
  sessionFor: (userId: string) => ReplayTvSession | null;
  startEpisode: (userId: string, episodeId: string) => ReplayTvSession;
  restartEpisode: (userId: string) => ReplayTvSession | null;
  advancePhase: (userId: string) => void;
  updateChecklist: (userId: string, patch: Partial<ReplayTvChecklist>) => void;
  submitDecision: (
    userId: string,
    decision: ReplayTvDecision,
    reasoning: string,
    structured?: ReplayTvReasoning,
  ) => void;
  updateDraftReasoning: (userId: string, draft: ReplayTvReasoning) => void;
  commitReflection: (userId: string, reflection?: string) => void;
  advanceReveal: (userId: string) => void;
  updateAnnotations: (userId: string, annotations: ReplayTvAnnotation[]) => void;
  markComplete: (
    userId: string,
    input: {
      episodeId: string;
      collectionIds: ReplayTvCollectionId[];
      processScore: number;
    },
  ) => void;
  mergeProgress: (userId: string, progress: Partial<ReplayTvProgress>) => void;
  clearActive: (userId: string) => void;
}

export const useReplayTvStore = create<ReplayTvState>()(
  persist(
    (set, get) => ({
      progressByUser: {},
      activeSessionByUser: {},
      progressFor: (userId) => get().progressByUser[userId] ?? EMPTY_REPLAY_TV_PROGRESS,
      sessionFor: (userId) => get().activeSessionByUser[userId] ?? null,
      startEpisode: (userId, episodeId) => {
        const session = createReplayTvSession(episodeId);
        writeSession(set, get, userId, session);
        return session;
      },
      restartEpisode: (userId) => {
        const active = get().sessionFor(userId);
        if (!active) return null;
        return writeSession(set, get, userId, createReplayTvSession(active.episodeId));
      },
      advancePhase: (userId) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        writeSession(set, get, userId, advanceReplayTvPhase(active));
      },
      updateChecklist: (userId, patch) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        writeSession(set, get, userId, patchReplayTvChecklist(active, patch));
      },
      submitDecision: (userId, decision, reasoning, structured) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        writeSession(
          set,
          get,
          userId,
          submitReplayTvDecision({
            session: active,
            decision,
            reasoning,
            structured,
          }),
        );
      },
      updateDraftReasoning: (userId, draft) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        writeSession(set, get, userId, patchReplayTvDraftReasoning(active, draft));
      },
      commitReflection: (userId, reflection) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        const note = reflection ?? active.draftReasoning?.reflection ?? '';
        writeSession(set, get, userId, attachReplayTvReflection(active, note));
      },
      advanceReveal: (userId) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        writeSession(set, get, userId, advanceReplayTvReveal(active));
      },
      updateAnnotations: (userId, annotations) => {
        const active = get().sessionFor(userId);
        if (!active) return;
        writeSession(set, get, userId, patchReplayTvAnnotations(active, annotations));
      },
      markComplete: (userId, { episodeId, collectionIds, processScore }) => {
        const prev = get().progressFor(userId);
        const completedEpisodeIds = prev.completedEpisodeIds.includes(episodeId)
          ? prev.completedEpisodeIds
          : [...prev.completedEpisodeIds, episodeId];
        const masteryByCollection = { ...prev.masteryByCollection };
        for (const id of collectionIds) {
          masteryByCollection[id] = (masteryByCollection[id] ?? 0) + 1;
        }
        const best = prev.bestProcessByEpisode[episodeId] ?? 0;
        const mk = monthKey();
        const monthlyCompletions = prev.monthlyKey === mk ? prev.monthlyCompletions + 1 : 1;
        set({
          progressByUser: {
            ...get().progressByUser,
            [userId]: {
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
          },
        });
      },
      mergeProgress: (userId, progress) => {
        if (!userId.trim()) return;
        const prev = get().progressFor(userId);
        const completedEpisodeIds = [
          ...new Set([...prev.completedEpisodeIds, ...(progress.completedEpisodeIds ?? [])]),
        ];
        const bestProcessByEpisode = { ...prev.bestProcessByEpisode };
        for (const [id, score] of Object.entries(progress.bestProcessByEpisode ?? {})) {
          bestProcessByEpisode[id] = Math.max(bestProcessByEpisode[id] ?? 0, score);
        }
        const masteryByCollection = { ...prev.masteryByCollection };
        for (const [id, count] of Object.entries(progress.masteryByCollection ?? {})) {
          const key = id as keyof typeof masteryByCollection;
          masteryByCollection[key] = Math.max(masteryByCollection[key] ?? 0, count ?? 0);
        }
        set({
          progressByUser: {
            ...get().progressByUser,
            [userId]: {
              ...prev,
              completedEpisodeIds,
              attemptCount: Math.max(prev.attemptCount, progress.attemptCount ?? 0),
              bestProcessByEpisode,
              masteryByCollection,
            },
          },
        });
      },
      clearActive: (userId) => {
        writeSession(set, get, userId, null);
      },
    }),
    {
      name: 'tradevision-replay-tv-v2',
      storage: createDebouncedPersistedStorage(),
      version: 3,
      partialize: (state) => ({
        progressByUser: Object.fromEntries(
          Object.entries(state.progressByUser).map(([uid, progress]) => [uid, progress]),
        ),
        activeSessionByUser: Object.fromEntries(
          Object.entries(state.activeSessionByUser).map(([uid, session]) => [
            uid,
            stripReplayTvSessionForPersist(session),
          ]),
        ),
      }),
      merge: (persisted, current) => ({
        ...current,
        ...migrateReplayTvPersistedState(persisted),
      }),
    },
  ),
);
