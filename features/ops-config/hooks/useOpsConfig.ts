import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as Updates from 'expo-updates';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  resolveBuildChannel,
} from '../services/evaluate-flag';
import { fetchOpsBootstrap } from '../services/ops-config.service';
import { selectFlagEnabled, selectRemoteConfig, useOpsConfigStore } from '../stores/ops-config.store';
import type { OpsFeatureFlags, OpsRemoteConfig } from '../types/ops-config.types';

export const opsConfigKeys = {
  all: ['ops-config'] as const,
  bootstrap: ['ops-config', 'bootstrap'] as const,
};

export function useOpsConfigBootstrap() {
  const { user } = useAuth();
  const isPremium = useSubscriptionStore((s) => s.tier === 'premium');
  const setSnapshot = useOpsConfigStore((s) => s.setSnapshot);
  const reevaluate = useOpsConfigStore((s) => s.reevaluate);

  const channel = resolveBuildChannel(Updates.channel);

  const query = useQuery({
    queryKey: opsConfigKeys.bootstrap,
    queryFn: fetchOpsBootstrap,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  useEffect(() => {
    if (query.data) {
      setSnapshot(query.data, {
        uid: user?.uid,
        isPremium,
        channel,
      });
    }
  }, [query.data, setSnapshot, user?.uid, isPremium, channel]);

  useEffect(() => {
    reevaluate({ uid: user?.uid, isPremium, channel });
  }, [reevaluate, user?.uid, isPremium, channel]);

  return query;
}

export function useFeatureFlag(key: keyof OpsFeatureFlags): boolean {
  return useOpsConfigStore((s) => selectFlagEnabled(s, key));
}

export function useRemoteConfig(): OpsRemoteConfig {
  return useOpsConfigStore(selectRemoteConfig);
}

export function useOpsEvaluatedFlags(): Record<keyof OpsFeatureFlags, boolean> {
  return useOpsConfigStore((s) => s.evaluated);
}
