import { mapMistakeToLesson } from '@/features/academy/services/curriculum.service';
import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';
import type { DecisionLogSummary } from '@/features/decision-log/services/decision-log.service';
import type { WeeklyGameTape } from '@/features/decision-replay/services/decision-replay.service';
import type { LabStats } from '@/features/decision-lab/types/lab.types';
import { buildTradingDna } from '@/features/decision/services/setup-enrichment.service';
import { buildWeeklyReview } from '@/features/decision/services/coaching-loop.service';
import type {
  DecisionBrief,
  DisciplineStreak,
  JournalCoachInsight,
  RiskCenterSnapshot,
  TraderMemory,
} from '@/features/decision/types/decision.types';
import type { TradingMentorBrief } from '@/features/decision/types/mentor.types';
import { pickMentorPersonalisationLine } from '@/features/onboarding/services/coach-personalisation.service';
import type { CoachProfile } from '@/features/onboarding/types/mentor-setup.types';
import { buildCoachingReferences } from '@/features/personal-intelligence/services/personal-intelligence.service';

export interface TradingMentorInput {
  brief?: DecisionBrief | null;
  logSummary?: DecisionLogSummary | null;
  journalCoach?: JournalCoachInsight | null;
  memory?: TraderMemory | null;
  weeklyTape?: WeeklyGameTape | null;
  labStats?: LabStats | null;
  risk?: RiskCenterSnapshot | null;
  streak?: DisciplineStreak | null;
  academyRecommendation?: CurriculumRecommendation | null;
  coachProfile?: CoachProfile | null;
  now?: number;
}

