import type { ReplayPracticeDifficulty } from '@/features/decision-replay/types/replay-scenario.types';
import type { ReplayTvDifficulty, ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';

export const REPLAY_PRACTICE_DIFFICULTY_LABELS: Record<ReplayPracticeDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mixed: 'Unlabeled',
};

export function practiceDifficultyFromTv(difficulty: ReplayTvDifficulty): ReplayPracticeDifficulty {
  if (difficulty === 'foundation') return 'beginner';
  if (difficulty === 'intermediate') return 'intermediate';
  if (difficulty === 'advanced' || difficulty === 'expert') return 'advanced';
  return 'intermediate';
}

export function replayPracticeDifficulty(episode: Pick<ReplayTvEpisode, 'difficulty' | 'practiceDifficulty'>): ReplayPracticeDifficulty {
  return episode.practiceDifficulty ?? practiceDifficultyFromTv(episode.difficulty);
}

/** Advanced and mixed rooms must not advertise the competency being tested. */
export function replayConcealsCompetency(
  episode: Pick<ReplayTvEpisode, 'difficulty' | 'practiceDifficulty' | 'concealCompetency'>,
): boolean {
  if (episode.concealCompetency === true) return true;
  const level = replayPracticeDifficulty(episode);
  return level === 'advanced' || level === 'mixed';
}

/** Advanced and mixed rooms expect unaided reasoning from the tape. */
export function replayRequiresIndependentReasoning(
  episode: Pick<ReplayTvEpisode, 'difficulty' | 'practiceDifficulty' | 'concealCompetency'>,
): boolean {
  return replayConcealsCompetency(episode);
}
