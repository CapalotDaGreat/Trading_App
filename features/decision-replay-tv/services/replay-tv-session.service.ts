import { canRevealReplay, revealCursorAfterCommit } from '@/features/decision-replay/services/replay-lifecycle.service';
import { scanReplayInformationLeaks } from '@/features/decision-replay/services/replay-information-boundary.service';
import { replayPracticeDifficulty } from '@/features/decision-replay/services/replay-practice-difficulty.service';
import { REPLAY_TIMESTAMP_HONESTY } from '@/features/decision-replay/types/replay-scenario.types';
import { getReplayTvEpisode } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import {
  composeReplayTvCoachNote,
  composeReplayTvReasoning,
  emptyReplayTvReasoning,
  formatReplayTvCoachReply,
  reasoningHasSubstance,
} from '@/features/decision-replay-tv/services/replay-tv-coach.service';
import {
  chunkVisibleCandles,
  getEducationalCandles,
  visibleCandlesAt,
} from '@/features/decision-replay-tv/services/replay-tv-path.service';
import { scoreReplayTvSession } from '@/features/decision-replay-tv/services/replay-tv-score.service';
import { toReplayScenarioPackage } from '@/features/decision-replay-tv/services/replay-scenario.adapter';
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

const REVEALED_PHASES: ReplayTvPhase[] = ['reveal', 'coaching', 'complete', 'skill'];

export const REPLAY_TV_LOOP_STEPS: Array<{ phase: ReplayTvPhase; label: string }> = [
  { phase: 'intro', label: 'Episode' },
  { phase: 'context', label: 'Context' },
  { phase: 'watching', label: 'Chart' },
  { phase: 'research', label: 'Study' },
  { phase: 'reasoning', label: 'Thesis' },
  { phase: 'risk', label: 'Risk' },
  { phase: 'sizing', label: 'Size' },
  { phase: 'decision', label: 'Decision' },
  { phase: 'mentor', label: 'Next freeze' },
  { phase: 'reveal', label: 'Reveal' },
  { phase: 'coaching', label: 'Review' },
  { phase: 'complete', label: 'Reflection' },
  { phase: 'skill', label: 'Learn next' },
];

export function replayTvLoopLabel(phase: ReplayTvPhase): string {
  return REPLAY_TV_LOOP_STEPS.find((step) => step.phase === phase)?.label ?? phase;
}

export function composeReplayPhaseAnnouncement(session: ReplayTvSession): string {
  const label = replayTvLoopLabel(session.phase);
  if (!isReplayTvRevealed(session)) {
    return `${label}. Future market information stays hidden until you commit.`;
  }
  return `${label}. Historical path is visible for teaching review only. Scores remain process-only.`;
}

/** Persistence must never write future bars. Hydrate rebuilds them in memory. */
export function stripReplayTvSessionForPersist(
  session: ReplayTvSession | null,
): ReplayTvSession | null {
  if (!session) return null;
  return { ...session, fullCandles: [] };
}

export function rehydrateReplayTvSession(
  session: ReplayTvSession | null,
): ReplayTvSession | null {
  if (!session?.episodeId) return null;
  if (!getReplayTvEpisode(session.episodeId)) return null;
  try {
    const hydrated = hydrateReplayTvSessionCandles(session);
    return { ...hydrated, restoredFromPersist: true };
  } catch {
    return null;
  }
}

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
    const end = episode.revealWindowEndIndex ?? Math.max(0, session.fullCandles.length - 1);
    return Math.min(end, session.revealCursor ?? end);
  }
  const checkpoint = episode.checkpoints[session.checkpointIndex] ?? episode.checkpoints[0];
  return checkpoint?.freezeIndex ?? Math.floor(session.fullCandles.length * 0.5);
}

/**
 * Visible candles for chart UI — never returns future bars before reveal.
 * Chunked for render performance on long educational paths.
 */
export function getVisibleCandlesForSession(session: ReplayTvSession) {
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
  const freeze = currentFreezeIndex(session);
  if (isReplayTvRevealed(session)) {
    return episode.availableNews.filter((item) => item.availableAtIndex <= freeze);
  }
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
    historicalOutcome:
      revealed && (session.revealCursor ?? 0) >= (episode.revealWindowEndIndex ?? episode.barCount - 1)
        ? episode.historicalOutcome
        : null,
    teachingNotes: revealed
      ? episode.checkpoints
          .filter((item) => item.freezeIndex <= currentFreezeIndex(session))
          .map((c) => c.teachingNote)
      : [],
    informationLayers: {
      historical: {
        label: 'Historical information',
        newsCount: getVisibleNewsForSession(session).length,
        tapeBars: getVisibleCandlesForSession(session).length,
      },
      later: {
        label: 'Later information',
        hidden: !revealed,
      },
      educationalMetadata: {
        label: 'Educational metadata',
        provenanceNote: episode.provenanceNote,
        timestampHonesty: REPLAY_TIMESTAMP_HONESTY,
        practiceDifficulty: replayPracticeDifficulty(episode),
      },
    },
    timestampHonesty: REPLAY_TIMESTAMP_HONESTY,
  };
}

