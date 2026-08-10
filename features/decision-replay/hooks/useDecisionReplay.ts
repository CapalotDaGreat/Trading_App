import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getDecisionRecords } from '@/features/decision-log/services/decision-log.service';
import {
  buildDecisionReplaySession,
  buildWeeklyGameTape,
  type ReplayRange,
} from '@/features/decision-replay/services/decision-replay.service';
import { loadTraderMemory } from '@/features/decision/services/trader-intelligence.service';
import { getJournalEntries } from '@/features/journal/services/journal.service';

export const decisionReplayKeys = {
  all: ['decision-replay'] as const,
  session: (uid: string | undefined, range: ReplayRange, symbol?: string) =>
    ['decision-replay', 'session', uid ?? 'guest', range, symbol ?? 'all'] as const,
  gameTape: (uid: string | undefined) => ['decision-replay', 'game-tape', uid ?? 'guest'] as const,
};

export function useDecisionReplaySession(range: ReplayRange, symbol?: string) {
  const { user } = useAuth();
  const uid = user?.uid;

  return useQuery({
    queryKey: decisionReplayKeys.session(uid, range, symbol),
    queryFn: async () => {
      const [records, memory, journals] = await Promise.all([
        getDecisionRecords(uid, 200),
        loadTraderMemory(uid),
        uid ? getJournalEntries(uid).catch(() => []) : Promise.resolve([]),
      ]);
      return buildDecisionReplaySession({
        records,
        range,
        symbol,
        memory,
        journals,
      });
    },
    staleTime: 30_000,
  });
}

export function useWeeklyGameTape() {
  const { user } = useAuth();
  const uid = user?.uid;

  return useQuery({
    queryKey: decisionReplayKeys.gameTape(uid),
    queryFn: async () => {
      const [records, memory, journals] = await Promise.all([
        getDecisionRecords(uid, 200),
        loadTraderMemory(uid),
        uid ? getJournalEntries(uid).catch(() => []) : Promise.resolve([]),
      ]);
      return buildWeeklyGameTape(records, journals, memory);
    },
    staleTime: 60_000,
  });
}

export function useReplayFrameIndex(frameCount: number, index: number) {
  return useMemo(() => {
    if (frameCount <= 0) return 0;
    return Math.max(0, Math.min(frameCount - 1, index));
  }, [frameCount, index]);
}
