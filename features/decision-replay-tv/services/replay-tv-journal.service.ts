import type {
  ReplayTvEpisode,
  ReplayTvJournalReflection,
  ReplayTvScores,
  ReplayTvSession,
} from '@/features/decision-replay-tv/types/replay-tv.types';
import { createJournalEntry } from '@/features/journal/services/journal.service';
import type { CreateJournalEntryInput, JournalEntry } from '@/features/journal/types/journal.types';

/**
 * Soft reflection payload for Journal — process notes only, never forced.
 */
export function buildReplayTvJournalReflection(input: {
  episode: ReplayTvEpisode;
  session: ReplayTvSession;
  scores: ReplayTvScores;
}): ReplayTvJournalReflection {
  const { episode, session, scores } = input;
  const body = [
    scores.journalPrompt,
    '',
    `Checkpoints completed: ${session.decisions.length}/${episode.checkpoints.length}.`,
    `Skills emphasis: ${episode.skills.join(', ')}.`,
    `Scoring focus: ${episode.scoringEmphasis.join(', ')}.`,
    session.checklist.namedInvalidation ? 'Named invalidation: yes.' : 'Named invalidation: incomplete.',
    '',
    ...scores.coaching.map((line) => `• ${line}`),
  ].join('\n');

  return {
    title: `Replay TV · ${episode.title}`,
    body,
    episodeId: episode.id,
    processScore: scores.processQuality,
    checkpointCount: session.decisions.length,
    skills: episode.skills,
  };
}

export function buildReplayTvJournalEntryInput(
  reflection: ReplayTvJournalReflection,
  episode: ReplayTvEpisode,
): CreateJournalEntryInput {
  return {
    symbol: episode.symbol,
    direction: 'long',
    entryPrice: 0,
    quantity: 0,
    outcome: 'breakeven',
    strategy: 'replay-tv-reflection',
    tags: [
      'replay-tv',
      'process-only',
      `episode:${episode.id}`,
      ...episode.skills.slice(0, 4).map((s) => `skill:${s}`),
    ],
    notes: reflection.body,
    lessonsLearned: `Process score ${reflection.processScore}/100 — graded on decision process, never path P&L.`,
    planAdhered: true,
    regimeNote: episode.eraLabel,
    improvementCommitment: episode.scoringEmphasis[0]
      ? `Practice ${episode.scoringEmphasis[0]} on the next blind pause.`
      : 'Name invalidation before deepening research.',
    linkedReplayHref: `/decision/replay-tv/${episode.id}`,
    linkedAcademyLessonIds: episode.academyLessonIds.slice(0, 2),
  };
}

export async function softSaveReplayTvReflection(input: {
  uid: string;
  episode: ReplayTvEpisode;
  session: ReplayTvSession;
  scores: ReplayTvScores;
}): Promise<{ reflection: ReplayTvJournalReflection; entry: JournalEntry }> {
  const reflection = buildReplayTvJournalReflection(input);
  const entry = await createJournalEntry(
    input.uid,
    buildReplayTvJournalEntryInput(reflection, input.episode),
  );
  return { reflection, entry };
}
