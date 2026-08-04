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
    set({
      snapshot,
      evaluated: evaluateAllFlags(snapshot.flags, context),
    });
  },
  reevaluate: (context) => {
    set({ evaluated: evaluateAllFlags(get().snapshot.flags, context) });
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
