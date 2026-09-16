import { create } from 'zustand';

import { createDefaultOpsBootstrap } from '../defaults';
import { evaluateAllFlags } from '../services/evaluate-flag';
import type {
  FlagEvaluationContext,
  OpsBootstrapSnapshot,
  OpsFeatureFlags,
  OpsRemoteConfig,
} from '../types/ops-config.types';

interface OpsConfigState {
  snapshot: OpsBootstrapSnapshot;
  evaluated: Record<keyof OpsFeatureFlags, boolean>;
  setSnapshot: (snapshot: OpsBootstrapSnapshot, context?: FlagEvaluationContext) => void;
  reevaluate: (context: FlagEvaluationContext) => void;
}

export const useOpsConfigStore = create<OpsConfigState>((set, get) => ({
  snapshot: createDefaultOpsBootstrap(),
  evaluated: evaluateAllFlags(createDefaultOpsBootstrap().flags),
  setSnapshot: (snapshot, context = {}) => {
    const current = get();
    const evaluated = evaluateAllFlags(snapshot.flags, context);
    if (
      current.snapshot === snapshot &&
      Object.keys(evaluated).every(
        (key) => evaluated[key as keyof OpsFeatureFlags] === current.evaluated[key as keyof OpsFeatureFlags],
      )
    ) {
      return;
    }
    set({
      snapshot,
      evaluated,
    });
  },
  reevaluate: (context) => {
    const evaluated = evaluateAllFlags(get().snapshot.flags, context);
    const current = get().evaluated;
    if (
      Object.keys(evaluated).every(
        (key) => evaluated[key as keyof OpsFeatureFlags] === current[key as keyof OpsFeatureFlags],
      )
    ) {
      return;
    }
    set({ evaluated });
  },
}));

export function selectRemoteConfig(state: OpsConfigState): OpsRemoteConfig {
  return state.snapshot.remote;
}

export function selectFlagEnabled(
  state: OpsConfigState,
  key: keyof OpsFeatureFlags,
): boolean {
  return state.evaluated[key];
}
