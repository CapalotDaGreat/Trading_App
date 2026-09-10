import type { DecisionLogSummary } from '@/features/decision-log/services/decision-log.service';
import type { DecisionReinforcementSnapshot } from '@/features/decision/types/decision-reinforcement.types';
import type { DisciplineStreak, DecisionDebtSnapshot } from '@/features/decision/types/decision.types';
import {
  TODAY_SECTION_ORDER,
  type TodaySection,
} from '@/features/decision/services/today-sections.service';

import type {
  PersonalizedTodayFocus,
  TodayArchetype,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';
import { getTraitScore } from './trading-dna-traits.service';

function uniqueOrder(preferred: TodaySection[]): TodaySection[] {
  const seen = new Set<TodaySection>();
  const ordered: TodaySection[] = [];
  for (const section of preferred) {
    if (!TODAY_SECTION_ORDER.includes(section) || seen.has(section)) continue;
    seen.add(section);
    ordered.push(section);
  }
  for (const section of TODAY_SECTION_ORDER) {
    if (!seen.has(section)) ordered.push(section);
  }
  return ordered;
}

export function resolveTodayArchetype(input: {
  dna: TradingDnaProfile;
  logSummary?: DecisionLogSummary | null;
  streak?: DisciplineStreak | null;
  debt?: DecisionDebtSnapshot | null;
  academyPracticed?: number;
}): TodayArchetype {
  const total = input.logSummary?.total ?? 0;
  const process = input.logSummary?.processScore ?? 0;
  const consistency = getTraitScore(input.dna, 'processConsistency') ?? 0;
  const discipline = getTraitScore(input.dna, 'evidenceDiscipline') ?? 0;
  const loopDone = input.streak
    ? Object.values(input.streak.completedToday).filter(Boolean).length
    : 0;
  const debtScore = input.debt?.score ?? 0;

  if (total < 8 && (input.academyPracticed ?? 0) < 2) return 'new_trader';
  if (discipline < 45 || debtScore >= 55 || (loopDone === 0 && process < 45)) {
    return 'poor_discipline';
  }
  if (consistency >= 65 && discipline >= 60 && process >= 60) return 'high_consistency';
  if (total >= 25 || (input.academyPracticed ?? 0) >= 5) return 'experienced';
  return 'balanced';
}

function applyDnaAdaptations(
  focus: PersonalizedTodayFocus,
  dna: TradingDnaProfile,
  nowMs?: number,
  uid?: string,
  reinforcement?: DecisionReinforcementSnapshot | null,
): PersonalizedTodayFocus {
  const adaptations: string[] = [];
  const patience = getTraitScore(dna, 'patience');
  const researchEfficiency = getTraitScore(dna, 'researchEfficiency');
  const invalidation = dna.traits.find((t) => t.id === 'invalidationDiscipline');
  const overAnalysis = dna.observedTendencies.find((t) => t.id === 'over_analysis');
  const risk = dna.traits.find((t) => t.id === 'riskAwareness');
  let sectionOrder = [...focus.sectionOrder];

  if (patience != null && patience < 50 && dna.traits.find((t) => t.id === 'patience')?.trend !== 'up') {
    adaptations.push('fewer_research_priorities');
    sectionOrder = uniqueOrder([
      'header',
      'dynamicToday',
      'mentor',
      'goals',
      'whyNot',
      'startHere',
      'researchQueue',
      ...sectionOrder,
    ]);
  }

  if (researchEfficiency != null && researchEfficiency < 50) {
    adaptations.push('time_budget_emphasis');
  }

  if (risk?.status === 'scored' && risk.trend === 'up' && (risk.score ?? 0) >= 60) {
    adaptations.push('reduce_risk_reminders');
  }

  const cue = pickTodayCue({
    dna,
    overAnalysisLevel: overAnalysis?.level ?? 'not_observed',
    invalidation,
    researchEfficiency,
    nowMs,
    uid,
    reinforcement,
  });
  if (cue) adaptations.push(cue.id);

  return {
    ...focus,
    sectionOrder,
    todayCue: cue?.text ?? null,
    todayCueMeta: cue?.meta,
    dnaAdaptations: adaptations,
  };
}

function dayKey(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function hashPick(key: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return modulo === 0 ? 0 : h % modulo;
}

function pickTodayCue(input: {
  dna: TradingDnaProfile;
  overAnalysisLevel: 'not_observed' | 'mild' | 'clear';
  invalidation?: TradingDnaProfile['traits'][number];
  researchEfficiency: number | null;
  nowMs?: number;
  uid?: string;
  reinforcement?: DecisionReinforcementSnapshot | null;
}): { id: string; text: string; meta?: PersonalizedTodayFocus['todayCueMeta'] } | null {
  if (input.reinforcement?.enabled) {
    const cue = input.reinforcement.todayCue;
    if (!cue) return null;
    return {
      id: cue.id,
      text: cue.text,
      meta: {
        traitId: cue.traitId,
        evidenceQuality: cue.evidenceQuality,
      },
    };
  }

  const candidates: Array<{ id: string; text: string }> = [];
  const overImproving =
    input.dna.traits.find((t) => t.id === 'researchEfficiency')?.longitudinalTrend === 'improving' ||
    input.dna.traits.find((t) => t.id === 'researchEfficiency')?.trend === 'up';
  const invalidationImproving =
    input.invalidation?.longitudinalTrend === 'improving' || input.invalidation?.trend === 'up';
  const patience = input.dna.traits.find((t) => t.id === 'patience');
  const patienceImproving =
    patience?.longitudinalTrend === 'improving' || patience?.trend === 'up';

  if (patienceImproving && patience?.status === 'scored') {
    return {
      id: 'patience_practice_cue',
      text: "You've been improving at waiting. Today's market conditions give you another opportunity to practice that.",
    };
  }

  const progressInsight = input.dna.processInsights?.[0];
  if (progressInsight?.observation) {
    return {
      id: `insight_${progressInsight.traitId}`,
      text: progressInsight.observation,
    };
  }

  if (
    (input.overAnalysisLevel === 'clear' || input.overAnalysisLevel === 'mild' || (input.researchEfficiency != null && input.researchEfficiency < 50)) &&
    !overImproving
  ) {
    candidates.push({
      id: 'research_budget_cue',
      text: 'Two assets are enough for todayâ€™s research budget.',
    });
  }

  if (
    input.invalidation?.status === 'scored' &&
    (input.invalidation.score ?? 100) < 55 &&
    !invalidationImproving
  ) {
    candidates.push({
      id: 'invalidation_cue',
      text: 'Before continuing, define what would change your thesis.',
    });
  }

  if (!candidates.length) return null;
  const key = `${input.uid ?? 'demo-guest'}:${dayKey(input.nowMs ?? Date.now())}`;
  return candidates[hashPick(key, candidates.length)] ?? candidates[0];
}

/**
 * Personalized Today focus + section order. Reuses existing Today sections.
 */
export function buildPersonalizedToday(input: {
  dna: TradingDnaProfile;
  logSummary?: DecisionLogSummary | null;
  streak?: DisciplineStreak | null;
  debt?: DecisionDebtSnapshot | null;
  academyPracticed?: number;
  academyNextTitle?: string | null;
  startHereSymbol?: string | null;
  researchGreeting?: string | null;
  nowMs?: number;
  uid?: string;
  reinforcement?: DecisionReinforcementSnapshot | null;
}): PersonalizedTodayFocus {
  const archetype = resolveTodayArchetype(input);
  const becoming = input.dna.becomingLabel;
  const greet = input.researchGreeting?.trim();

  let focus: PersonalizedTodayFocus;
  switch (archetype) {
    case 'new_trader':
      focus = {
        archetype,
        eyebrow: greet ?? 'Who you are becoming',
        headline: "Today's lesson",
        detail: input.academyNextTitle
          ? `Start with ${input.academyNextTitle}. Build identity before depth of research.`
          : 'You are early in the operating system â€” one Academy lesson beats three scattered charts.',
        primaryCta: { label: 'Open Academy', href: '/academy' },
        secondaryCta: { label: 'Meet your Mentor', href: '/decision/mentor' },
        sectionOrder: uniqueOrder([
          'header',
          'dynamicToday',
          'mentor',
          'goals',
          'morningBrief',
          'dayPlan',
          'startHere',
          'researchQueue',
          'decisionLog',
          'closeLoop',
        ]),
      };
      break;
    case 'experienced':
      focus = {
        archetype,
        eyebrow: becoming,
        headline: "Today's replay",
        detail:
          'Your edge compounds from reflection. Replay one Process Tape frame before opening new research.',
        primaryCta: { label: 'Open Decision Replay', href: '/decision/decision-replay' },
        secondaryCta: { label: 'Practice Replay TV', href: '/decision/replay-tv' },
        sectionOrder: uniqueOrder([
          'header',
          'dynamicToday',
          'mentor',
          'goals',
          'morningBrief',
          'dayPlan',
          'decisionLog',
          'startHere',
          'researchQueue',
          'whyNot',
          'closeLoop',
        ]),
      };
      break;
    case 'poor_discipline':
      focus = {
        archetype,
        eyebrow: 'Reset the loop',
        headline: 'Journal before researching',
        detail: 'Process consistency is the bottleneck. Close yesterdayâ€™s loop before opening new radar depth.',
        primaryCta: { label: 'Open Journal', href: '/journal' },
        secondaryCta: { label: 'Mentor focus', href: '/decision/mentor' },
        sectionOrder: uniqueOrder([
          'header',
          'dynamicToday',
          'goals',
          'mentor',
          'closeLoop',
          'decisionLog',
          'morningBrief',
          'dayPlan',
          'whyNot',
          'startHere',
          'researchQueue',
        ]),
      };
      break;
    case 'high_consistency':
      focus = {
        archetype,
        eyebrow: becoming,
        headline: 'Advanced setup today',
        detail: input.startHereSymbol
          ? `${input.startHereSymbol} clears your process bar — study with full checklist discipline.`
          : 'Consistency unlocked deeper study. Stay selective; protect Decision Quality.',
        primaryCta: {
          label: input.startHereSymbol ? `Study ${input.startHereSymbol}` : 'Open training recommendations',
          href: input.startHereSymbol
            ? `/asset/${encodeURIComponent(input.startHereSymbol)}`
            : '/decision/radar',
        },
        secondaryCta: { label: 'Process patterns', href: '/decision/intelligence' },
        sectionOrder: uniqueOrder([
          'header',
          'dynamicToday',
          'morningBrief',
          'startHere',
          'researchQueue',
          'mentor',
          'dnaPulse',
          'goals',
          'dayPlan',
          'whyNot',
          'decisionLog',
          'regime',
          'closeLoop',
        ]),
      };
      break;
    default:
      focus = {
        archetype: 'balanced',
        eyebrow: becoming,
        headline: 'Your decision loop',
        detail: 'Run brief â†’ research or skip â†’ journal. Identity updates from process, not P&L.',
        primaryCta: {
          label: 'Start Here',
          href: input.startHereSymbol
            ? `/asset/${encodeURIComponent(input.startHereSymbol)}`
            : '/decision/radar',
        },
        secondaryCta: { label: 'Personal Intelligence', href: '/decision/intelligence' },
        sectionOrder: uniqueOrder([
          'header',
          'dynamicToday',
          'morningBrief',
          'mentor',
          'goals',
          'dayPlan',
          'startHere',
          'researchQueue',
          'whyNot',
          'dnaPulse',
          'decisionLog',
          'regime',
          'closeLoop',
        ]),
      };
  }

  return applyDnaAdaptations(focus, input.dna, input.nowMs, input.uid, input.reinforcement);
}
