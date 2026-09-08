import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import {
  buildReplayTvDecisionLogNote,
  evaluateReplayTvBeginAccess,
  recordReplayTvMonthlyConsumption,
  type ReplayTvAccessResult,
} from '@/features/decision-replay-tv/services/replay-tv-access.service';
import { softSaveReplayTvReflection } from '@/features/decision-replay-tv/services/replay-tv-journal.service';
import { selectReplayTvNextPractice } from '@/features/decision-replay-tv/services/replay-tv-skills.service';
import {
  getVisibleCandlesForSession,
  getVisibleNewsForSession,
  getBlindSafeEpisodeView,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import { useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import type {
  ReplayTvChecklist,
  ReplayTvDecision,
  ReplayTvReasoning,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';
import { useEntitlement } from '@/features/subscription/hooks/useEntitlement';
import { DEMO_USER_UID } from '@/firebase/config';
import { trackEvent } from '@/shared/services/analytics';

export function useReplayTv() {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? DEMO_USER_UID;
  const { isPremium } = useEntitlement('replaySessionsMonthly');
  const [accessBlock, setAccessBlock] = useState<ReplayTvAccessResult | null>(null);

  const activeSession = useReplayTvStore((s) => s.activeSession);
  const progress = useReplayTvStore((s) => s.progress);
  const startEpisode = useReplayTvStore((s) => s.startEpisode);
  const restartEpisode = useReplayTvStore((s) => s.restartEpisode);
  const advancePhase = useReplayTvStore((s) => s.advancePhase);
  const updateChecklist = useReplayTvStore((s) => s.updateChecklist);
  const submitDecision = useReplayTvStore((s) => s.submitDecision);
  const updateDraftReasoning = useReplayTvStore((s) => s.updateDraftReasoning);
  const markComplete = useReplayTvStore((s) => s.markComplete);
  const clearActive = useReplayTvStore((s) => s.clearActive);
  const recordPassport = useDecisionPassportStore((s) => s.recordSimulatorResult);
  const appendDecision = useAppendDecisionRecord();

  const episode = activeSession ? getReplayTvEpisode(activeSession.episodeId) : null;
  const visibleCandles = useMemo(
    () => (activeSession && episode ? getVisibleCandlesForSession(activeSession) : []),
    [activeSession, episode],
  );
  const visibleNews = useMemo(
    () => (activeSession && episode ? getVisibleNewsForSession(activeSession) : []),
    [activeSession, episode],
  );
  const blindView = useMemo(
    () => (activeSession && episode ? getBlindSafeEpisodeView(activeSession) : null),
    [activeSession, episode],
  );
  const nextPractice = selectReplayTvNextPractice(progress);

  const beginMutation = useMutation({
    mutationFn: async (episodeId: string) => {
      const ep = getReplayTvEpisode(episodeId);
      if (!ep) throw new Error('Episode missing.');
      const access = await evaluateReplayTvBeginAccess({
        uid,
        episode: ep,
        isPremium,
      });
      if (!access.allowed) {
        setAccessBlock(access);
        throw new Error(access.message ?? 'Replay TV session unavailable.');
      }
      setAccessBlock(null);
      void trackEvent('replay_started', {
        episodeId: ep.id.slice(0, 64),
        difficulty: ep.difficulty,
      });
      return startEpisode(episodeId);
    },
    onSuccess: () => {
      router.push('/decision/replay-tv/session' as never);
    },
  });

  const finishMutation = useMutation({
    mutationFn: async () => {
      const session = useReplayTvStore.getState().activeSession;
      if (!session?.scores) {
        throw new Error('Replay TV session is not ready to finish.');
      }
      const ep = getReplayTvEpisode(session.episodeId);
      if (!ep) throw new Error('Episode missing.');

      markComplete({
        episodeId: ep.id,
        collectionIds: ep.collectionIds,
        processScore: session.scores.processQuality,
      });

      void trackEvent('replay_completed', {
        episodeId: ep.id.slice(0, 64),
        difficulty: ep.difficulty,
      });
      void trackEvent('replay_complete', {
        episodeId: ep.id.slice(0, 64),
        difficulty: ep.difficulty,
      });
      for (const skill of ep.skills.slice(0, 4)) {
        void trackEvent('replay_skill_completed', { skill: skill.slice(0, 64) });
      }

      await recordReplayTvMonthlyConsumption(uid);

      recordPassport({
        symbol: ep.symbol,
        action: 'wait',
        scores: {
          decisionQualityScore: session.scores.overall,
          checklistScore: session.scores.checklistIntegrity,
          riskScore: session.scores.riskAwareness,
          disciplineScore: session.scores.processQuality,
          reasoningScore: session.scores.reasoningQuality,
          processScore: session.scores.processQuality,
          whatHappened: ep.historicalOutcome,
          whyItMatters:
            'Replay TV grades process under a blind historical tape — never P&L.',
          aiNoticed: session.scores.coaching,
          whatWasMissed: session.scores.processComparison
            ? [session.scores.processComparison.missed]
            : session.checklist.namedInvalidation
              ? ['Keep naming invalidation at every pause.']
              : ['Named invalidation was missing at least once.'],
          learningSummary: session.scores.coaching[0] ?? 'Process loop closed.',
          journalPrompt: session.scores.journalPrompt,
          academyHint: session.scores.academyHint
            ? {
                lessonId: session.scores.academyHint.lessonId,
                title: 'Academy follow-up',
                reason: session.scores.academyHint.reason,
              }
            : undefined,
          replayHref: `/decision/replay-tv/${ep.id}`,
        },
      });

      await appendDecision.mutateAsync({
        symbol: ep.symbol,
        regime: ep.eraLabel,
        action: 'replay_completed',
        bias: 'neutral',
        decisionQualityScore: session.scores.overall,
        note: buildReplayTvDecisionLogNote({
          episode: ep,
          processQuality: session.scores.processQuality,
          evidenceQuality: session.scores.evidenceQuality,
          invalidationClarity: session.scores.invalidationClarity,
          patience: session.scores.patience,
          namedInvalidation: session.checklist.namedInvalidation,
          decisions: session.decisions,
        }),
        eventKey: `replay-tv:${ep.id}:${session.id}`,
      });

      return session;
    },
  });

  const saveJournalMutation = useMutation({
    mutationFn: async () => {
      const session = useReplayTvStore.getState().activeSession;
      if (!session?.scores || !episode) {
        throw new Error('Nothing to save yet.');
      }
      return softSaveReplayTvReflection({
        uid,
        episode,
        session,
        scores: session.scores,
      });
    },
  });

  return {
    activeSession,
    episode,
    visibleCandles,
    visibleNews,
    blindView,
    progress,
    accessBlock,
    clearAccessBlock: () => setAccessBlock(null),
    isPremium,
    beginEpisode: beginMutation.mutateAsync,
    isStarting: beginMutation.isPending,
    advancePhase,
    restartEpisode,
    updateChecklist: (patch: Partial<ReplayTvChecklist>) => updateChecklist(patch),
    submitDecision: (decision: ReplayTvDecision, reasoning: string, structured?: ReplayTvReasoning) =>
      submitDecision(decision, reasoning, structured),
    finishSession: finishMutation.mutateAsync,
    isFinishing: finishMutation.isPending,
    finishError: finishMutation.error,
    saveReflectionToJournal: saveJournalMutation.mutateAsync,
    isSavingJournal: saveJournalMutation.isPending,
    journalSaved: Boolean(saveJournalMutation.data),
    journalError: saveJournalMutation.error,
    nextPractice,
    updateDraftReasoning,
    clearActive: () => {
      const session = useReplayTvStore.getState().activeSession;
      if (session && session.phase !== 'complete' && session.phase !== 'skill') {
        void trackEvent('replay_abandoned', {
          episodeId: session.episodeId.slice(0, 64),
        });
      }
      clearActive();
    },
  };
}
