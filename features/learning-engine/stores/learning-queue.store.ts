import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEMO_USER_UID } from '@/firebase/config';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type { QueueDisposition, TrainingHandoff } from '../types/learning-engine.types';
import type { TrainingSessionLength } from '@/features/training-planner/types/training-planner.types';

const DAY = 24 * 60 * 60 * 1000;
const RECENT_CAP = 12;

interface QueueUserSlice {
  dispositions: Record<string, QueueDisposition>;
  conceptDeferCounts: Record<string, number>;
  recentActivityKeys: string[];
  activeHandoff: TrainingHandoff | null;
  sessionLength: TrainingSessionLength | null;
}

interface LearningQueueState extends QueueUserSlice {
  activeUid: string;
  byUser: Record<string, QueueUserSlice>;
  plannerPrimaryCta: { label: string; href: string } | null;
  setActiveUid: (uid: string) => void;
  sliceFor: (uid: string) => QueueUserSlice;
  skip: (id: string, now?: number, conceptId?: string) => void;
  defer: (id: string, now?: number, conceptId?: string, reason?: string) => void;
  bookmark: (id: string) => void;
  clear: (id: string) => void;
  recordOpened: (activityKey: string) => void;
  setHandoff: (handoff: TrainingHandoff | null) => void;
  setSessionLength: (length: TrainingSessionLength | null) => void;
  setPlannerPrimaryCta: (cta: { label: string; href: string } | null) => void;
  mergeFromRemote: (input: {
    dispositions: Record<string, QueueDisposition>;
    conceptDeferCounts: Record<string, number>;
    sessionLength: TrainingSessionLength | null;
  }) => void;
  reset: () => void;
}

function merge(
  current: Record<string, QueueDisposition>,
  id: string,
  patch: QueueDisposition,
): Record<string, QueueDisposition> {
  return { ...current, [id]: { ...current[id], ...patch } };
}

const EMPTY_SLICE: QueueUserSlice = {
  dispositions: {},
  conceptDeferCounts: {},
  recentActivityKeys: [],
  activeHandoff: null,
  sessionLength: null,
};

const EMPTY = {
  activeUid: DEMO_USER_UID,
  byUser: {} as Record<string, QueueUserSlice>,
  ...EMPTY_SLICE,
  plannerPrimaryCta: null as { label: string; href: string } | null,
};

