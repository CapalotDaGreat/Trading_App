import type { DecisionDebtSnapshot } from '@/features/decision/types/decision.types';
import type { TraderMemory } from '@/features/decision/types/decision.types';
import type { LabChallenge } from '@/features/decision-lab/types/lab.types';

import { ALL_LESSONS } from '../content';
import type { AcademyPathMeta } from '../content/paths-and-checklists';
import { LEARNING_PATHS } from '../content/paths-and-checklists';
import type { Lesson } from '../types/academy.types';

export interface CurriculumRecommendation {
  lesson: Lesson;
  reason: string;
  evidence: string[];
  source: 'dna' | 'debt' | 'path' | 'unpracticed';
  /** Personalized engine — Premium surface; free users see Decision Operator default. */
  isPersonalized: boolean;
}

export interface PathUnlockStatus {
  path: AcademyPathMeta;
  masteryUnlocked: boolean;
  requiredChallenges: string[];
  completedChallenges: string[];
  unlockHint?: string;
}

/** Keyword → lesson id map for DNA / debt remediation (content-level coaching). */
const WEAKNESS_LESSON_MAP: { pattern: RegExp; lessonId: string; reason: string }[] = [
  {
    pattern: /stop|invalidation|moved stop|widen/i,
    lessonId: 'dec-invalidation',
    reason: 'Your DNA / journal flags stop or invalidation issues.',
  },
  {
    pattern: /revenge|fomo|tilt|emotion|overtrad/i,
    lessonId: 'dec-psychology',
    reason: 'Psychology / tilt patterns show up in your profile.',
  },
  {
    pattern: /journal|no journal|skip journal/i,
    lessonId: 'dec-journaling',
    reason: 'Journal follow-through is a weak spot — close the loop.',
  },
  {
    pattern: /concentrat|correlated|portfolio|size/i,
    lessonId: 'dec-portfolio-risk',
    reason: 'Portfolio concentration / sizing needs a refresher.',
  },
  {
    pattern: /skip|ignore|high.?rvs|selectiv/i,
    lessonId: 'dec-why-not',
    reason: 'Selectivity / skip discipline is a coaching focus.',
  },
  {
    pattern: /regime|range|chop|vol/i,
    lessonId: 'dec-regime',
    reason: 'Regime fit is worth revisiting before the next research block.',
  },
  {
    pattern: /time|budget|attention|research/i,
    lessonId: 'dec-time-budget',
    reason: 'Research time budget protects decision quality.',
  },
  {
    pattern: /breakout|early entr/i,
    lessonId: 'ta-trend-range',
    reason: 'Breakout / range playbook mismatch — practice confirmation.',
  },
  {
    pattern: /risk.?reward|rr|expectancy/i,
    lessonId: 'risk-expectancy',
    reason: 'R:R / expectancy discipline needs reinforcement.',
  },
];

const DEBT_LESSON_MAP: Record<string, { lessonId: string; reason: string }> = {
  journal: {
    lessonId: 'dec-journaling',
    reason: 'Decision debt: incomplete journals — practice the post-trade loop.',
  },
  unreviewed: {
    lessonId: 'dec-research-filter',
    reason: 'Decision debt: unreviewed setups — tighten the research filter.',
  },
  academy: {
    lessonId: 'dec-time-budget',
    reason: 'Unfinished Academy work — finish one lesson before new ideas.',
  },
  replay: {
    lessonId: 'dec-setup-quality',
    reason: 'Unfinished replay — practice setup quality on film.',
  },
  alerts: {
    lessonId: 'dec-why-not',
    reason: 'Ignored alerts — revisit skip vs engage criteria.',
  },
};

function lessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getDefaultOperatorPath(): AcademyPathMeta {
  return LEARNING_PATHS.find((p) => p.isDefault) ?? LEARNING_PATHS[0]!;
}

export function evaluatePathUnlocks(challenges: LabChallenge[]): PathUnlockStatus[] {
  const completedIds = new Set(
    challenges.filter((c) => c.completed).map((c) => c.id),
  );

  return LEARNING_PATHS.map((path) => {
    const required = path.unlockLabChallengeIds ?? [];
    const done = required.filter((id) => completedIds.has(id));
    const masteryUnlocked = required.length === 0 || done.length > 0;
    return {
      path,
      masteryUnlocked,
      requiredChallenges: required,
      completedChallenges: done,
      unlockHint:
        required.length === 0
          ? undefined
          : masteryUnlocked
            ? 'Lab challenge met — mastery path unlocked'
            : `Practice in Decision Lab: complete ${required.join(' or ')} for mastery badge`,
    };
  });
}

/**
 * Personalized next lessons from DNA + Decision Debt.
 * Free tier callers should use `buildDefaultNextLesson` instead of surfacing these.
 */
