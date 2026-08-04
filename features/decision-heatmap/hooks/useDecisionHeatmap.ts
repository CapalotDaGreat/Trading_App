import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTraderMemory } from '@/features/decision/hooks/useDecision';
import { buildWeeklyReview } from '@/features/decision/services/coaching-loop.service';
import {
  getDecisionRecords,
  summarizeDecisionLog,
} from '@/features/decision-log/services/decision-log.service';
import { summarizePassport } from '@/features/decision-passport/services/passport.service';
import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';
import { useSimulatorStore } from '@/features/decision-simulator/stores/simulator.store';

import {
  buildDecisionHeatmap,
  learningEventsFromAcademyLessons,
} from '../services/heatmap.service';
import type { HeatmapCell, HeatmapPeriod } from '../types/heatmap.types';

export const decisionHeatmapKeys = {
  all: ['decision-heatmap'] as const,
  records: (uid: string | undefined) => ['decision-heatmap', 'records', uid ?? 'guest'] as const,
};

/**
 * Decision Heatmap — derives from Decision Log (+ Academy timestamps, Simulator history).
 * No duplicate activity storage.
 */
export function useDecisionHeatmap(initialPeriod: HeatmapPeriod = 'weekly') {
  const { user } = useAuth();
  const uid = user?.uid;
  const [period, setPeriod] = useState<HeatmapPeriod>(initialPeriod);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const lessons = useAcademyProgressStore((s) => s.lessons);
  const simulatorHistory = useSimulatorStore((s) => s.history);
  const processScores = useDecisionPassportStore((s) => s.processScores);
  const credentials = useDecisionPassportStore((s) => s.credentials);
  const lastAction = useDecisionPassportStore((s) => s.lastAction);
  const passport = useMemo(
    () => summarizePassport({ processScores, credentials, lastAction }),
    [processScores, credentials, lastAction],
  );
  const memoryQuery = useTraderMemory();

  const learningEvents = useMemo(() => learningEventsFromAcademyLessons(lessons), [lessons]);

  const recordsQuery = useQuery({
    queryKey: decisionHeatmapKeys.records(uid),
    queryFn: () => getDecisionRecords(uid, 200),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  const snapshot = useMemo(() => {
    if (!recordsQuery.data) return undefined;
    return buildDecisionHeatmap({
      records: recordsQuery.data,
      period,
      learningEvents,
      simulatorHistory: simulatorHistory.map((h) => ({
        createdAt: h.createdAt,
        processScore: h.processScore,
      })),
    });
  }, [recordsQuery.data, period, learningEvents, simulatorHistory]);

  const selectedCell: HeatmapCell | null = useMemo(() => {
    if (!snapshot || !selectedKey) return null;
    return snapshot.cells.find((c) => c.key === selectedKey) ?? null;
  }, [snapshot, selectedKey]);

  const weeklyReview = useMemo(() => {
    if (!recordsQuery.data) return null;
    return buildWeeklyReview(summarizeDecisionLog(recordsQuery.data));
  }, [recordsQuery.data]);

  return {
    period,
    setPeriod,
    snapshot,
    isLoading: recordsQuery.isLoading,
    isRefetching: recordsQuery.isRefetching,
    refetch: recordsQuery.refetch,
    selectedCell,
    setSelectedKey,
    passport,
    weeklyReview,
    memoryNote: memoryQuery.data?.typicalMistakes?.[0] ?? memoryQuery.data?.tradingStyle,
    memoryUpdatedAt: memoryQuery.data?.updatedAt,
  };
}
