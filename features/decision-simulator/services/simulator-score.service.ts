import { mapMistakeToLesson } from '@/features/academy/services/curriculum.service';
import { analyzeChart } from '@/features/charts/services/chart-analysis.service';

import type {
  SimulatorAction,
  SimulatorChecklist,
  SimulatorScores,
  SimulatorSession,
} from '../types/simulator.types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function checklistScore(checklist: SimulatorChecklist): number {
  const values = Object.values(checklist);
  return clamp((values.filter(Boolean).length / values.length) * 100);
}

function disciplineForAction(
  action: SimulatorAction,
  freezeBias: 'bullish' | 'bearish' | 'neutral',
  evidenceQuality: number,
): number {
  // Process heuristics — never outcome/profit based.
  if (action === 'create_thesis') {
    return evidenceQuality >= 55 ? 88 : 62;
  }
  if (action === 'research') {
    return evidenceQuality >= 50 ? 78 : 48;
  }
  if (action === 'wait') {
    return freezeBias === 'neutral' || evidenceQuality < 55 ? 90 : 70;
  }
  // ignore
  return evidenceQuality < 45 || freezeBias === 'neutral' ? 86 : 55;
}

function riskScore(action: SimulatorAction, checklist: SimulatorChecklist): number {
  let score = 40;
  if (checklist.setInvalidationThought) score += 25;
  if (checklist.notedRegime) score += 15;
  if (checklist.consideredPortfolio) score += 10;
  if (action === 'ignore' || action === 'wait') score += 10;
  if (action === 'research' && !checklist.setInvalidationThought) score -= 15;
  return clamp(score);
}

function reasoningScore(note: string | undefined, checklist: SimulatorChecklist): number {
  const length = note?.trim().length ?? 0;
  let score = 25;
  if (length >= 12) score += 25;
  if (length >= 40) score += 20;
  if (checklist.setInvalidationThought) score += 15;
  if (checklist.reviewedIndicators) score += 10;
  if (/invalid|confirm|regime|risk|patience|skip/i.test(note ?? '')) score += 10;
  return clamp(score);
}

function decisionQualityScore(
  checklist: number,
  discipline: number,
  reasoning: number,
  risk: number,
): number {
  return clamp(checklist * 0.25 + discipline * 0.25 + reasoning * 0.25 + risk * 0.25);
}

/**
 * Score the simulator decision on process quality only.
 * Future candle path is used for learning narrative — never for profit scoring.
 */
export function scoreSimulatorDecision(input: {
  session: SimulatorSession;
  action: SimulatorAction;
  reasoningNote?: string;
  checklist?: SimulatorChecklist;
}): SimulatorScores {
  const checklist = input.checklist ?? input.session.checklist;
  const freezeAnalysis = analyzeChart(input.session.visibleCandles);
  const revealAnalysis =
    input.session.fullCandles.length >= 20
      ? analyzeChart(input.session.fullCandles)
      : freezeAnalysis;

  const freezeBias = freezeAnalysis.summary.overallBias;
  const revealBias = revealAnalysis.summary.overallBias;
  const evidenceQuality = clamp(freezeAnalysis.summary.confidence * 100);

  const checklistPts = checklistScore(checklist);
  const discipline = disciplineForAction(input.action, freezeBias, evidenceQuality);
  const risk = riskScore(input.action, checklist);
  const reasoning = reasoningScore(input.reasoningNote, checklist);
  const dqs = decisionQualityScore(checklistPts, discipline, reasoning, risk);
  const processScore = clamp(
    dqs * 0.35 + checklistPts * 0.2 + discipline * 0.2 + risk * 0.15 + reasoning * 0.1,
  );

  const futureCount = input.session.futureCandles.length;
  const lastVisible = input.session.visibleCandles[input.session.visibleCandles.length - 1];
  const lastFuture =
    input.session.futureCandles[input.session.futureCandles.length - 1] ?? lastVisible;
  const pathMove =
    lastVisible && lastFuture
      ? ((lastFuture.close - lastVisible.close) / lastVisible.close) * 100
      : 0;

  const whatHappened = `After your decision, ${futureCount} bars unfolded. Structure bias moved from ${freezeBias} toward ${revealBias}. Path change was ${pathMove >= 0 ? '+' : ''}${pathMove.toFixed(2)}% — used only as context, never as a grade.`;

  const whyItMatters =
    input.action === 'wait'
      ? 'Waiting is a decision. Scoring rewards patience when evidence is mixed — not whether price later rose or fell.'
      : input.action === 'ignore'
        ? 'Ignoring protects attention. Quality is judged by whether the skip matched incomplete evidence — not P&L.'
        : input.action === 'create_thesis'
          ? 'Creating a thesis trains structured reasoning before any live risk.'
          : 'Research is scored on checklist discipline and invalidation thought — not on being “right” about direction.';

  const aiNoticed: string[] = [
    `Freeze window: ${freezeAnalysis.summary.trend}; RSI ${freezeAnalysis.summary.rsiSignal}; MACD ${freezeAnalysis.summary.macdSignal}`,
    `Reveal window: ${revealAnalysis.summary.trend}; bias ${revealBias}`,
    `You chose “${input.action.replace('_', ' ')}” with evidence quality ${evidenceQuality}/100`,
  ];
  if (input.session.context.newsHeadlines[0]) {
    aiNoticed.push(`Headline in brief: “${input.session.context.newsHeadlines[0].title}”`);
  }
  if (input.session.context.memoryNote) {
    aiNoticed.push(input.session.context.memoryNote);
  }

  const whatWasMissed: string[] = [];
  if (!checklist.reviewedIndicators) whatWasMissed.push('Indicator review was not checked off.');
  if (!checklist.notedRegime) whatWasMissed.push('Regime was not explicitly noted.');
  if (!checklist.consideredPortfolio) whatWasMissed.push('Portfolio overlap was not considered.');
  if (!checklist.setInvalidationThought) {
    whatWasMissed.push('No invalidation thought — the highest-leverage process gap.');
  }
  if ((input.reasoningNote?.trim().length ?? 0) < 12) {
    whatWasMissed.push('Reasoning note was thin — write what would confirm or kill the idea.');
  }
  if (whatWasMissed.length === 0) {
    whatWasMissed.push('No major checklist gaps — keep this process cadence.');
  }

  const mistakeText = whatWasMissed.join(' ');
  const academy = mapMistakeToLesson(mistakeText);

  const learningSummary =
    processScore >= 75
      ? 'Strong process loop under uncertainty. Carry this checklist into live research.'
      : `Process gaps to train next: ${whatWasMissed[0]}`;

  const journalPrompt = [
    `Simulator ${input.session.symbol} · chose ${input.action.replace('_', ' ')}.`,
    `Freeze bias ${freezeBias} → reveal ${revealBias}.`,
    'What did you learn about your process — not the path move?',
    input.reasoningNote?.trim()
      ? `Your note: “${input.reasoningNote.trim().slice(0, 120)}”`
      : 'Add the invalidation you wish you had written.',
  ].join(' ');

  return {
    decisionQualityScore: dqs,
    checklistScore: checklistPts,
    riskScore: risk,
    disciplineScore: discipline,
    reasoningScore: reasoning,
    processScore,
    whatHappened,
    whyItMatters,
    aiNoticed,
    whatWasMissed,
    learningSummary,
    journalPrompt,
    academyHint: academy
      ? {
          lessonId: academy.lesson.id,
          title: academy.lesson.title,
          reason: academy.reason,
        }
      : undefined,
    replayHref: '/decision/decision-replay?segment=chart',
  };
}
