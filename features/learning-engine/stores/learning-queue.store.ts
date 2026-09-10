import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type { QueueDisposition, TrainingHandoff } from '../types/learning-engine.types';

const DAY = 24 * 60 * 60 * 1000;
const RECENT_CAP = 12;

interface LearningQueueState {
  dispositions: Record<string, QueueDisposition>;
  conceptDeferCounts: Record<string, number>;
  recentActivityKeys: string[];
  activeHandoff: TrainingHandoff | null;
  skip: (id: string, now?: number, conceptId?: string) => void;
  defer: (id: string, now?: number, conceptId?: string) => void;
  bookmark: (id: string) => void;
  clear: (id: string) => void;
  recordOpened: (activityKey: string) => void;
  setHandoff: (handoff: TrainingHandoff | null) => void;
  reset: () => void;
}

function merge(
  current: Record<string, QueueDisposition>,
  id: string,
  patch: QueueDisposition,
): Record<string, QueueDisposition> {
  return { ...current, [id]: { ...current[id], ...patch } };
}

const EMPTY = {
  dispositions: {} as Record<string, QueueDisposition>,
  conceptDeferCounts: {} as Record<string, number>,
  recentActivityKeys: [] as string[],
  activeHandoff: null as TrainingHandoff | null,
};

export const useLearningQueueStore = create<LearningQueueState>()(
  persist(
    (set, get) => ({
      ...EMPTY,
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
      defer: (id, now = Date.now(), conceptId) => {
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
      reset: () => set(EMPTY),
    }),
    {
      name: 'tradevision-learning-queue-v1',
      storage: createPersistedStorage(),
      version: 2,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<LearningQueueState>;
        return {
          dispositions: state.dispositions ?? {},
          conceptDeferCounts: state.conceptDeferCounts ?? {},
          recentActivityKeys: state.recentActivityKeys ?? [],
          activeHandoff: state.activeHandoff ?? null,
        };
      },
    },
  ),
);