export function buildPersonalizedCurriculum(input: {
  memory?: TraderMemory;
  debt?: DecisionDebtSnapshot;
  isRead: (lessonId: string) => boolean;
  isPracticed: (lessonId: string) => boolean;
  limit?: number;
}): CurriculumRecommendation[] {
  const { memory, debt, isRead, isPracticed, limit = 3 } = input;
  const out: CurriculumRecommendation[] = [];
  const seen = new Set<string>();

  const push = (rec: CurriculumRecommendation) => {
    if (seen.has(rec.lesson.id)) return;
    seen.add(rec.lesson.id);
    out.push(rec);
  };

  // Beginner Mentor Setup → Foundations first
  const experienceHint = `${memory?.notes?.join(' ') ?? ''} ${memory?.tradingStyle ?? ''}`;
  const isBeginner =
    /completely new|beginner/i.test(experienceHint) ||
    (memory?.notes ?? []).some((n) => /beginner|completely new/i.test(n));
  if (isBeginner) {
    for (const id of ['foundations-1', 'dec-invalidation', 'dec-psychology', 'ta-trend-range']) {
      const lesson = lessonById(id) ?? ALL_LESSONS.find((l) => /foundation|beginner|basics/i.test(l.title));
      if (!lesson || isPracticed(lesson.id)) continue;
      push({
        lesson,
        reason: 'Your coach profile suggests Foundations-first learning with clearer explanations.',
        evidence: ['Mentor Setup · beginner-friendly path'],
        source: 'path',
        isPersonalized: true,
      });
      break;
    }
  }

  // DNA weaknesses / typical mistakes
  const dnaSignals = [
    ...(memory?.typicalMistakes ?? []),
    ...(memory?.weakestSetups ?? []),
    ...(memory?.dna?.weaknesses ?? []),
    ...(memory?.dna?.commonMistakes ?? []),
    ...(memory?.struggles ?? []),
  ];

  for (const signal of dnaSignals) {
    for (const rule of WEAKNESS_LESSON_MAP) {
      if (!rule.pattern.test(signal)) continue;
      const lesson = lessonById(rule.lessonId);
      if (!lesson) continue;
      if (isPracticed(lesson.id) && isRead(lesson.id)) continue;
      push({
        lesson,
        reason: rule.reason,
        evidence: [`DNA signal: “${signal.slice(0, 80)}”`],
        source: 'dna',
        isPersonalized: true,
      });
    }
  }

  // Decision debt items
  for (const item of debt?.items ?? []) {
    const map = DEBT_LESSON_MAP[item.id];
    if (!map) continue;
    const lesson = lessonById(map.lessonId);
    if (!lesson) continue;
    push({
      lesson,
      reason: map.reason,
      evidence: [item.label],
      source: 'debt',
      isPersonalized: true,
    });
  }

  // Prefer unread / unpracticed Decision Operator lessons
  const operator = getDefaultOperatorPath();
  for (const id of operator.lessonIds) {
    if (isPracticed(id)) continue;
    const lesson = lessonById(id);
    if (!lesson) continue;
    push({
      lesson,
      reason: isRead(id)
        ? 'Read but not practiced — open a practice gate to deepen mastery.'
        : 'Next step on the Decision Operator path.',
      evidence: ['Decision Operator default journey'],
      source: isRead(id) ? 'unpracticed' : 'path',
      isPersonalized: Boolean(memory || debt),
    });
  }

  return out.slice(0, limit);
}

/** Free-tier safe: always Decision Operator next unread/unpracticed lesson. */
export function buildDefaultNextLesson(input: {
  isRead: (lessonId: string) => boolean;
  isPracticed: (lessonId: string) => boolean;
}): CurriculumRecommendation | null {
  const operator = getDefaultOperatorPath();
  for (const id of operator.lessonIds) {
    const lesson = lessonById(id);
    if (!lesson) continue;
    if (!input.isPracticed(id)) {
      return {
        lesson,
        reason: input.isRead(id)
          ? 'You’ve read this — practice in the app to move toward mastery.'
          : 'Continue the Decision Operator path.',
        evidence: ['Default journey · free foundations'],
        source: input.isRead(id) ? 'unpracticed' : 'path',
        isPersonalized: false,
      };
    }
  }
  return null;
}

/** Map process mistakes / coach text → Academy lesson for Replay loop. */
export function mapMistakeToLesson(text: string): CurriculumRecommendation | null {
  for (const rule of WEAKNESS_LESSON_MAP) {
    if (!rule.pattern.test(text)) continue;
    const lesson = lessonById(rule.lessonId);
    if (!lesson) continue;
    return {
      lesson,
      reason: rule.reason,
      evidence: [`Matched from review: “${text.slice(0, 100)}”`],
      source: 'dna',
      isPersonalized: true,
    };
  }
  return null;
}

/** Editorial audit helper — lessons with no practice route fail the quality bar. */
export function auditLessonsWithoutPractice(): { id: string; title: string }[] {
  return ALL_LESSONS.filter((l) => l.practiceLinks.length === 0).map((l) => ({
    id: l.id,
    title: l.title,
  }));
}
