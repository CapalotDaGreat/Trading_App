import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEMO_USER_UID } from '@/firebase/config';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

export interface PracticeAttempt {
  drillId: string;
  at: string;
  correct: boolean;
  selectedIndex: number;
  confidence?: 'low' | 'medium' | 'high';
}

interface PracticeProgressState {
  activeUid: string;
  attemptsByUser: Record<string, PracticeAttempt[]>;
  attempts: PracticeAttempt[];
  setActiveUid: (uid: string) => void;
  attemptsFor: (uid: string) => PracticeAttempt[];
  recordAttempt: (attempt: Omit<PracticeAttempt, 'at'> & { at?: string }) => void;
  mergeAttempts: (attempts: PracticeAttempt[]) => void;
  statsFor: (drillId: string) => { attempts: number; accuracy: number; lastCorrect?: boolean };
  repeatedMistakes: () => string[];
}

export const usePracticeProgressStore = create<PracticeProgressState>()(
  persist(
    (set, get) => ({
      activeUid: DEMO_USER_UID,
      attemptsByUser: {},
      attempts: [],
      setActiveUid: (uid) => {
        const nextUid = uid.trim() || DEMO_USER_UID;
        const state = get();
        const attemptsByUser = { ...state.attemptsByUser, [state.activeUid]: state.attempts };
        set({
          activeUid: nextUid,
          attemptsByUser,
          attempts: attemptsByUser[nextUid] ?? [],
        });
      },
      attemptsFor: (uid) => {
        const state = get();
        if (uid === state.activeUid) return state.attempts;
        return state.attemptsByUser[uid] ?? [];
      },
      recordAttempt: (attempt) => {
        const next: PracticeAttempt = {
          drillId: attempt.drillId,
          correct: attempt.correct,
          selectedIndex: attempt.selectedIndex,
          confidence: attempt.confidence,
          at: attempt.at ?? new Date().toISOString(),
        };
        const attempts = [...get().attempts, next].slice(-200);
        const uid = get().activeUid;
        set({
          attempts,
          attemptsByUser: { ...get().attemptsByUser, [uid]: attempts },
        });
      },
      mergeAttempts: (attempts) => {
        const byKey = new Map(get().attempts.map((row) => [`${row.drillId}:${row.at}`, row]));
        for (const row of attempts) {
          const key = `${row.drillId}:${row.at}`;
          if (!byKey.has(key)) byKey.set(key, row);
        }
        const merged = [...byKey.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-200);
        const uid = get().activeUid;
        set({
          attempts: merged,
          attemptsByUser: { ...get().attemptsByUser, [uid]: merged },
        });
      },
      statsFor: (drillId) => {
        const rows = get().attempts.filter((item) => item.drillId === drillId);
        const correct = rows.filter((item) => item.correct).length;
        return {
          attempts: rows.length,
          accuracy: rows.length ? correct / rows.length : 0,
          lastCorrect: rows.at(-1)?.correct,
        };
      },
      repeatedMistakes: () => {
        const misses = new Map<string, number>();
        for (const attempt of get().attempts) {
          if (attempt.correct) continue;
          misses.set(attempt.drillId, (misses.get(attempt.drillId) ?? 0) + 1);
        }
        return [...misses.entries()]
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id);
      },
    }),
    {
      name: 'tradevision-practice-progress-v1',
      storage: createPersistedStorage(),
      version: 2,
      partialize: (state) => ({
        activeUid: state.activeUid,
        attemptsByUser: { ...state.attemptsByUser, [state.activeUid]: state.attempts },
        attempts: state.attempts,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as {
          activeUid?: string;
          attemptsByUser?: Record<string, PracticeAttempt[]>;
          attempts?: PracticeAttempt[];
        };
        if (state.attemptsByUser) {
          const uid = state.activeUid || DEMO_USER_UID;
          return {
            activeUid: uid,
            attemptsByUser: state.attemptsByUser,
            attempts: state.attemptsByUser[uid] ?? [],
          };
        }
        const attempts = state.attempts ?? [];
        return {
          activeUid: DEMO_USER_UID,
          attemptsByUser: { [DEMO_USER_UID]: attempts },
          attempts,
        };
      },
    },
  ),
);
