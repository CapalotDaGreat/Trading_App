import type {
  PassportAchievement,
  PassportAchievementId,
  PassportCounts,
} from '../types/passport.types';

interface AchievementDef {
  id: PassportAchievementId;
  title: string;
  detail: string;
  category: PassportAchievement['category'];
  target: number;
  celebrateCopy: string;
  progressOf: (counts: PassportCounts, extras: { streakDays: number; consistency: number }) => number;
}

const DEFS: AchievementDef[] = [
  {
    id: 'journals_100',
    title: '100 Journals',
    detail: 'Close the learning loop one hundred times.',
    category: 'journal',
    target: 100,
    celebrateCopy: 'Journal cadence is a process edge — never a P&L trophy.',
    progressOf: (c) => c.journals,
  },
  {
    id: 'replays_50',
    title: '50 Replay Sessions',
    detail: 'Revisit decisions without peeking at the future.',
    category: 'replay',
    target: 50,
    celebrateCopy: 'Replay builds pattern recognition for process — not prediction.',
    progressOf: (c) => c.replays,
  },
  {
    id: 'disciplined_20',
    title: '20 Disciplined Passes',
    detail: 'Skip or ignore low-conviction ideas twenty times.',
    category: 'discipline',
    target: 20,
    celebrateCopy: 'Passing is a decision. Attention is capital.',
    progressOf: (c) => c.disciplinedActions,
  },
  {
    id: 'academy_100',
    title: '100 Academy Lessons',
    detail: 'Read or complete one hundred lessons.',
    category: 'academy',
    target: 100,
    celebrateCopy: 'Learning compound interest — practice still required.',
    progressOf: (c) => c.academyLessonsCompleted,
  },
  {
    id: 'checklist_streak_7',
    title: 'Perfect Checklist Streak',
    detail: 'Seven-day discipline streak with checklist integrity.',
    category: 'discipline',
    target: 7,
    celebrateCopy: 'Ritual beats inspiration. Keep the streak honest.',
    progressOf: (_c, extras) => extras.streakDays,
  },
  {
    id: 'patience_25',
    title: 'Patience Milestone',
    detail: 'Twenty-five wait / ignore / skip outcomes logged.',
    category: 'patience',
    target: 25,
    celebrateCopy: 'Patience protects the research budget.',
    progressOf: (c) => c.patienceActions,
  },
  {
    id: 'risk_manager_10',
    title: 'Risk Management Milestone',
    detail: 'Ten Lab closes with solid risk process — or strong risk hygiene.',
    category: 'risk',
    target: 10,
    celebrateCopy: 'Risk process first. Outcomes are feedback, not grades.',
    progressOf: (c) => c.riskManagedCloses,
  },
  {
    id: 'simulator_process_10',
    title: 'Simulator Process Operator',
    detail: 'Ten Decision Simulator sessions recorded.',
    category: 'process',
    target: 10,
    celebrateCopy: 'Hidden candles train decisions — never celebrate path P&L.',
    progressOf: (c) => c.simulatorSessions,
  },
  {
    id: 'heatmap_consistency_60',
    title: 'Consistency Builder',
    detail: 'Heatmap consistency score at or above 60.',
    category: 'process',
    target: 60,
    celebrateCopy: 'Showing up regularly beats occasional heroics.',
    progressOf: (_c, extras) => extras.consistency,
  },
];

/**
 * Evaluate passport achievements from existing activity counts.
 * Does not invent new scoring — only thresholds on reused counters.
 */
export function evaluatePassportAchievements(input: {
  counts: PassportCounts;
  streakDays: number;
  consistencyScore: number;
  unlockedDates: Record<string, number>;
  nowMs?: number;
}): PassportAchievement[] {
  const now = input.nowMs ?? Date.now();
  const extras = {
    streakDays: input.streakDays,
    consistency: input.consistencyScore,
  };

  return DEFS.map((def) => {
    const progress = Math.min(def.target, Math.max(0, Math.round(def.progressOf(input.counts, extras))));
    const unlocked = progress >= def.target;
    const earnedAt = unlocked
      ? (input.unlockedDates[def.id] ?? now)
      : input.unlockedDates[def.id];

    return {
      id: def.id,
      title: def.title,
      detail: def.detail,
      category: def.category,
      target: def.target,
      progress,
      unlocked,
      earnedAt,
      celebrateCopy: def.celebrateCopy,
    };
  });
}

/** Newly unlocked IDs that should be persisted with earnedAt. */
export function newlyUnlockedAchievementDates(
  achievements: PassportAchievement[],
  existing: Record<string, number>,
  nowMs = Date.now(),
): Record<string, number> {
  const next = { ...existing };
  for (const achievement of achievements) {
    if (achievement.unlocked && next[achievement.id] == null) {
      next[achievement.id] = achievement.earnedAt ?? nowMs;
    }
  }
  return next;
}
