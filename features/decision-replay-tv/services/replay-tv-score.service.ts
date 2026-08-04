import { mapMistakeToLesson } from '@/features/academy/services/curriculum.service';

import type {
  ReplayTvChecklist,
  ReplayTvDecision,
  ReplayTvDecisionRecord,
  ReplayTvEpisode,
  ReplayTvScores,
} from '@/features/decision-replay-tv/types/replay-tv.types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function checklistScore(checklist: ReplayTvChecklist): number {
  const values = Object.values(checklist);
  return clamp((values.filter(Boolean).length / values.length) * 100);
}

function decisionProcessPts(decision: ReplayTvDecision): number {
  switch (decision) {
    case 'wait':
      return 88;
    case 'protect_attention':
      return 90;
    case 'skip':
      return 84;
    case 'research_more':
      return 72;
    case 'write_thesis':
      return 78;
    default:
      return 60;
  }
}

function reasoningPts(note: string): number {
  const length = note.trim().length;
  let score = 20;
  if (length >= 12) score += 25;
  if (length >= 40) score += 20;
  if (length >= 80) score += 10;
  if (/invalid|confirm|regime|risk|patience|skip|attention|time|thesis/i.test(note)) score += 15;
  return clamp(score);
}

/**
 * Process-only scoring for Decision Replay TV.
 * Historical path outcome never grades the user — no fake P&L.
 */
export function scoreReplayTvSession(input: {
  episode: ReplayTvEpisode;
  decisions: ReplayTvDecisionRecord[];
  checklist: ReplayTvChecklist;
}): ReplayTvScores {
  const checklistPts = checklistScore(input.checklist);
  const decisionAvg =
    input.decisions.length === 0
      ? 40
      : clamp(
          input.decisions.reduce((sum, d) => sum + decisionProcessPts(d.decision), 0) /
            input.decisions.length,
        );
  const reasoningAvg =
    input.decisions.length === 0
      ? 20
      : clamp(
          input.decisions.reduce((sum, d) => sum + reasoningPts(d.reasoning), 0) /
            input.decisions.length,
        );

  const patienceBoost = input.decisions.some(
    (d) => d.decision === 'wait' || d.decision === 'protect_attention' || d.decision === 'skip',
  )
    ? 12
    : 0;

  const patience = clamp(decisionAvg * 0.7 + patienceBoost + (input.checklist.consideredTimeBudget ? 10 : 0));
  const processQuality = clamp(
    checklistPts * 0.3 + decisionAvg * 0.35 + reasoningAvg * 0.25 + patience * 0.1,
  );
  const overall = clamp(
    processQuality * 0.45 + reasoningAvg * 0.3 + checklistPts * 0.15 + patience * 0.1,
  );

  const coaching: string[] = [
    'Scores measure process under a blind tape — never whether the historical path “paid.”',
    input.checklist.namedInvalidation
      ? 'You named invalidation — keep that habit in live research.'
      : 'Highest-leverage gap: name what would kill the idea before the next bar.',
  ];
  if (reasoningAvg < 55) {
    coaching.push('Write fuller reasoning notes so a mentor (or future you) can grade the process.');
  }
  if (patience >= 75) {
    coaching.push('Patience and attention protection showed up — that is a decision skill.');
  }

  const gapText = coaching.join(' ');
  const academy = mapMistakeToLesson(gapText);
  const lessonId =
    academy?.lesson.id ?? input.episode.academyLessonIds[0] ?? 'dec-invalidation';

  return {
    processQuality,
    reasoningQuality: reasoningAvg,
    checklistIntegrity: checklistPts,
    patience,
    overall,
    coaching,
    journalPrompt: [
      `Replay TV · ${input.episode.title}.`,
      `Process ${processQuality}/100 · reasoning ${reasoningAvg}/100.`,
      'What did you learn about your decision process — not the historical outcome?',
      input.decisions[0]?.reasoning?.trim()
        ? `First pause note: “${input.decisions[0].reasoning.trim().slice(0, 100)}”`
        : 'Add the invalidation you wish you had written at the first pause.',
    ].join(' '),
    academyHint: {
      lessonId,
      reason: academy?.reason ?? 'Practice the lesson that matches your process gap.',
    },
  };
}
