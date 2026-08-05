import type { DecisionLogSummary } from '@/features/decision-log/services/decision-log.service';
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
  const consistency = input.dna.traits.find((t) => t.id === 'consistency')?.score ?? 0;
  const discipline = input.dna.traits.find((t) => t.id === 'discipline')?.score ?? 0;
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
}): PersonalizedTodayFocus {
  const archetype = resolveTodayArchetype(input);
  const becoming = input.dna.becomingLabel;
  const greet = input.researchGreeting?.trim();

  switch (archetype) {
    case 'new_trader':
      return {
        archetype,
        eyebrow: greet ?? 'Who you are becoming',
        headline: "Today's lesson",
        detail: input.academyNextTitle
          ? `Start with ${input.academyNextTitle}. Build identity before depth of research.`
          : 'You are early in the operating system — one Academy lesson beats three scattered charts.',
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
    case 'experienced':
      return {
        archetype,
        eyebrow: becoming,
        headline: "Today's replay",
        detail: 'Your edge compounds from reflection. Replay one Process Tape frame before hunting new setups.',
        primaryCta: { label: 'Open Decision Replay', href: '/decision/decision-replay' },
        secondaryCta: { label: 'Decision Graph', href: '/decision/intelligence' },
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
    case 'poor_discipline':
      return {
        archetype,
        eyebrow: 'Reset the loop',
        headline: 'Journal before researching',
        detail: 'Discipline is the bottleneck. Close yesterday’s loop before opening new radar depth.',
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
    case 'high_consistency':
      return {
        archetype,
        eyebrow: becoming,
        headline: 'Advanced setup today',
        detail: input.startHereSymbol
          ? `${input.startHereSymbol} clears your process bar — research with full checklist discipline.`
          : 'Consistency unlocked deeper research. Stay selective; protect Decision Quality.',
        primaryCta: {
          label: input.startHereSymbol ? `Research ${input.startHereSymbol}` : 'Open Radar',
          href: input.startHereSymbol
            ? `/asset/${encodeURIComponent(input.startHereSymbol)}`
            : '/decision/radar',
        },
        secondaryCta: { label: 'Trading DNA', href: '/decision/intelligence' },
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
    default:
      return {
        archetype: 'balanced',
        eyebrow: becoming,
        headline: 'Your decision loop',
        detail: 'Run brief → research or skip → journal. Identity updates from process, not P&L.',
        primaryCta: { label: 'Start Here', href: input.startHereSymbol ? `/asset/${encodeURIComponent(input.startHereSymbol)}` : '/decision/radar' },
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
}