const HYPE_PATTERN =
  /\b(buy now|sell now|moon|guaranteed|to the moon|can't lose|must buy|must sell|will moon)\b|100%/gi;

/** Keeps mentor copy educational and prediction-free. */
export function sanitizeMentorCopy(text: string): string {
  const cleaned = text
    .replace(HYPE_PATTERN, 'process focus')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : 'Stay process-first today.';
}

function pickRepeatingMistake(input: TradingMentorInput): string {
  const candidates = [
    input.weeklyTape?.mostRepeatedMistake,
    input.journalCoach?.mostCommonMistake,
    input.logSummary ? buildWeeklyReview(input.logSummary).biggestMistake : null,
    input.labStats?.commonMistakes?.[0],
    input.memory?.typicalMistakes?.[0],
    input.memory?.dna?.commonMistakes?.[0],
  ].filter((value): value is string => Boolean(value && value.length > 4));

  const preferred = candidates.find(
    (value) => !/none clear|keep logging|defaults/i.test(value),
  );
  return sanitizeMentorCopy(preferred ?? 'Logging lightly — patterns need more journal evidence');
}

function pickGreatestStrength(input: TradingMentorInput): string {
  const weekly = input.logSummary ? buildWeeklyReview(input.logSummary) : null;
  const dna = input.memory ? buildTradingDna(input.memory) : null;
  const candidates = [
    input.weeklyTape?.mostDisciplined,
    weekly?.bestDecision,
    dna?.strengths?.[0],
    input.journalCoach?.edge,
  ].filter((value): value is string => Boolean(value && value.length > 4));

  return sanitizeMentorCopy(candidates[0] ?? 'Showing up to the brief and staying selective');
}

function pickMostImproved(input: TradingMentorInput): string {
  const weekly = input.logSummary ? buildWeeklyReview(input.logSummary) : null;
  return sanitizeMentorCopy(
    input.weeklyTape?.mostImprovedHabit ??
      weekly?.mostImprovedSkill ??
      'Building a consistent research and review cadence',
  );
}

function buildTodaysFocus(input: TradingMentorInput, mistake: string): string {
  const weekday = new Date(input.now ?? Date.now()).toLocaleDateString('en-US', {
    weekday: 'long',
  });
  const regime = input.brief?.regimeLabel ?? input.brief?.regimeSnapshot?.label;
  const psychology = input.brief?.psychologyReminder;
  const preferred = input.memory?.dna?.preferredRegimes?.[0] ?? input.memory?.dna?.bestConditions?.[0];

  if (psychology && psychology.length > 8) {
    return sanitizeMentorCopy(psychology);
  }
  if (preferred && regime && /range|chop|high.?vol/i.test(regime) && /trend/i.test(preferred)) {
    return sanitizeMentorCopy(
      `Today's objective is patience — your process is stronger in trending conditions than ${regime.toLowerCase()}.`,
    );
  }
  if (/monday/i.test(weekday) && /skip|ignore|selectiv/i.test(mistake)) {
    return sanitizeMentorCopy(
      "Today's objective is selectivity — protect Mondays from ignoring high-quality research opportunities.",
    );
  }
  if (/early|invalidation|stop/i.test(mistake)) {
    return sanitizeMentorCopy(
      "Today's objective is patience — define invalidation before you deepen research.",
    );
  }
  if ((input.logSummary?.journaled ?? 0) < 2 && (input.logSummary?.researched ?? 0) >= 2) {
    return sanitizeMentorCopy(
      "Today's objective is journaling — close the loop on what you researched or skipped.",
    );
  }
  return sanitizeMentorCopy(
    input.brief?.recommendedFocus ??
      "Today's objective is disciplined attention — one high-value research block, then review.",
  );
}

function buildDailyHeadline(input: TradingMentorInput, mistake: string, focus: string): string {
  const dna = input.memory ? buildTradingDna(input.memory) : null;
  const regime = input.brief?.regimeLabel;

  if (/early|invalidation/i.test(mistake)) {
    return sanitizeMentorCopy("You've been entering research or ideas too early recently.");
  }
  if (dna?.preferredRegimes?.some((r) => /trend/i.test(r)) && regime) {
    return sanitizeMentorCopy(`You tend to perform better when the tape favors your strengths — today reads ${regime}.`);
  }
  if (/monday|weekday/i.test(mistake) || /monday/i.test(focus)) {
    return sanitizeMentorCopy('You sometimes undervalue high-quality setups early in the week.');
  }
  if (/journal/i.test(mistake) || /journal/i.test(focus)) {
    return sanitizeMentorCopy('Your research volume is ahead of your journaling follow-through.');
  }
  if (/overtrad|selectiv|skip/i.test(mistake)) {
    return sanitizeMentorCopy('Selectivity is the coaching focus — not every idea deserves depth.');
  }
  return sanitizeMentorCopy(focus.replace(/^Today's objective is /i, '').replace(/\.$/, '') + '.');
}

function buildAcademyRec(
  input: TradingMentorInput,
  mistake: string,
): TradingMentorBrief['weekly']['academyRecommendation'] {
  const mapped = mapMistakeToLesson(
    `${mistake} ${input.weeklyTape?.lessonForNextWeek ?? ''} ${input.journalCoach?.recommendation ?? ''}`,
  );
  const rec = mapped ?? input.academyRecommendation;
  if (!rec) return null;
  return {
    lessonId: rec.lesson.id,
    title: rec.lesson.title,
    reason: sanitizeMentorCopy(rec.reason),
  };
}

/**
 * Deterministic Trading Mentor composer.
 * Reuses existing weekly review, journal coach, DNA, game tape, lab, and Academy mappers.
 * Does not predict prices or invent buy/sell language.
 */
export function buildTradingMentorBrief(input: TradingMentorInput): TradingMentorBrief {
  const now = input.now ?? Date.now();
  const weeklyReview = input.logSummary ? buildWeeklyReview(input.logSummary) : null;
  const dna = input.memory ? buildTradingDna(input.memory) : null;
  const mistake = pickRepeatingMistake(input);
  const todaysFocus = buildTodaysFocus(input, mistake);
  const headline = buildDailyHeadline(input, mistake, todaysFocus);
  const strength = pickGreatestStrength(input);
  const improved = pickMostImproved(input);
  const academyRecommendation = buildAcademyRec(input, mistake);

  const challenge = sanitizeMentorCopy(
    weeklyReview?.recommendedFocus ??
      input.weeklyTape?.lessonForNextWeek ??
      input.journalCoach?.recommendation ??
      'Complete one full decision loop: brief → research or skip → journal.',
  );

  const processScoreWeek =
    input.weeklyTape?.processScore ??
    input.brief?.processScoreWeek ??
    input.logSummary?.processScore ??
    input.journalCoach?.processScore ??
    0;

  const loopSteps = input.streak
    ? Object.values(input.streak.completedToday).filter(Boolean).length
    : 0;

  const evidenceNotes = [
    ...(input.weeklyTape?.evidenceNotes?.slice(0, 3) ?? []),
    input.risk && input.risk.holdingsCount > 0
      ? `Portfolio health check available · risk score ${input.risk.riskScore}`
      : null,
    input.labStats && input.labStats.tradesClosed > 0
      ? `Lab practice: avg process ${input.labStats.avgProcessScore}`
      : null,
    input.brief?.researchQueue?.length
      ? `${input.brief.researchQueue.length} research opportunities queued`
      : null,
  ].filter((note): note is string => Boolean(note));

  const personalLine = pickMentorPersonalisationLine(
    input.coachProfile ?? null,
    input.memory,
    now,
  );

  return {
    generatedAt: now,
    daily: {
      headline,
      detail: sanitizeMentorCopy(
        [
          personalLine,
          `Coach note: ${mistake}. Focus on process quality — never on predicting the next move.`,
        ]
          .filter(Boolean)
          .join(' '),
      ),
      todaysFocus,
      improveNext: sanitizeMentorCopy(
        weeklyReview?.aiLesson ??
          input.journalCoach?.psychology ??
          'Protect attention: research only what clears your invalidation checklist.',
      ),
      repeatingMistake: mistake,
    },
    weekly: {
      mostImprovedHabit: improved,
      mostCommonMistake: mistake,
      greatestStrength: strength,
      challenge,
      academyRecommendation,
      replayRecommendation: {
        href: '/decision/replay-tv',
        label: 'Open Decision Replay TV',
        reason: sanitizeMentorCopy(
          'Replay one historical episode with future candles hidden — grade your process, not the outcome.',
        ),
      },
    },
    currentGoal: sanitizeMentorCopy(
      weeklyReview?.recommendedFocus ??
        academyRecommendation?.reason ??
        challenge,
    ),
    learningStreakDays: input.streak?.days ?? 0,
    loopStepsCompletedToday: loopSteps,
    identity: {
      styleLabel: sanitizeMentorCopy(
        dna?.styleLabel ?? input.memory?.tradingStyle ?? 'Discretionary process trader',
      ),
      strengths: (dna?.strengths ?? input.memory?.bestSetups ?? []).slice(0, 3).map(sanitizeMentorCopy),
      weaknesses: (dna?.weaknesses ?? input.memory?.weakestSetups ?? [])
        .slice(0, 3)
        .map(sanitizeMentorCopy),
      preferredRegimes: (dna?.preferredRegimes ?? dna?.bestConditions ?? [])
        .slice(0, 3)
        .map(sanitizeMentorCopy),
      riskTolerance: input.memory?.riskTolerance ?? dna?.riskTolerance ?? 'moderate',
    },
    processScoreWeek,
    regimeLabel: input.brief?.regimeLabel ?? input.brief?.regimeSnapshot?.label ?? 'Unknown',
    evidenceNotes,
    coachingReferences: buildCoachingReferences({
      dnaLabel: dna?.styleLabel ?? input.memory?.tradingStyle ?? 'Process trader',
      debt: input.brief?.decisionDebt,
      academyNextTitle: academyRecommendation?.title ?? null,
    }),
  };
}
