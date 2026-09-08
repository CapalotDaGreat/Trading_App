import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

export interface JournalDraftValues {
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number | '';
  quantity: number;
  stopLoss?: number | '';
  takeProfit?: number | '';
  strategy?: string;
  tags?: string;
  emotion?: 'confident' | 'fearful' | 'greedy' | 'neutral' | 'fomo';
  planAdhered?: 'yes' | 'no' | 'unset';
  mistakeCategory?: string;
  notes: string;
  lessonsLearned?: string;
  improvementCommitment?: string;
  linkedReplayHref?: string;
}

interface JournalDraftState {
  draft: JournalDraftValues | null;
  savedAt: string | null;
  saveDraft: (draft: JournalDraftValues) => void;
  clearDraft: () => void;
}

export const useJournalDraftStore = create<JournalDraftState>()(
  persist(
    (set) => ({
      draft: null,
      savedAt: null,
      saveDraft: (draft) => set({ draft, savedAt: new Date().toISOString() }),
      clearDraft: () => set({ draft: null, savedAt: null }),
    }),
    {
      name: 'tradevision-journal-draft-v1',
      storage: createPersistedStorage(),
      version: 1,
    },
  ),
);