export function canRevealReplayTvSession(session: ReplayTvSession): boolean {
  const episode = getReplayTvEpisode(session.episodeId);
  if (!episode) return false;
  return canRevealReplay({
    committedDecisions: session.decisions.length,
    requiredDecisions: episode.checkpoints.length,
    alreadyRevealed: isReplayTvRevealed(session),
  });
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
  if (getVisibleNewsForSession(session).some((n) => n.availableAtIndex > freeze)) return true;

  const episode = getReplayTvEpisode(session.episodeId);
  if (!episode) return false;
  const scenario = toReplayScenarioPackage(episode);
  const cutoff = scenario.bars[Math.min(scenario.bars.length - 1, freeze)]?.timestamp ?? freezeTs;
  const leak = scanReplayInformationLeaks({
    scenario,
    cutoffTimestamp: cutoff,
    revealed: false,
    visibleBars: visible.map((bar) => ({
      timestamp: bar.timestamp,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    })),
    visibleNews: view.news.map((item) => ({
      id: item.id,
      timestamp: cutoff,
      availableAtTimestamp: scenario.news.find((n) => n.id === item.id)?.availableAtTimestamp ?? 0,
      headline: item.headline,
      summary: item.detail,
    })),
    publicBlob: JSON.stringify(view),
  });
  return !leak.ok;
}

export function advanceReplayTvPhase(session: ReplayTvSession): ReplayTvSession {
  switch (session.phase) {
    case 'intro':
      return { ...session, phase: 'context' };
    case 'context':
      return { ...session, phase: 'watching' };
    case 'watching':
      return { ...session, phase: 'research' };
    case 'research':
      return { ...session, phase: 'reasoning' };
    case 'reasoning':
      return { ...session, phase: 'risk' };
    case 'risk':
      return { ...session, phase: 'sizing' };
    case 'sizing':
      return { ...session, phase: 'decision' };
    case 'mentor': {
      const episode = getSessionEpisode(session);
      const committedAll = canRevealReplay({
        committedDecisions: session.decisions.length,
        requiredDecisions: episode.checkpoints.length,
      });
      if (committedAll) {
        const cutoff = episode.checkpoints[episode.checkpoints.length - 1]?.freezeIndex ?? 0;
        return {
          ...session,
          phase: 'reveal',
          revealed: true,
          mentorReply: undefined,
          revealCursor: revealCursorAfterCommit({
            cutoffIndex: cutoff,
            horizon: episode.barCount,
          }),
        };
      }
      return {
        ...session,
        phase: 'watching',
        mentorReply: undefined,
        lastCoach: undefined,
        draftReasoning: undefined,
      };
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
    case 'complete':
      return { ...session, phase: 'skill' };
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

  const isLastCheckpoint = session.checkpointIndex >= episode.checkpoints.length - 1;

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
        committedBlind: !isReplayTvRevealed(session),
      },
    ],
    checkpointIndex: isLastCheckpoint ? session.checkpointIndex : session.checkpointIndex + 1,
    phase: 'mentor',
    mentorReply: formatReplayTvCoachReply(coach),
    lastCoach: coach,
    draftReasoning: undefined,
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

export function patchReplayTvDraftReasoning(
  session: ReplayTvSession,
  draft: ReplayTvReasoning,
): ReplayTvSession {
  return { ...session, draftReasoning: draft };
}

/** Attach a post-reveal process reflection and rescore. Never uses later P/L. */
export function attachReplayTvReflection(session: ReplayTvSession, reflection: string): ReplayTvSession {
  const note = reflection.trim();
  if (!note || session.decisions.length === 0) {
    return { ...session, draftReasoning: { ...(session.draftReasoning ?? emptyReplayTvReasoning()), reflection: note } };
  }
  const last = session.decisions[session.decisions.length - 1]!;
  const structured = {
    ...emptyReplayTvReasoning(),
    ...last.structured,
    reflection: note,
  };
  const decisions = [...session.decisions.slice(0, -1), { ...last, structured }];
  const episode = getSessionEpisode(session);
  return {
    ...session,
    decisions,
    draftReasoning: { ...(session.draftReasoning ?? emptyReplayTvReasoning()), reflection: note },
    scores: scoreReplayTvSession({
      episode,
      decisions,
      checklist: session.checklist,
    }),
  };
}

/** Observe / Research / Stay out / Form hypothesis mapped onto process enum. */
export const REPLAY_TV_DECISION_LABELS: Record<ReplayTvDecision, string> = {
  no_trade: 'No trade',
  wait: 'Wait',
  enter: 'Enter (paper thesis)',
  reduce: 'Reduce exposure',
  exit: 'Exit / stand down',
  research_more: 'Research more',
  skip: 'Skip',
  write_thesis: 'Form a research thesis',
  protect_attention: 'Protect attention',
  mark_invalidation: 'Mark invalidation',
  review_other: 'Research another asset',
};

/** Default commit choices — doing nothing stays first-class. */
export const REPLAY_TV_PRIMARY_DECISIONS: ReplayTvDecision[] = [
  'no_trade',
  'wait',
  'enter',
  'reduce',
  'exit',
  'research_more',
];

export const REPLAY_TV_DECISION_ORDER: ReplayTvDecision[] = [
  ...REPLAY_TV_PRIMARY_DECISIONS,
  'skip',
  'write_thesis',
  'protect_attention',
  'mark_invalidation',
  'review_other',
];

export function advanceReplayTvReveal(session: ReplayTvSession, bars = 6): ReplayTvSession {
  if (!isReplayTvRevealed(session)) return session;
  if (session.decisions.length === 0) return session;
  const episode = getSessionEpisode(session);
  const end = episode.revealWindowEndIndex ?? episode.barCount - 1;
  const current = session.revealCursor ?? currentFreezeIndex(session);
  return { ...session, revealCursor: Math.min(end, current + bars) };
}

export function patchReplayTvAnnotations(
  session: ReplayTvSession,
  annotations: ReplayTvSession['annotations'],
): ReplayTvSession {
  return { ...session, annotations };
}
