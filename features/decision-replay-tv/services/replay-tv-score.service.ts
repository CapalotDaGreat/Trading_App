import { gradeReplayProcess } from '@/features/decision-replay/services/replay-process-grade.service';
import { mapMistakeToLesson } from '@/features/academy/services/curriculum.service';
import { resolveAcademyLessonForTrait } from '@/features/decision/services/decision-reinforcement-academy.service';
import type { ReinforcementTraitId } from '@/features/decision/types/decision-reinforcement.types';
import { composeReplayTvProcessComparison } from '@/features/decision-replay-tv/services/replay-tv-coach.service';

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
    case 'no_trade':
      return 88;
    case 'reduce':
      return 84;
    case 'exit':
      return 80;
    case 'enter':
      return 70;
    case 'protect_attention':
      return 90;
    case 'skip':
      return 84;
    case 'review_other':
      return 82;
    case 'mark_invalidation':
      return 86;
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
  if (/invalid|confirm|regime|risk|patience|skip|attention|time|thesis|evidence|alternative/i.test(note)) {
    score += 15;
  }
  return clamp(score);
}

function evidencePts(decisions: ReplayTvDecisionRecord[], checklist: ReplayTvChecklist): number {
  const notes = decisions.map((d) => d.reasoning).join(' ');
  let score = checklist.wroteReasoning ? 55 : 30;
  if (/evidence|because|structure|level|headline|print|data/i.test(notes)) score += 20;
  if (notes.trim().length >= 40) score += 15;
  if (checklist.notedRegime) score += 10;
  return clamp(score);
}

function riskPts(decisions: ReplayTvDecisionRecord[], checklist: ReplayTvChecklist): number {
  const notes = decisions.map((d) => d.reasoning).join(' ');
  let score = 35;
  if (/risk|downside|size|liquidity|gap|counterparty|contain/i.test(notes)) score += 25;
  if (
    decisions.some(
      (d) => d.decision === 'protect_attention' || d.decision === 'skip' || d.decision === 'wait',
    )
  ) {
    score += 20;
  }
  if (checklist.consideredTimeBudget) score += 10;
  return clamp(score);
}

function invalidationPts(decisions: ReplayTvDecisionRecord[], checklist: ReplayTvChecklist): number {
  const notes = decisions.map((d) => d.reasoning).join(' ');
  let score = checklist.namedInvalidation ? 70 : 25;
  if (/invalid|thesis.?kill|stop|prove.+wrong|would change/i.test(notes)) score += 25;
  return clamp(score);
}

function alternativePts(decisions: ReplayTvDecisionRecord[], checklist: ReplayTvChecklist): number {
  const notes = decisions.map((d) => d.reasoning).join(' ');
  let score = checklist.consideredAlternative ? 70 : 30;
  if (/instead|alternative|or skip|could also|vs\.|versus/i.test(notes)) score += 20;
  if (decisions.some((d) => d.decision === 'skip' || d.decision === 'wait' || d.decision === 'review_other')) {
    score += 10;
  }
  return clamp(score);
}

function adaptabilityPts(decisions: ReplayTvDecisionRecord[]): number {
  if (decisions.length < 2) {
    return decisions.some((d) => d.decision === 'wait' || d.decision === 'skip') ? 70 : 55;
  }
  const unique = new Set(decisions.map((d) => d.decision));
  const switched = unique.size > 1;
  return clamp(switched ? 78 : 62);
}

function consistencyPts(decisions: ReplayTvDecisionRecord[], checklist: ReplayTvChecklist): number {
  if (!decisions.length) return 40;
  const structuredCount = decisions.filter((d) => d.structured?.thesis && d.structured?.evidence).length;
  const invalidationCount = decisions.filter(
    (d) => d.decision === 'mark_invalidation' || Boolean(d.structured?.invalidation?.trim()),
  ).length;
  return clamp(
    35 +
      (checklist.wroteReasoning ? 15 : 0) +
      (structuredCount / decisions.length) * 30 +
      (invalidationCount / decisions.length) * 20,
  );
}

function researchEfficiencyPts(
  decisions: ReplayTvDecisionRecord[],
  episode: ReplayTvEpisode,
): number {
  const inaction = decisions.filter(
    (d) =>
      d.decision === 'wait' ||
      d.decision === 'no_trade' ||
      d.decision === 'skip' ||
      d.decision === 'protect_attention' ||
      d.decision === 'reduce' ||
      d.decision === 'review_other',
  ).length;
  const research = decisions.filter((d) => d.decision === 'research_more').length;
  let score = 50 + inaction * 12 - research * 6;
  if (episode.inactionIsValidProcess && inaction > 0) score += 15;
  return clamp(score);
}

