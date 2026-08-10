import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

interface ChecklistProgressState {
  checkedItems: Record<string, string[]>;
  toggleItem: (checklistId: string, itemId: string) => void;
  resetChecklist: (checklistId: string) => void;
  isItemChecked: (checklistId: string, itemId: string) => boolean;
}

/**
 * Kept in its own module so sign-out / account wipe can reset it without
 * importing Academy hooks (those pull auth → clear-state → hooks cycles).
 */
export const useChecklistStore = create<ChecklistProgressState>()(
  persist(
    (set, get) => ({
      checkedItems: {},
      toggleItem: (checklistId, itemId) => {
        const current = get().checkedItems[checklistId] ?? [];
        const next = current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId];
        set({ checkedItems: { ...get().checkedItems, [checklistId]: next } });
      },
      resetChecklist: (checklistId) => {
        const { [checklistId]: _, ...rest } = get().checkedItems;
        set({ checkedItems: rest });
      },
      isItemChecked: (checklistId, itemId) =>
        (get().checkedItems[checklistId] ?? []).includes(itemId),
    }),
    {
      name: 'tradevision-checklist-progress',
      storage: createPersistedStorage(),
    },
  ),
);
