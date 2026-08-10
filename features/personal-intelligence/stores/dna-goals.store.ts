import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { ProcessGoalId } from '../types/personal-intelligence.types';

const STORAGE_PREFIX = 'aithera-dna-process-goals:';

interface DnaGoalsState {
  uid: string;
  selectedGoals: ProcessGoalId[];
  hydrated: boolean;
  hydrate: (uid: string) => Promise<void>;
  setGoals: (goals: ProcessGoalId[]) => Promise<void>;
  toggleGoal: (goal: ProcessGoalId) => Promise<void>;
  clear: () => Promise<void>;
}

function storageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid || 'demo-guest'}`;
}

function normalizeGoals(goals: ProcessGoalId[]): ProcessGoalId[] {
  return [...new Set(goals)].slice(0, 2);
}

export const useDnaGoalsStore = create<DnaGoalsState>((set, get) => ({
  uid: '',
  selectedGoals: [],
  hydrated: false,
  hydrate: async (uid: string) => {
    const key = storageKey(uid);
    try {
      const raw = await AsyncStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as { selectedGoals?: ProcessGoalId[] }) : null;
      set({
        uid,
        selectedGoals: normalizeGoals(parsed?.selectedGoals ?? []),
        hydrated: true,
      });
    } catch {
      set({ uid, selectedGoals: [], hydrated: true });
    }
  },
  setGoals: async (goals) => {
    const uid = get().uid || 'demo-guest';
    const selectedGoals = normalizeGoals(goals);
    set({ selectedGoals });
    await AsyncStorage.setItem(storageKey(uid), JSON.stringify({ selectedGoals }));
  },
  toggleGoal: async (goal) => {
    const current = get().selectedGoals;
    const next = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : normalizeGoals([...current, goal]);
    await get().setGoals(next);
  },
  clear: async () => {
    const uid = get().uid || 'demo-guest';
    set({ selectedGoals: [] });
    await AsyncStorage.removeItem(storageKey(uid));
  },
}));
