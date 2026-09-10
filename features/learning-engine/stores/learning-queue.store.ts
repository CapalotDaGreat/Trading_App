import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type { QueueDisposition } from '../types/learning-engine.types';

const DAY = 24 * 60 * 60 * 1000;

interface LearningQueueState {
  dispositions: Record<string, QueueDisposition>;
  skip: (id: string, now?: number) => void;
  defer: (id: string, now?: number) => void;
  bookmark: (id: string) => void;
  clear: (id: string) => void;
}

function merge(
  current: Record<string, QueueDisposition>,
  id: string,
  patch: QueueDisposition,
): Record<string, QueueDisposition> {
  return { ...current, [id]: { ...current[id], ...patch } };
}

export const useLearningQueueStore = create<LearningQueueState>()(
  persist(
    (set, get) => ({
      dispositions: {},
      skip: (id, now = Date.now()) =>
        set({ dispositions: merge(get().dispositions, id, { skippedUntil: now + 3 * DAY }) }),
      defer: (id, now = Date.now()) =>
        set({ dispositions: merge(get().dispositions, id, { deferredUntil: now + DAY }) }),
      bookmark: (id) => {
        const current = get().dispositions[id];
        set({ dispositions: merge(get().dispositions, id, { bookmarked: !current?.bookmarked }) });
      },
      clear: (id) => {
        const next = { ...get().dispositions };
        delete next[id];
        set({ dispositions: next });
      },
    }),
    {
      name: 'tradevision-learning-queue-v1',
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