export const useLearningQueueStore = create<LearningQueueState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
      setActiveUid: (uid) => {
        const nextUid = uid.trim() || DEMO_USER_UID;
        const state = get();
        const current: QueueUserSlice = {
          dispositions: state.dispositions,
          conceptDeferCounts: state.conceptDeferCounts,
          recentActivityKeys: state.recentActivityKeys,
          activeHandoff: state.activeHandoff,
          sessionLength: state.sessionLength,
        };
        const byUser = { ...state.byUser, [state.activeUid]: current };
        const next = byUser[nextUid] ?? EMPTY_SLICE;
        set({
          activeUid: nextUid,
          byUser,
          ...next,
          plannerPrimaryCta: null,
        });
      },
      sliceFor: (uid) => {
        const state = get();
        if (uid === state.activeUid) {
          return {
            dispositions: state.dispositions,
            conceptDeferCounts: state.conceptDeferCounts,
            recentActivityKeys: state.recentActivityKeys,
            activeHandoff: state.activeHandoff,
            sessionLength: state.sessionLength,
          };
        }
        return state.byUser[uid] ?? EMPTY_SLICE;
      },
      skip: (id, now = Date.now(), conceptId) => {
        const current = get().dispositions[id];
        set({
          dispositions: merge(get().dispositions, id, {
            skippedUntil: now + 3 * DAY,
            skipCount: (current?.skipCount ?? 0) + 1,
          }),
          conceptDeferCounts: conceptId
            ? get().conceptDeferCounts
            : get().conceptDeferCounts,
        });
      },
      defer: (id, now = Date.now(), conceptId, reason) => {
        const current = get().dispositions[id];
        const nextCount = (current?.deferCount ?? 0) + 1;
        const conceptDeferCounts = { ...get().conceptDeferCounts };
        if (conceptId) {
          conceptDeferCounts[conceptId] = (conceptDeferCounts[conceptId] ?? 0) + 1;
        }
        set({
          dispositions: merge(get().dispositions, id, {
            deferredUntil: now + DAY,
            deferCount: nextCount,
            lastDeferredAt: now,
            lastDeferReason: reason?.trim() ? reason.trim() : current?.lastDeferReason,
          }),
          conceptDeferCounts,
        });
      },
      bookmark: (id) => {
        const current = get().dispositions[id];
        set({ dispositions: merge(get().dispositions, id, { bookmarked: !current?.bookmarked }) });
      },
      clear: (id) => {
        const next = { ...get().dispositions };
        delete next[id];
        set({ dispositions: next });
      },
      recordOpened: (activityKey) => {
        const key = activityKey.trim();
        if (!key) return;
        const recent = [key, ...get().recentActivityKeys.filter((item) => item !== key)].slice(0, RECENT_CAP);
        set({ recentActivityKeys: recent });
      },
      setHandoff: (handoff) => set({ activeHandoff: handoff }),
      setSessionLength: (length) => set({ sessionLength: length }),
      setPlannerPrimaryCta: (cta) => set({ plannerPrimaryCta: cta }),
      mergeFromRemote: (input) => {
        const dispositions = { ...get().dispositions };
        for (const [id, row] of Object.entries(input.dispositions)) {
          const current = dispositions[id];
          dispositions[id] = {
            ...row,
            lastDeferReason: current?.lastDeferReason ?? row.lastDeferReason,
            skipCount: Math.max(current?.skipCount ?? 0, row.skipCount ?? 0) || row.skipCount,
            deferCount: Math.max(current?.deferCount ?? 0, row.deferCount ?? 0) || row.deferCount,
            skippedUntil: Math.max(current?.skippedUntil ?? 0, row.skippedUntil ?? 0) || row.skippedUntil,
            deferredUntil: Math.max(current?.deferredUntil ?? 0, row.deferredUntil ?? 0) || row.deferredUntil,
            bookmarked: Boolean(current?.bookmarked || row.bookmarked) || undefined,
          };
        }
        const conceptDeferCounts = { ...get().conceptDeferCounts };
        for (const [id, count] of Object.entries(input.conceptDeferCounts)) {
          conceptDeferCounts[id] = Math.max(conceptDeferCounts[id] ?? 0, count);
        }
        set({
          dispositions,
          conceptDeferCounts,
          sessionLength: get().sessionLength ?? input.sessionLength,
        });
      },
      reset: () => {
        const uid = get().activeUid;
        set({
          ...EMPTY_SLICE,
          plannerPrimaryCta: null,
          byUser: { ...get().byUser, [uid]: EMPTY_SLICE },
        });
      },
    }),
    {
      name: 'tradevision-learning-queue-v1',
      storage: createPersistedStorage(),
      version: 5,
      partialize: (state) => ({
        activeUid: state.activeUid,
        byUser: {
          ...state.byUser,
          [state.activeUid]: {
            dispositions: state.dispositions,
            conceptDeferCounts: state.conceptDeferCounts,
            recentActivityKeys: state.recentActivityKeys,
            activeHandoff: state.activeHandoff,
            sessionLength: state.sessionLength,
          },
        },
        dispositions: state.dispositions,
        conceptDeferCounts: state.conceptDeferCounts,
        recentActivityKeys: state.recentActivityKeys,
        activeHandoff: state.activeHandoff,
        sessionLength: state.sessionLength,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<LearningQueueState> & {
          byUser?: Record<string, QueueUserSlice>;
        };
        if (state.byUser && Object.keys(state.byUser).length > 0) {
          const uid = state.activeUid || DEMO_USER_UID;
          const slice = state.byUser[uid] ?? EMPTY_SLICE;
          return {
            activeUid: uid,
            byUser: state.byUser,
            ...slice,
          };
        }
        const slice: QueueUserSlice = {
          dispositions: state.dispositions ?? {},
          conceptDeferCounts: state.conceptDeferCounts ?? {},
          recentActivityKeys: state.recentActivityKeys ?? [],
          activeHandoff: state.activeHandoff ?? null,
          sessionLength: state.sessionLength ?? null,
        };
        return {
          activeUid: DEMO_USER_UID,
          byUser: { [DEMO_USER_UID]: slice },
          ...slice,
        };
      },
    },
  ),
);
