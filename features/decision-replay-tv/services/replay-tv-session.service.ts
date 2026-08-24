import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import {
  composeReplayTvCoachNote,
  composeReplayTvReasoning,
  formatReplayTvCoachReply,
  reasoningHasSubstance,
} from '@/features/decision-replay-tv/services/replay-tv-coach.service';
import {
  chunkVisibleCandles,
  getEducationalCandles,
  visibleCandlesAt,
} from '@/features/decision-replay-tv/services/replay-tv-path.service';
import { scoreReplayTvSession } from '@/features/decision-replay-tv/services/replay-tv-score.service';
import type {
  ReplayTvChecklist,
  ReplayTvDecision,
  ReplayTvEpisode,
  ReplayTvNewsItem,
  ReplayTvPhase,
  ReplayTvReasoning,
  ReplayTvSession,
} from '@/features/decision-replay-tv/types/replay-tv.types';

export const EMPTY_CHECKLIST: ReplayTvChecklist = {
  namedInvalidation: false,
  notedRegime: false,
  consideredTimeBudget: false,
  wroteReasoning: false,
  consideredAlternative: false,
};

const REVEALED_PHASES: ReplayTvPhase[] = ['reveal', 'coaching', 'complete'];

function sessionId(): string {
  return `rtv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isReplayTvRevealed(session: ReplayTvSession): boolean {
  return session.revealed || REVEALED_PHASES.includes(session.phase);
}

export function createReplayTvSession(episodeId: string): ReplayTvSession {
  const episode = getReplayTvEpisode(episodeId);
  if (!episode) {
    throw new Error(`Unknown Replay TV episode: ${episodeId}`);
  }
  const fullCandles = getEducationalCandles(episode);
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

/** Rebuild candle path after resume from persistence (candles stripped on save). */
export function hydrateReplayTvSessionCandles(session: ReplayTvSession): ReplayTvSession {
  const episode = getReplayTvEpisode(session.episodeId);
  if (!episode) return session;
  return {
    ...session,
    fullCandles: getEducationalCandles(episode),
  };
}

export function getSessionEpisode(session: ReplayTvSession): ReplayTvEpisode {
  const episode = getReplayTvEpisode(session.episodeId);
  if (!episode) {
    throw new Error(`Episode missing for session ${session.id}`);
  }
  return episode;
}

function currentFreezeIndex(session: ReplayTvSession): number {
  const episode = getSessionEpisode(session);
  if (isReplayTvRevealed(session)) {
    return Math.max(0, session.fullCandles.length - 1);
  }
  const checkpoint = episode.checkpoints[session.checkpointIndex] ?? episode.checkpoints[0];
  return checkpoint?.freezeIndex ?? Math.floor(session.fullCandles.length * 0.5);
}

/**
 * Visible candles for chart UI — never returns future bars before reveal.
 * Chunked for render performance on long educational paths.
 */
export function getVisibleCandlesForSession(session: ReplayTvSession) {
  if (isReplayTvRevealed(session)) {
    return session.fullCandles;
  }
  return chunkVisibleCandles(session.fullCandles, currentFreezeIndex(session));
}

/** Strict freeze slice (uncapped) for blindness tests. */
export function getFrozenCandlesForSession(session: ReplayTvSession) {
  if (isReplayTvRevealed(session)) {
    return session.fullCandles;
  }
  return visibleCandlesAt(session.fullCandles, currentFreezeIndex(session));
}

export function getVisibleNewsForSession(session: ReplayTvSession): ReplayTvNewsItem[] {
  const episode = getSessionEpisode(session);
  if (isReplayTvRevealed(session)) {
    return episode.availableNews;
  }
  const freeze = currentFreezeIndex(session);
  const checkpoint = episode.checkpoints[session.checkpointIndex];
  const byTime = episode.availableNews.filter((n) => n.availableAtIndex <= freeze);
  if (checkpoint?.newsIdsVisible?.length) {
    const allowed = new Set(checkpoint.newsIdsVisible);
    return byTime.filter((n) => allowed.has(n.id));
  }
  return byTime;
}

/** Spoiler-safe fields for pre-reveal UI — never embeds historicalOutcome. */
export function getBlindSafeEpisodeView(session: ReplayTvSession) {
  const episode = getSessionEpisode(session);
  const revealed = isReplayTvRevealed(session);
  return {
    title: episode.title,
    subtitle: episode.subtitle,
    teaser: episode.teaser,
    eraLabel: episode.eraLabel,
    contextBullets: episode.contextBullets,
    provenanceNote: episode.provenanceNote,
    dataKind: episode.dataKind,
    news: getVisibleNewsForSession(session),
    historicalOutcome: revealed ? episode.historicalOutcome : null,
    teachingNotes: revealed ? episode.checkpoints.map((c) => c.teachingNote) : [],
  };
}

export function replayTvHasFutureLeak(session: ReplayTvSession): boolean {
  if (isReplayTvRevealed(session)) return false;
  const frozen = getFrozenCandlesForSession(session);
  const visible = getVisibleCandlesForSession(session);
  const freezeTs = frozen[frozen.length - 1]?.timestamp ?? 0;
  if (visible.some((c) => c.timestamp > freezeTs)) return true;
  const view = getBlindSafeEpisodeView(session);
  if (view.historicalOutcome) return true;
  if (view.teachingNotes.length > 0) return true;
  const freeze = currentFreezeIndex(session);
  return getVisibleNewsForSession(session).some((n) => n.availableAtIndex > freeze);
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
          lastCoach: undefined,
        };
      }
      return { ...session, phase: 'reveal', revealed: true, mentorReply: undefined, lastCoach: undefined };
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
  structured?: ReplayTvReasoning;
}): ReplayTvSession {
  const { session, decision, structured } = input;
  if (session.phase !== 'decision') return session;

  const episode = getSessionEpisode(session);
  const checkpoint = episode.checkpoints[session.checkpointIndex];
  if (!checkpoint) return session;

  const composed = structured ? composeReplayTvReasoning(structured) : input.reasoning;
  const wroteReasoning = reasoningHasSubstance(structured, composed);
  const nextChecklist: ReplayTvChecklist = {
    ...session.checklist,
    wroteReasoning: session.checklist.wroteReasoning || wroteReasoning,
    namedInvalidation:
      session.checklist.namedInvalidation ||
      decision === 'mark_invalidation' ||
      Boolean(structured?.invalidation.trim()),
  };

  const previous = session.decisions[session.decisions.length - 1] ?? null;
  const coach = composeReplayTvCoachNote({
    episode,
    checkpointPrompt: checkpoint.prompt,
    mentorFollowUp: checkpoint.mentorFollowUp,
    decision,
    structured,
    fallbackReasoning: composed,
    checklist: nextChecklist,
    previous,
  });

  return {
    ...session,
    checklist: nextChecklist,
    decisions: [
      ...session.decisions,
      {
        checkpointId: checkpoint.id,
        decision,
        reasoning: composed.trim(),
        structured,
        coach,
        at: Date.now(),
      },
    ],
    phase: 'mentor',
    mentorReply: formatReplayTvCoachReply(coach),
    lastCoach: coach,
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

/** Observe / Research / Stay out / Form hypothesis mapped onto process enum. */
export const REPLAY_TV_DECISION_LABELS: Record<ReplayTvDecision, string> = {
  wait: 'Wait for more evidence',
  research_more: 'Continue researching',
  skip: 'Skip',
  write_thesis: 'Form a research thesis',
  protect_attention: 'Protect attention',
  mark_invalidation: 'Mark invalidation',
  review_other: 'Review another asset',
};

export const REPLAY_TV_DECISION_ORDER: ReplayTvDecision[] = [
  'research_more',
  'wait',
  'mark_invalidation',
  'skip',
  'review_other',
  'write_thesis',
  'protect_attention',
];
