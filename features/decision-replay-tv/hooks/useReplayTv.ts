import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import {
  getSessionEpisode,
  getVisibleCandlesForSession,
} from '@/features/decision-replay-tv/services/replay-tv-session.service';
import { useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import type {
  ReplayTvChecklist,
  ReplayTvDecision,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import { useAppendDecisionRecord } from '@/features/decision-log/hooks/useDecisionLog';
import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';

export function useReplayTv() {
  const router = useRouter();
  const activeSession = useReplayTvStore((s) => s.activeSession);
  const progress = useReplayTvStore((s) => s.progress);
  const startEpisode = useReplayTvStore((s) => s.startEpisode);
  const advancePhase = useReplayTvStore((s) => s.advancePhase);
  const updateChecklist = useReplayTvStore((s) => s.updateChecklist);
  const submitDecision = useReplayTvStore((s) => s.submitDecision);
  const markComplete = useReplayTvStore((s) => s.markComplete);
  const clearActive = useReplayTvStore((s) => s.clearActive);
  const recordPassport = useDecisionPassportStore((s) => s.recordSimulatorResult);
  const appendDecision = useAppendDecisionRecord();

  const episode = activeSession ? getSessionEpisode(activeSession) : null;
  const visibleCandles = activeSession
    ? getVisibleCandlesForSession(activeSession)
    : [];

  const beginMutation = useMutation({
    mutationFn: async (episodeId: string) => {
      const session = startEpisode(episodeId);
      return session;
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

      // Reuse simulator passport credential path with process-only scores.
      recordPassport({
        symbol: ep.symbol,
        action: 'wait',
        scores: {
          decisionQualityScore: session.scores.overall,
          checklistScore: session.scores.checklistIntegrity,
          riskScore: session.scores.patience,
          disciplineScore: session.scores.processQuality,
          reasoningScore: session.scores.reasoningQuality,
          processScore: session.scores.processQuality,
          whatHappened: ep.historicalOutcome,
          whyItMatters:
            'Replay TV grades process under a blind historical tape — never P&L.',
          aiNoticed: session.scores.coaching,
          whatWasMissed: session.checklist.namedInvalidation
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
        note: `Replay TV · ${ep.title} · process ${session.scores.processQuality}`,
        eventKey: `replay-tv:${ep.id}:${session.id}`,
      });

      return session;
    },
  });

  return {
    activeSession,
    episode,
    visibleCandles,
    progress,
    beginEpisode: beginMutation.mutateAsync,
    isStarting: beginMutation.isPending,
    advancePhase,
    updateChecklist: (patch: Partial<ReplayTvChecklist>) => updateChecklist(patch),
    submitDecision: (decision: ReplayTvDecision, reasoning: string) =>
      submitDecision(decision, reasoning),
    finishSession: finishMutation.mutateAsync,
    isFinishing: finishMutation.isPending,
    clearActive,
  };
}
