import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAcademy } from '@/features/academy/hooks/useAcademy';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useDecisionBrief,
  useRiskCenter,
  useTraderMemory,
} from '@/features/decision/hooks/useDecision';
import { useTradingMentor } from '@/features/decision/hooks/useTradingMentor';
import { getDecisionRecords } from '@/features/decision-log/services/decision-log.service';
import { useDecisionLog } from '@/features/decision-log/hooks/useDecisionLog';
import {
  buildDecisionHeatmap,
  learningEventsFromAcademyLessons,
} from '@/features/decision-heatmap/services/heatmap.service';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { buildLabStats } from '@/features/decision-lab/services/lab-stats.service';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { useSimulatorStore } from '@/features/decision-simulator/stores/simulator.store';
import { useJournal } from '@/features/journal/hooks/useJournal';
import { selectTodayTimeBudget } from '@/features/decision/services/today-sections.service';
import { useSettingsStore } from '@/shared/stores/settings.store';

import { newlyUnlockedAchievementDates } from '../services/passport-achievements.service';
import {
  buildPassportExportPackage,
  sharePassportExport,
} from '../services/passport-export.service';
import { buildDecisionPassportProfile } from '../services/passport-profile.service';
import { deriveSystemCredentials } from '../services/passport.service';
import { useDecisionPassportStore } from '../stores/passport.store';
import type { PassportTab } from '../types/passport.types';

/**
 * Flagship Decision Passport — composes Mentor, Heatmap, Log, Journal,
 * Academy, Lab, Simulator ledger, Risk, Brief, and Memory.
 * No duplicated RVS/DQS scoring.
 */
export function useDecisionPassport() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [tab, setTab] = useState<PassportTab>('overview');

  const credentials = useDecisionPassportStore((s) => s.credentials);
  const processScores = useDecisionPassportStore((s) => s.processScores);
  const lastAction = useDecisionPassportStore((s) => s.lastAction);
  const unlockedAchievementDates = useDecisionPassportStore((s) => s.unlockedAchievementDates);
  const syncAchievementDates = useDecisionPassportStore((s) => s.syncAchievementDates);
  const syncDerivedCredentials = useDecisionPassportStore((s) => s.syncDerivedCredentials);

  const mentorQuery = useTradingMentor();
  const memoryQuery = useTraderMemory();
  const { summary: logSummary } = useDecisionLog();
  const { entries: journalEntries } = useJournal();
  const { completedCount, practicedCount, totalCount } = useAcademy();
  const labPositions = useDecisionLabStore((s) => s.positions);
  const labStats = useMemo(() => buildLabStats(labPositions), [labPositions]);
  const riskQuery = useRiskCenter();
  const timeBudgetMinutes = useSettingsStore(selectTodayTimeBudget);
  const briefQuery = useDecisionBrief(timeBudgetMinutes);
  const lessons = useAcademyProgressStore((s) => s.lessons);
  const simulatorHistory = useSimulatorStore((s) => s.history);

  const recordsQuery = useQuery({
    queryKey: ['decision-passport', 'records', uid ?? 'guest'],
    queryFn: () => getDecisionRecords(uid, 200),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  const heatmapScores = useMemo(() => {
    if (!recordsQuery.data) return null;
    return buildDecisionHeatmap({
      records: recordsQuery.data,
      period: 'weekly',
      learningEvents: learningEventsFromAcademyLessons(lessons),
      simulatorHistory: simulatorHistory.map((h) => ({
        createdAt: h.createdAt,
        processScore: h.processScore,
      })),
    }).scores;
  }, [recordsQuery.data, lessons, simulatorHistory]);

  const profile = useMemo(() => {
    if (!recordsQuery.data) return undefined;
    return buildDecisionPassportProfile({
      credentials,
      processScores,
      lastAction,
      unlockedAchievementDates,
      mentor: mentorQuery.data,
      memory: memoryQuery.data,
      heatmapScores,
      logRecords: recordsQuery.data,
      logSummary,
      journalCount: journalEntries.length,
      academyCompleted: completedCount,
      academyPracticed: practicedCount,
      academyTotal: totalCount,
      labStats,
      risk: riskQuery.data,
      brief: briefQuery.data,
    });
  }, [
    recordsQuery.data,
    credentials,
    processScores,
    lastAction,
    unlockedAchievementDates,
    mentorQuery.data,
    memoryQuery.data,
    heatmapScores,
    logSummary,
    journalEntries.length,
    completedCount,
    practicedCount,
    totalCount,
    labStats,
    riskQuery.data,
    briefQuery.data,
  ]);

  useEffect(() => {
    const replayCount =
      recordsQuery.data?.filter((r) => r.action === 'replay_completed').length ?? 0;
    const derived = deriveSystemCredentials({
      journalCount: journalEntries.length,
      academyCompleted: completedCount,
      replayCount,
      labClosedCount: labStats.tradesClosed,
      labAvgProcessScore: labStats.avgProcessScore,
    });
    syncDerivedCredentials(derived);
  }, [
    journalEntries.length,
    completedCount,
    recordsQuery.data,
    labStats.tradesClosed,
    labStats.avgProcessScore,
    syncDerivedCredentials,
  ]);

  useEffect(() => {
    if (!profile) return;
    const existing = useDecisionPassportStore.getState().unlockedAchievementDates;
    const next = newlyUnlockedAchievementDates(
      profile.achievements,
      existing,
      profile.generatedAt,
    );
    syncAchievementDates(next);
  }, [profile, syncAchievementDates]);

  const exportPackage = useMemo(
    () => (profile ? buildPassportExportPackage(profile) : null),
    [profile],
  );

  const shareExport = async () => {
    if (!exportPackage) return;
    await sharePassportExport(exportPackage);
  };

  return {
    tab,
    setTab,
    profile,
    exportPackage,
    /** @deprecated use exportPackage */
    exportStub: exportPackage,
    shareExport,
    isLoading:
      recordsQuery.isLoading ||
      (mentorQuery.isLoading && !mentorQuery.data && !recordsQuery.data),
    isRefetching: recordsQuery.isRefetching || mentorQuery.isRefetching,
    refetch: async () => {
      await Promise.all([recordsQuery.refetch(), mentorQuery.refetch(), memoryQuery.refetch()]);
    },
  };
}
