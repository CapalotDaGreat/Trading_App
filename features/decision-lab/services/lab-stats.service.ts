import type {
  LabChallenge,
  LabPosition,
  LabStats,
} from '../types/lab.types';

export const LAB_CHALLENGE_DEFS: Omit<LabChallenge, 'progress' | 'completed'>[] = [
  {
    id: 'stops-five',
    title: 'Honor the stop',
    description: 'Complete five Lab closes without violating your stop.',
    targetCount: 5,
    celebrateCopy: 'Five stops honored — that is elite discipline.',
  },
  {
    id: 'confirm-three',
    title: 'Wait for confirmation',
    description: 'Open three Lab trades only after a full checklist (all 9).',
    targetCount: 3,
    celebrateCopy: 'You waited for confirmation three times — process over FOMO.',
  },
  {
    id: 'rr-two',
    title: 'R:R above 2:1',
    description: 'Close three Lab trades that started with Risk/Reward ≥ 2:1.',
    targetCount: 3,
    celebrateCopy: 'You protected expectancy with structure, not hope.',
  },
  {
    id: 'trend-only',
    title: 'Trend-only practice',
    description: 'Complete three trend-following scenario Lab trades.',
    targetCount: 3,
    celebrateCopy: 'You stayed inside a defined market playbook.',
  },
];

export function evaluateChallenges(positions: LabPosition[]): LabChallenge[] {
  const closed = positions.filter((p) => p.status === 'closed');

  return LAB_CHALLENGE_DEFS.map((def) => {
    let progress = 0;
    if (def.id === 'stops-five') {
      progress = closed.filter((p) => p.stopHonored).length;
    } else if (def.id === 'confirm-three') {
      progress = positions.filter(
        (p) => Object.values(p.thesis.checklist).every(Boolean),
      ).length;
    } else if (def.id === 'rr-two') {
      progress = closed.filter((p) => p.thesis.riskReward >= 2).length;
    } else if (def.id === 'trend-only') {
      progress = closed.filter((p) => p.thesis.scenarioId === 'trend_following').length;
    }
    progress = Math.min(def.targetCount, progress);
    return {
      ...def,
      progress,
      completed: progress >= def.targetCount,
    };
  });
}

export function buildLabStats(positions: LabPosition[]): LabStats {
  const closed = positions.filter((p) => p.status === 'closed' && p.scores);
  if (!closed.length) {
    return {
      tradesClosed: 0,
      avgProcessScore: 0,
      avgDisciplineScore: 0,
      avgRiskScore: 0,
      avgChecklistScore: 0,
      ruleAdherencePercent: 0,
      avgRiskReward: 0,
      winRate: 0,
      commonMistakes: ['No closed Lab trades yet — open a thesis-first practice trade.'],
      improvementNote: 'Log three Lab closes to unlock improvement trends.',
      simulatedPnlNote: 'Simulated P&L is educational context only — not the success metric.',
    };
  }

  const avg = (fn: (p: LabPosition) => number) =>
    Math.round(closed.reduce((s, p) => s + fn(p), 0) / closed.length);

  const honored = closed.filter((p) => p.stopHonored).length;
  const wins = closed.filter((p) => {
    const exit = p.exitPrice ?? p.markPrice;
    if (p.thesis.bias === 'long') return exit > p.entryPrice;
    return exit < p.entryPrice;
  }).length;

  const mistakes: string[] = [];
  const stopFails = closed.filter((p) => !p.stopHonored).length;
  const thinRr = closed.filter((p) => p.thesis.riskReward < 2).length;
  const noJournal = closed.filter(
    (p) => p.scores && p.scores.disciplineScore < 50,
  ).length;
  if (stopFails >= 2) mistakes.push('Stops violated more than once');
  if (thinRr >= 2) mistakes.push('Accepting R:R below 2:1');
  if (noJournal >= 2) mistakes.push('Weak journal follow-through after closes');
  if (!mistakes.length) mistakes.push('None dominant — keep the discipline streak');

  const recent = closed.slice(0, 3);
  const older = closed.slice(3, 6);
  const recentAvg = recent.length
    ? recent.reduce((s, p) => s + (p.scores?.processScore ?? 0), 0) / recent.length
    : 0;
  const olderAvg = older.length
    ? older.reduce((s, p) => s + (p.scores?.processScore ?? 0), 0) / older.length
    : recentAvg;
  const improvementNote =
    recentAvg >= olderAvg + 5
      ? 'Process score trending up on recent Lab closes — keep the loop.'
      : recentAvg + 5 <= olderAvg
        ? 'Recent process scores dipped — slow down and reopen the checklist.'
        : 'Process scores are stable — raise the bar with R:R ≥ 2 challenges.';

  return {
    tradesClosed: closed.length,
    avgProcessScore: avg((p) => p.scores!.processScore),
    avgDisciplineScore: avg((p) => p.scores!.disciplineScore),
    avgRiskScore: avg((p) => p.scores!.riskScore),
    avgChecklistScore: avg((p) => p.scores!.checklistScore),
    ruleAdherencePercent: Math.round((honored / closed.length) * 100),
    avgRiskReward:
      Math.round(
        (closed.reduce((s, p) => s + p.thesis.riskReward, 0) / closed.length) * 100,
      ) / 100,
    winRate: Math.round((wins / closed.length) * 100),
    commonMistakes: mistakes,
    improvementNote,
    simulatedPnlNote:
      'Win rate and simulated P&L are secondary. Celebrate rule adherence and process score.',
  };
}
