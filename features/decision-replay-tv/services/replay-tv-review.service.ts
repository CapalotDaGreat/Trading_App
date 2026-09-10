import { gradeReplayProcess } from '@/features/decision-replay/services/replay-process-grade.service';
import type {
  ReplayTvEpisode,
  ReplayTvScores,
  ReplayTvSession,
} from '@/features/decision-replay-tv/types/replay-tv.types';

export interface ReplayReviewDimension {
  id: 'outcome' | 'process' | 'risk' | 'evidence' | 'discipline';
  label: string;
  note: string;
  score?: number;
}

export interface ReplayCounterfactual {
  id: string;
  prompt: string;
  note: string;
}

export interface ReplayLearningLoop {
  lessonId: string;
  lessonHref: string;
  lessonLabel: string;
  practiceHref: string;
  practiceLabel: string;
  simulateHref: string;
  simulateLabel: string;
  reviewHref: string;
  reviewLabel: string;
}

export interface ReplayLabReview {
  dimensions: ReplayReviewDimension[];
  counterfactuals: ReplayCounterfactual[];
  loop: ReplayLearningLoop;
  reminder: string;
  knewThen: string;
  happenedAfter: string;
  outcomeNote: string;
}

function tone(score: number): string {
  if (score >= 70) return 'strong on this freeze';
  if (score >= 45) return 'mixed — the notes are there, but incomplete';
  return 'thin — this is the gap to practise';
}

export function buildReplayLearningLoop(episode: ReplayTvEpisode, scores?: ReplayTvScores): ReplayLearningLoop {
  const lessonId = scores?.academyHint?.lessonId ?? episode.academyLessonIds[0] ?? 'dec-invalidation';
  const breakout = episode.collectionIds.includes('false_breakouts') || episode.skills.includes('invalidation');
  const riskFocus = episode.collectionIds.includes('risk_management') || (scores?.riskAwareness ?? 100) < 55;
  return {
    lessonId,
    lessonHref: `/academy/lesson/${lessonId}`,
    lessonLabel: 'Related lesson',
    practiceHref: riskFocus
      ? '/practice?drill=position-size'
      : breakout
        ? '/practice?drill=breakout-quality'
        : '/practice?drill=rr-compare',
    practiceLabel: riskFocus ? 'Position-size exercise' : breakout ? 'Breakout confirmation exercise' : 'Risk/reward exercise',
    simulateHref: '/simulate',
    simulateLabel: 'Apply it in an uncertain simulation',
    reviewHref: '/review',
    reviewLabel: 'Journal the process',
  };
}

export function buildReplayLabReview(input: {
  episode: ReplayTvEpisode;
  session: ReplayTvSession;
  scores?: ReplayTvScores;
}): ReplayLabReview {
  const scores = input.scores ?? input.session.scores;
  const last = input.session.decisions[input.session.decisions.length - 1];
  const namedSize = Boolean(last?.structured?.intendedSize?.trim() || last?.structured?.expectedRisk?.trim());
  const namedRisk = Boolean(last?.structured?.riskAssessment?.trim());
  const namedMindChange = Boolean(last?.structured?.whatWouldChangeMind?.trim() || last?.structured?.invalidation?.trim());
  const grade = gradeReplayProcess({
    episode: input.episode,
    decisions: input.session.decisions,
    checklist: input.session.checklist,
    revealed: input.session.revealed,
  });

  return {
    reminder: grade.reminder,
    knewThen: scores?.knewThen ?? grade.knewThen,
    happenedAfter: scores?.happenedAfter ?? grade.happenedAfter,
    outcomeNote: scores?.outcomeNote ?? grade.outcomeNote,
    dimensions: [
      {
        id: 'outcome',
        label: 'Outcome',
        note: input.session.revealed
          ? 'The educational path after the cutoff is now visible. Treat it as history, not a grade.'
          : 'Outcome is still hidden. Decide from the cutoff only.',
      },
      {
        id: 'process',
        label: 'Process',
        score: scores?.processQuality,
        note: scores
          ? `Process ${scores.processQuality} — ${tone(scores.processQuality)}. Thesis and invalidation matter more than the later print.`
          : 'Process scores appear after you commit and reveal.',
      },
      {
        id: 'risk',
        label: 'Risk',
        score: scores?.riskAwareness,
        note: namedRisk
          ? 'You named how much uncertainty you were willing to carry.'
          : 'Risk was mostly implicit. Size and invalidation belong on the same card.',
      },
      {
        id: 'evidence',
        label: 'Evidence',
        score: scores?.evidenceQuality,
        note: scores
          ? `Evidence ${scores.evidenceQuality} — ${tone(scores.evidenceQuality)}.`
          : 'Cite only what was available at the freeze.',
      },
      {
        id: 'discipline',
        label: 'Discipline',
        score: scores?.checklistIntegrity,
        note: namedMindChange
          ? 'You wrote what would change your mind before the reveal.'
          : 'Define what would change your mind before the next bar.',
      },
    ],
    counterfactuals: [
      {
        id: 'half_size',
        prompt: 'What if you had used half the position size?',
        note: namedSize
          ? 'You already named a size. Halving it is a process check, not a better prediction.'
          : 'Without a named size, “enter” is a mood. Write the risk unit first.',
      },
      {
        id: 'wait_confirmation',
        prompt: 'What if you waited for confirmation?',
        note: last?.decision === 'wait' || last?.decision === 'no_trade'
          ? 'You already treated waiting as a first-class decision.'
          : 'The first print through a level is not confirmation. Waiting can be the strongest process.',
      },
      {
        id: 'earlier_invalidation',
        prompt: 'What if you had defined invalidation earlier?',
        note: namedMindChange
          ? 'Keep that sentence. The later path does not rewrite it.'
          : 'Invalidation written after the move is hindsight dressed as process.',
      },
    ],
    loop: buildReplayLearningLoop(input.episode, scores),
  };
}
