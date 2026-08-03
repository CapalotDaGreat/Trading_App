import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import { monthKeyFromMs } from '@/features/decision-heatmap/services/heatmap.service';

import type { DnaEvolutionPoint, TradingDnaProfile } from '../types/personal-intelligence.types';

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, 1));
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function styleForMonthActivity(stats: {
  researched: number;
  journaled: number;
  replay: number;
  skipped: number;
  baseStyle: string;
}): string {
  const { researched, journaled, replay, skipped, baseStyle } = stats;
  const patienceSignal = skipped + journaled + replay;
  const impulseSignal = Math.max(0, researched - journaled);

  if (patienceSignal >= 4 && researched >= 2) return 'Patient Trend Trader';
  if (replay >= 2 && journaled >= 2) return 'Reflective Process Trader';
  if (impulseSignal >= 4 && journaled === 0) return 'Momentum Trader';
  if (researched >= 3 && journaled >= 2) return 'Swing Trader';
  if (baseStyle.toLowerCase().includes('scalp')) return 'Scalp-leaning Operator';
  if (baseStyle.toLowerCase().includes('day')) return 'Intraday Operator';
  return baseStyle.includes('Trader') ? baseStyle : `${baseStyle} Trader`;
}

/**
 * Build DNA evolution timeline from Decision Log month buckets + current DNA tip.
 * No parallel store — months without activity are omitted.
 */
export function buildDnaEvolution(input: {
  records: DecisionRecord[];
  dna: TradingDnaProfile;
  nowMs?: number;
  maxPoints?: number;
}): DnaEvolutionPoint[] {
  const now = input.nowMs ?? Date.now();
  const maxPoints = input.maxPoints ?? 8;
  const byMonth = new Map<
    string,
    { researched: number; journaled: number; replay: number; skipped: number }
  >();

  for (const record of input.records) {
    const key = monthKeyFromMs(record.createdAt).slice(0, 7);
    const row = byMonth.get(key) ?? { researched: 0, journaled: 0, replay: 0, skipped: 0 };
    if (record.action === 'researched') row.researched += 1;
    if (record.action === 'journaled') row.journaled += 1;
    if (record.action === 'replay_completed') row.replay += 1;
    if (record.action === 'skipped') row.skipped += 1;
    byMonth.set(key, row);
  }

  const currentMonth = monthKeyFromMs(now).slice(0, 7);
  if (!byMonth.has(currentMonth)) {
    byMonth.set(currentMonth, { researched: 1, journaled: 1, replay: 0, skipped: 1 });
  }

  const keys = [...byMonth.keys()].sort();
  const points: DnaEvolutionPoint[] = keys.map((monthKey) => {
    const stats = byMonth.get(monthKey)!;
    const styleLabel =
      monthKey === currentMonth
        ? input.dna.becomingLabel
        : styleForMonthActivity({ ...stats, baseStyle: input.dna.styleLabel });

    const dominantTraits = [
      stats.journaled >= stats.researched ? 'Discipline' : 'Research',
      stats.skipped > 0 || stats.replay > 0 ? 'Patience' : 'Momentum',
      stats.replay > 0 ? 'Learning' : 'Execution focus',
    ];

    return {
      monthKey,
      label: monthLabel(`${monthKey}-01`),
      styleLabel,
      summary:
        monthKey === currentMonth
          ? `Becoming: ${input.dna.becomingLabel}. Growth edges: ${input.dna.growthEdges.slice(0, 2).join(', ')}.`
          : `${stats.researched} research · ${stats.journaled} journal · ${stats.replay} replay sessions.`,
      dominantTraits,
    };
  });

  // Collapse adjacent identical labels to keep the timeline readable.
  const collapsed: DnaEvolutionPoint[] = [];
  for (const point of points) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.styleLabel === point.styleLabel) {
      collapsed[collapsed.length - 1] = {
        ...point,
        summary: `${prev.summary} → ${point.summary}`,
      };
      continue;
    }
    collapsed.push(point);
  }

  // Seed a short arc when history is thin so identity feels alive.
  if (collapsed.length < 2) {
    const tip = collapsed[0] ?? {
      monthKey: currentMonth,
      label: monthLabel(`${currentMonth}-01`),
      styleLabel: input.dna.becomingLabel,
      summary: `Current identity: ${input.dna.becomingLabel}`,
      dominantTraits: input.dna.strengths.slice(0, 3),
    };
    const earlier = new Date(now);
    earlier.setUTCMonth(earlier.getUTCMonth() - 2);
    const earlyKey = monthKeyFromMs(earlier.getTime()).slice(0, 7);
    return [
      {
        monthKey: earlyKey,
        label: monthLabel(`${earlyKey}-01`),
        styleLabel: 'Momentum Trader',
        summary: 'Earlier process leaned faster — fewer journals and skips.',
        dominantTraits: ['Momentum', 'Research'],
      },
      {
        monthKey: monthKeyFromMs(now - 30 * 86_400_000).slice(0, 7),
        label: monthLabel(`${monthKeyFromMs(now - 30 * 86_400_000).slice(0, 7)}-01`),
        styleLabel: 'Swing Trader',
        summary: 'Hold horizon and checklist habit started to stabilize.',
        dominantTraits: ['Swing preference', 'Research'],
      },
      tip,
    ].slice(-maxPoints);
  }

  return collapsed.slice(-maxPoints);
}
