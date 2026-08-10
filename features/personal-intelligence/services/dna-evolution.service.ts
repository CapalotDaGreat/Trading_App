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

  if (patienceSignal >= 4 && researched >= 2) return 'Patient Process Operator';
  if (replay >= 2 && journaled >= 2) return 'Reflective Decision-Maker';
  if (impulseSignal >= 4 && journaled === 0) return 'High-activity researcher';
  if (researched >= 3 && journaled >= 2) return baseStyle;
  return baseStyle.includes('Trader') || baseStyle.includes('Operator')
    ? baseStyle
    : `${baseStyle} Decision-Maker`;
}

/**
 * Build DNA evolution timeline from Decision Log month buckets + current DNA tip.
 * No parallel store — months without activity are omitted.
 * Never fabricates earlier identity when history is thin.
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
  const keys = [...byMonth.keys()].sort();

  if (!keys.length) {
    return [
      {
        monthKey: currentMonth,
        label: monthLabel(currentMonth),
        styleLabel: input.dna.becomingLabel,
        summary: 'Not enough evidence yet to chart DNA evolution.',
        dominantTraits: [],
        hasEvidence: false,
      },
    ];
  }

  const points: DnaEvolutionPoint[] = keys.map((monthKey) => {
    const stats = byMonth.get(monthKey)!;
    const activity = stats.researched + stats.journaled + stats.replay + stats.skipped;
    const styleLabel =
      monthKey === currentMonth
        ? input.dna.becomingLabel
        : styleForMonthActivity({ ...stats, baseStyle: input.dna.styleLabel });

    const dominantTraits = [
      stats.journaled >= stats.researched ? 'Reflection Quality' : 'Research Efficiency',
      stats.skipped > 0 || stats.replay > 0 ? 'Patience' : 'Learning Momentum',
      stats.replay > 0 ? 'Learning Momentum' : 'Process Consistency',
    ];

    return {
      monthKey,
      label: monthLabel(monthKey),
      styleLabel,
      summary:
        monthKey === currentMonth
          ? `Becoming: ${input.dna.becomingLabel}. Growth edges: ${input.dna.growthEdges.slice(0, 2).join(', ') || 'gathering evidence'}.`
          : `${stats.researched} research · ${stats.journaled} journal · ${stats.replay} replay sessions.`,
      dominantTraits: activity > 0 ? dominantTraits : [],
      hasEvidence: activity > 0,
    };
  });

  const collapsed: DnaEvolutionPoint[] = [];
  for (const point of points) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.styleLabel === point.styleLabel && prev.hasEvidence && point.hasEvidence) {
      collapsed[collapsed.length - 1] = {
        ...point,
        summary: `${prev.summary} → ${point.summary}`,
      };
      continue;
    }
    collapsed.push(point);
  }

  return collapsed.slice(-maxPoints);
}
