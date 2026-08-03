import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import {
  buildDecisionHeatmap,
  monthKeyFromMs,
  weekKeyFromMs,
  yearKeyFromMs,
} from '@/features/decision-heatmap/services/heatmap.service';
import type { HeatmapPeriod } from '@/features/decision-heatmap/types/heatmap.types';

import type {
  DecisionGraphMetric,
  DecisionGraphMetricId,
  DecisionGraphPeriod,
  DecisionGraphSnapshot,
  DecisionGraphSeriesPoint,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

const METRIC_HREF: Record<DecisionGraphMetricId, string> = {
  consistency: '/decision/heatmap',
  research: '/decision/radar',
  patience: '/decision/mentor',
  learning: '/academy',
  risk: '/decision/risk',
  journal: '/journal',
  replay: '/decision/decision-replay',
  academy: '/academy',
  mentor: '/decision/mentor',
};

const METRIC_LABEL: Record<DecisionGraphMetricId, string> = {
  consistency: 'Consistency',
  research: 'Research',
  patience: 'Patience',
  learning: 'Learning',
  risk: 'Risk',
  journal: 'Journal',
  replay: 'Replay',
  academy: 'Academy',
  mentor: 'Mentor',
};

function bucketKey(ms: number, period: DecisionGraphPeriod): string {
  if (period === 'weekly') return weekKeyFromMs(ms);
  if (period === 'monthly') return monthKeyFromMs(ms);
  return yearKeyFromMs(ms);
}

function bucketLabel(key: string, period: DecisionGraphPeriod): string {
  if (period === 'yearly') return key.slice(0, 4);
  if (period === 'monthly') {
    const [y, m] = key.split('-');
    return `${m}/${y?.slice(2) ?? ''}`;
  }
  return key.slice(5);
}

function emptyBuckets(period: DecisionGraphPeriod, nowMs: number): string[] {
  const keys: string[] = [];
  const count = period === 'weekly' ? 12 : period === 'monthly' ? 12 : 5;
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(nowMs);
    if (period === 'weekly') d.setUTCDate(d.getUTCDate() - i * 7);
    else if (period === 'monthly') d.setUTCMonth(d.getUTCMonth() - i);
    else d.setUTCFullYear(d.getUTCFullYear() - i);
    keys.push(bucketKey(d.getTime(), period));
  }
  return [...new Set(keys)];
}

function seriesFor(
  records: DecisionRecord[],
  period: DecisionGraphPeriod,
  nowMs: number,
  scoreFn: (bucketRecords: DecisionRecord[]) => number,
): DecisionGraphSeriesPoint[] {
  const keys = emptyBuckets(period, nowMs);
  return keys.map((key) => {
    const bucketRecords = records.filter((r) => bucketKey(r.createdAt, period) === key);
    return {
      key,
      label: bucketLabel(key, period),
      value: scoreFn(bucketRecords),
    };
  });
}

function count(recs: DecisionRecord[], action: DecisionRecord['action']) {
  return recs.filter((r) => r.action === action).length;
}

/**
 * GitHub × Apple Health style process graph — derived from Decision Log + Heatmap + DNA.
 */
export function buildDecisionGraph(input: {
  records: DecisionRecord[];
  dna: TradingDnaProfile;
  period: DecisionGraphPeriod;
  academyEvents?: number;
  mentorSessionsHint?: number;
  nowMs?: number;
}): DecisionGraphSnapshot {
  const nowMs = input.nowMs ?? Date.now();
  const heatmapPeriod = input.period as HeatmapPeriod;
  const heatmap = buildDecisionHeatmap({
    records: input.records,
    period: heatmapPeriod,
    nowMs,
  });

  const trait = (id: TradingDnaProfile['traits'][number]['id']) =>
    input.dna.traits.find((t) => t.id === id)?.score ?? 50;

  const metrics: DecisionGraphMetric[] = (
    [
      'consistency',
      'research',
      'patience',
      'learning',
      'risk',
      'journal',
      'replay',
      'academy',
      'mentor',
    ] as DecisionGraphMetricId[]
  ).map((id) => {
    const points = seriesFor(input.records, input.period, nowMs, (bucket) => {
      const researched = count(bucket, 'researched');
      const journaled = count(bucket, 'journaled');
      const replay = count(bucket, 'replay_completed');
      const skipped = count(bucket, 'skipped');
      const brief = count(bucket, 'brief_opened');
      switch (id) {
        case 'consistency':
          return clamp((researched > 0 || journaled > 0 || replay > 0 ? 55 : 0) + journaled * 12 + replay * 10);
        case 'research':
          return clamp(researched * 18 + Math.min(20, researched > 0 ? 15 : 0));
        case 'patience':
          return clamp(40 + skipped * 14 + replay * 8 - Math.max(0, researched - journaled - 2) * 6);
        case 'learning':
          return clamp(replay * 20 + brief * 8 + (input.academyEvents ? 15 : 0));
        case 'risk':
          return clamp(trait('riskManagement') * 0.7 + (journaled > 0 ? 15 : 0));
        case 'journal':
          return clamp(journaled * 22);
        case 'replay':
          return clamp(replay * 28);
        case 'academy':
          return clamp((input.academyEvents ?? 0) > 0 ? 45 + Math.min(40, (input.academyEvents ?? 0) * 8) : brief * 10);
        case 'mentor':
          return clamp(
            brief * 12 +
              (input.mentorSessionsHint ?? 0) * 18 +
              (journaled > 0 && researched > 0 ? 20 : 0),
          );
        default:
          return 0;
      }
    });

    const latest = points[points.length - 1]?.value ?? 0;
    const score =
      id === 'consistency'
        ? heatmap.scores.consistencyScore
        : id === 'learning'
          ? heatmap.scores.learningScore
          : id === 'patience'
            ? trait('patience')
            : id === 'risk'
              ? trait('riskManagement')
              : clamp(latest || points.reduce((s, p) => s + p.value, 0) / Math.max(1, points.length));

    return {
      id,
      label: METRIC_LABEL[id],
      score,
      points,
      href: METRIC_HREF[id],
    };
  });

  const overallScore = clamp(
    metrics.reduce((s, m) => s + m.score, 0) / Math.max(1, metrics.length),
  );

  const weakest = [...metrics].sort((a, b) => a.score - b.score)[0];
  const strongest = [...metrics].sort((a, b) => b.score - a.score)[0];

  return {
    period: input.period,
    metrics,
    overallScore,
    insight:
      overallScore >= 65
        ? `Process graph is healthy. Strongest: ${strongest?.label}. Keep the loop tight.`
        : `Room to grow in ${weakest?.label}. Open that surface and complete one deliberate session.`,
    generatedAt: nowMs,
  };
}
