import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import {
  buildEducationalCandles,
  visibleCandlesAt,
} from '@/features/decision-replay-tv/services/replay-tv-path.service';
import { scoreReplayTvSession } from '@/features/decision-replay-tv/services/replay-tv-score.service';
import type {
  ReplayTvChecklist,
  ReplayTvDecision,
  ReplayTvEpisode,
  ReplayTvSession,
} from '@/features/decision-replay-tv/types/replay-tv.types';

const EMPTY_CHECKLIST: ReplayTvChecklist = {
  namedInvalidation: false,
  notedRegime: false,
  consideredTimeBudget: false,
  wroteReasoning: false,
};

function sessionId(): string {
  return `rtv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createReplayTvSession(episodeId: string): ReplayTvSession {
  const episode = getReplayTvEpisode(episodeId);
  if (!episode) {
    throw new Error(`Unknown Replay TV episode: ${episodeId}`);
  }
  const fullCandles = buildEducationalCandles(episode);
  return {
    id: sessionId(),
    episodeId: episode.id,
    phase: 'intro',
    createdAt: Date.now(),
    fullCandles,
    checkpointIndex: 0,
    decisions: [],
    checklist: { ...EMPTY_CHECKLIST },
    revealed: false,
  };
}

export function getSessionEpisode(session: ReplayTvSession): ReplayTvEpisode {
  const episode = getReplayTvEpisode(session.episodeId);
  if (!episode) {
    throw new Error(`Episode missing for session ${session.id}`);
  }
  return episode;
}

export function getVisibleCandlesForSession(session: ReplayTvSession) {
  const episode = getSessionEpisode(session);
  if (session.revealed || session.phase === 'reveal' || session.phase === 'coaching' || session.phase === 'complete') {
    return session.fullCandles;
  }
  const checkpoint = episode.checkpoints[session.checkpointIndex] ?? episode.checkpoints[0];
  const freeze = checkpoint?.freezeIndex ?? Math.floor(session.fullCandles.length * 0.5);
  return visibleCandlesAt(session.fullCandles, freeze);
}

export function advanceReplayTvPhase(session: ReplayTvSession): ReplayTvSession {
  switch (session.phase) {
    case 'intro':
      return { ...session, phase: 'context' };
    case 'context':
      return { ...session, phase: 'watching' };
    case 'watching':
      return { ...session, phase: 'decision' };
    case 'mentor': {
      const episode = getSessionEpisode(session);
      const nextIndex = session.checkpointIndex + 1;
      if (nextIndex < episode.checkpoints.length) {
        return {
          ...session,
          checkpointIndex: nextIndex,
          phase: 'watching',
          mentorReply: undefined,
        };
      }
      return { ...session, phase: 'reveal', revealed: true, mentorReply: undefined };
    }
    case 'reveal': {
      const episode = getSessionEpisode(session);
      const scores = scoreReplayTvSession({
        episode,
        decisions: session.decisions,
        checklist: session.checklist,
      });
      return { ...session, phase: 'coaching', scores, revealed: true };
    }
    case 'coaching':
      return { ...session, phase: 'complete' };
    default:
      return session;
  }
}

export function submitReplayTvDecision(input: {
  session: ReplayTvSession;
  decision: ReplayTvDecision;
  reasoning: string;
}): ReplayTvSession {
  const { session, decision, reasoning } = input;
  if (session.phase !== 'decision') return session;

  const episode = getSessionEpisode(session);
  const checkpoint = episode.checkpoints[session.checkpointIndex];
  if (!checkpoint) return session;

  const wroteReasoning = reasoning.trim().length >= 12;
  const nextChecklist: ReplayTvChecklist = {
    ...session.checklist,
    wroteReasoning: session.checklist.wroteReasoning || wroteReasoning,
  };

  return {
    ...session,
    checklist: nextChecklist,
    decisions: [
      ...session.decisions,
      {
        checkpointId: checkpoint.id,
        decision,
        reasoning: reasoning.trim(),
        at: Date.now(),
      },
    ],
    phase: 'mentor',
    mentorReply: checkpoint.mentorFollowUp,
  };
}

export function patchReplayTvChecklist(
  session: ReplayTvSession,
  patch: Partial<ReplayTvChecklist>,
): ReplayTvSession {
  return {
    ...session,
    checklist: { ...session.checklist, ...patch },
  };
}

export const REPLAY_TV_DECISION_LABELS: Record<ReplayTvDecision, string> = {
  research_more: 'Research more',
  write_thesis: 'Write a thesis',
  wait: 'Wait',
  skip: 'Skip',
  protect_attention: 'Protect attention',
};