/**
 * Process-only scoring for Decision Replay TV.
 * Historical path outcome / direction never grades the user — no fake P&L.
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

  const evidenceQuality = evidencePts(input.decisions, input.checklist);
  const riskAwareness = riskPts(input.decisions, input.checklist);
  const invalidationClarity = invalidationPts(input.decisions, input.checklist);
  const alternativeConsideration = alternativePts(input.decisions, input.checklist);
  const adaptability = adaptabilityPts(input.decisions);
  const consistency = consistencyPts(input.decisions, input.checklist);
  const researchEfficiency = researchEfficiencyPts(input.decisions, input.episode);

  const patienceBoost = input.decisions.some(
    (d) =>
      d.decision === 'wait' ||
      d.decision === 'no_trade' ||
      d.decision === 'protect_attention' ||
      d.decision === 'skip',
  )
    ? 12
    : 0;

  const patience = clamp(
    decisionAvg * 0.7 + patienceBoost + (input.checklist.consideredTimeBudget ? 10 : 0),
  );

  const emphasisBoost = input.episode.scoringEmphasis.reduce((sum, key) => {
    switch (key) {
      case 'evidence':
        return sum + evidenceQuality * 0.02;
      case 'risk':
        return sum + riskAwareness * 0.02;
      case 'invalidation':
        return sum + invalidationClarity * 0.02;
      case 'alternatives':
        return sum + alternativeConsideration * 0.02;
      case 'patience':
        return sum + patience * 0.02;
      default:
        return sum;
    }
  }, 0);

  const processQuality = clamp(
    checklistPts * 0.22 +
      decisionAvg * 0.22 +
      reasoningAvg * 0.18 +
      patience * 0.1 +
      evidenceQuality * 0.08 +
      riskAwareness * 0.08 +
      invalidationClarity * 0.08 +
      alternativeConsideration * 0.04 +
      emphasisBoost,
  );

  const overall = clamp(
    processQuality * 0.34 +
      reasoningAvg * 0.12 +
      checklistPts * 0.08 +
      patience * 0.1 +
      evidenceQuality * 0.1 +
      invalidationClarity * 0.1 +
      adaptability * 0.06 +
      consistency * 0.05 +
      researchEfficiency * 0.05,
  );

  const coaching: string[] = [
    'Scores measure process under a blind tape — never whether the historical path “paid.”',
    'A later move on the educational tape does not prove the decision was high quality, and a later fade does not prove it was poor.',
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
  if (evidenceQuality < 55) {
    coaching.push('Cite the evidence you are using — structure, headlines available at the freeze, or regime cues.');
  }
  if (alternativeConsideration < 55) {
    coaching.push('Name at least one alternative process path (skip, wait, or a different research question).');
  }

  const dimensions: Array<{ label: string; value: number }> = [
    { label: 'invalidation', value: invalidationClarity },
    { label: 'evidence gathering', value: evidenceQuality },
    { label: 'patience', value: patience },
    { label: 'adaptability', value: adaptability },
    { label: 'consistency', value: consistency },
    { label: 'research efficiency', value: researchEfficiency },
  ];
  const weakest = [...dimensions].sort((a, b) => a.value - b.value)[0]!;

  const processComparison = composeReplayTvProcessComparison({
    episode: input.episode,
    decisions: input.decisions,
    checklist: input.checklist,
    weakestSkillLabel: weakest.label,
  });
  coaching.push(processComparison.practiceNext);

  const processGrade = gradeReplayProcess({
    episode: input.episode,
    decisions: input.decisions,
    checklist: input.checklist,
    revealed: true,
  });
  coaching.push(processGrade.outcomeNote);
  coaching.push(processGrade.reminder);

  const gapText = coaching.join(' ');
  const weakestToTrait: Record<string, ReinforcementTraitId> = {
    invalidation: 'invalidationDiscipline',
    'evidence gathering': 'evidenceDiscipline',
    patience: 'patience',
    adaptability: 'adaptability',
    'research efficiency': 'researchEfficiency',
  };
  const mappedTrait = weakestToTrait[weakest.label];
  const mappedLesson = mappedTrait ? resolveAcademyLessonForTrait(mappedTrait) : null;
  const academy = mappedLesson
    ? { lesson: mappedLesson, reason: `Existing Academy lesson for ${weakest.label}.` }
    : mapMistakeToLesson(`${gapText} ${weakest.label}`);
  const lessonId =
    academy?.lesson.id ?? input.episode.academyLessonIds[0] ?? 'dec-invalidation';

  return {
    processQuality,
    reasoningQuality: reasoningAvg,
    checklistIntegrity: checklistPts,
    patience,
    evidenceQuality,
    riskAwareness,
    invalidationClarity,
    alternativeConsideration,
    adaptability,
    consistency,
    researchEfficiency,
    thesisQuality: processGrade.thesisQuality,
    uncertaintyRecognition: processGrade.uncertainty,
    hindsightHygiene: processGrade.hindsightHygiene,
    overall,
    coaching,
    journalPrompt: [
      `Replay TV · ${input.episode.title}.`,
      `DQS ${overall}/100 · process ${processQuality} · evidence ${evidenceQuality} · invalidation ${invalidationClarity}.`,
      'What did you learn about your decision process — not the historical outcome?',
    ].join(' '),
    academyHint: {
      lessonId,
      reason: academy?.reason ?? 'Practice the lesson that matches your process gap.',
    },
    processComparison,
    knewThen: processGrade.knewThen,
    happenedAfter: processGrade.happenedAfter,
    outcomeNote: processGrade.outcomeNote,
  };
}
