import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { JournalCoachInsight, TraderMemory } from '@/features/decision/types/decision.types';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';

import type { DnaEvidenceItem, DnaEvidenceSource } from '../types/personal-intelligence.types';

export interface DnaEvidenceBundle {
  researched: number;
  skipped: number;
  journaled: number;
  ignored: number;
  invalidated: number;
  replay: number;
  labClosed: number;
  checklist: number;
  briefOpened: number;
  avgDqs: number | null;
  avgRvs: number | null;
  heatmap?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  memory: TraderMemory;
  windowMs: number;
}

export function countActions(
  records: DecisionRecord[],
  action: DecisionRecord['action'],
  sinceMs: number,
): number {
  return records.filter((r) => r.action === action && r.createdAt >= sinceMs).length;
}

export function avgField(
  records: DecisionRecord[],
  sinceMs: number,
  field: 'decisionQualityScore' | 'researchValueScore',
): number | null {
  const scored = records.filter(
    (r) => r.createdAt >= sinceMs && typeof r[field] === 'number',
  );
  if (!scored.length) return null;
  return scored.reduce((s, r) => s + (r[field] as number), 0) / scored.length;
}

export function buildEvidenceBundle(input: {
  records: DecisionRecord[];
  memory: TraderMemory;
  heatmapScores?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  sinceMs: number;
  windowMs: number;
}): DnaEvidenceBundle {
  const { records, sinceMs } = input;
  return {
    researched: countActions(records, 'researched', sinceMs),
    skipped: countActions(records, 'skipped', sinceMs),
    journaled: countActions(records, 'journaled', sinceMs),
    ignored: countActions(records, 'ignored', sinceMs),
    invalidated: countActions(records, 'invalidated', sinceMs),
    replay: countActions(records, 'replay_completed', sinceMs),
    labClosed: countActions(records, 'lab_closed', sinceMs),
    checklist: countActions(records, 'checklist_done', sinceMs),
    briefOpened: countActions(records, 'brief_opened', sinceMs),
    avgDqs: avgField(records, sinceMs, 'decisionQualityScore'),
    avgRvs: avgField(records, sinceMs, 'researchValueScore'),
    heatmap: input.heatmapScores,
    journalCoach: input.journalCoach,
    memory: input.memory,
    windowMs: input.windowMs,
  };
}

export function evidenceItem(
  source: DnaEvidenceSource,
  count: number,
  label: string,
  href?: string,
): DnaEvidenceItem | null {
  if (count <= 0) return null;
  return { source, count, label, href };
}

export function collectEvidence(...items: Array<DnaEvidenceItem | null | undefined>): DnaEvidenceItem[] {
  return items.filter((item): item is DnaEvidenceItem => Boolean(item && item.count > 0));
}

export function totalEvidenceCount(items: DnaEvidenceItem[]): number {
  return items.reduce((sum, item) => sum + item.count, 0);
}

export function confidenceFromEvidence(
  evidenceUnits: number,
  thresholds: { low: number; medium: number; high: number },
): { level: 'low' | 'medium' | 'high'; value: number } {
  if (evidenceUnits >= thresholds.high) return { level: 'high', value: Math.min(1, 0.75 + evidenceUnits / 40) };
  if (evidenceUnits >= thresholds.medium) return { level: 'medium', value: 0.45 + evidenceUnits / 50 };
  if (evidenceUnits >= thresholds.low) return { level: 'low', value: 0.2 + evidenceUnits / 40 };
  return { level: 'low', value: Math.min(0.2, evidenceUnits / 20) };
}
