import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { JournalCoachInsight, TraderMemory } from '@/features/decision/types/decision.types';
import type { HeatmapScores } from '@/features/decision-heatmap/types/heatmap.types';
import type { JournalEntry } from '@/features/journal/types/journal.types';

import type {
  DnaEvidenceItem,
  DnaEvidenceSource,
  DnaJournalEvidence,
} from '../types/personal-intelligence.types';

export interface DnaEvidenceBundle {
  researched: number;
  skipped: number;
  journaled: number;
  ignored: number;
  invalidated: number;
  replay: number;
  replayTvPatience: number;
  replayTvInvalidation: number;
  replayTvEvidence: number;
  replayTvConfirmation: number;
  replayTvStamina: number;
  replayTvUncertainty: number;
  journalProcess: number;
  labClosed: number;
  checklist: number;
  briefOpened: number;
  avgDqs: number | null;
  avgRvs: number | null;
  heatmap?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  memory: TraderMemory;
  windowMs: number;
  journalEvidence?: DnaJournalEvidence[] | null;
}

export function countActions(
  records: DecisionRecord[],
  action: DecisionRecord['action'],
  sinceMs: number,
): number {
  return records.filter((r) => r.action === action && r.createdAt >= sinceMs).length;
}

export function countNoteIncludes(
  records: DecisionRecord[],
  action: DecisionRecord['action'],
  needle: string,
  sinceMs: number,
): number {
  return countNoteAny(records, action, [needle], sinceMs);
}

export function countNoteAny(
  records: DecisionRecord[],
  action: DecisionRecord['action'],
  needles: string[],
  sinceMs: number,
): number {
  return records.filter(
    (r) =>
      r.action === action &&
      r.createdAt >= sinceMs &&
      typeof r.note === 'string' &&
      needles.some((needle) => r.note!.includes(needle)),
  ).length;
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

export function toDnaJournalEvidence(entries: JournalEntry[]): DnaJournalEvidence[] {
  return entries.map((entry) => ({
    id: entry.id,
    createdAtMs: Date.parse(entry.createdAt) || Date.parse(entry.tradedAt) || 0,
    hasPsychology: Boolean(entry.emotion),
    hasLesson: Boolean(entry.lessonsLearned?.trim()),
    planAdhered: entry.planAdhered ?? null,
    emotion: entry.emotion ?? null,
    mistakeCategory: entry.mistakeCategory ?? null,
  }));
}

function countJournalEvidence(
  slice: DnaJournalEvidence[] | null | undefined,
  sinceMs: number,
): number | null {
  if (!slice) return null;
  return slice.filter((item) => item.createdAtMs >= sinceMs).length;
}

/** Structured process flags only — never journal bodies. */
function countJournalProcessEntries(
  slice: DnaJournalEvidence[] | null | undefined,
  sinceMs: number,
): number | null {
  if (!slice) return null;
  return slice.filter(
    (item) =>
      item.createdAtMs >= sinceMs &&
      (item.hasLesson || item.hasPsychology || item.planAdhered != null),
  ).length;
}

export function buildEvidenceBundle(input: {
  records: DecisionRecord[];
  memory: TraderMemory;
  heatmapScores?: HeatmapScores | null;
  journalCoach?: JournalCoachInsight | null;
  journalEvidence?: DnaJournalEvidence[] | null;
  sinceMs: number;
  windowMs: number;
}): DnaEvidenceBundle {
  const { records, sinceMs } = input;
  const liveJournaled = countJournalEvidence(input.journalEvidence, sinceMs);
  const liveJournalProcess = countJournalProcessEntries(input.journalEvidence, sinceMs);
  const journaled = liveJournaled ?? countActions(records, 'journaled', sinceMs);
  return {
    researched: countActions(records, 'researched', sinceMs),
    skipped: countActions(records, 'skipped', sinceMs),
    journaled,
    ignored: countActions(records, 'ignored', sinceMs),
    invalidated: countActions(records, 'invalidated', sinceMs),
    replay: countActions(records, 'replay_completed', sinceMs),
    replayTvPatience: countNoteIncludes(records, 'replay_completed', 'rtv:patience', sinceMs),
    replayTvInvalidation: countNoteIncludes(
      records,
      'replay_completed',
      'rtv:invalidation',
      sinceMs,
    ),
    replayTvEvidence: countNoteIncludes(records, 'replay_completed', 'rtv:evidence', sinceMs),
    replayTvConfirmation: countNoteAny(
      records,
      'replay_completed',
      ['rtv:confirmation', 'rtv:skill:confirmation'],
      sinceMs,
    ),
    replayTvStamina: countNoteAny(
      records,
      'replay_completed',
      ['rtv:stamina', 'rtv:skill:stamina'],
      sinceMs,
    ),
    replayTvUncertainty: countNoteAny(
      records,
      'replay_completed',
      ['rtv:uncertainty', 'rtv:inaction_ok'],
      sinceMs,
    ),
    journalProcess: liveJournalProcess ?? journaled,
    labClosed: countActions(records, 'lab_closed', sinceMs),
    checklist: countActions(records, 'checklist_done', sinceMs),
    briefOpened: countActions(records, 'brief_opened', sinceMs),
    avgDqs: avgField(records, sinceMs, 'decisionQualityScore'),
    avgRvs: avgField(records, sinceMs, 'researchValueScore'),
    heatmap: input.heatmapScores,
    journalCoach: input.journalCoach,
    memory: input.memory,
    windowMs: input.windowMs,
    journalEvidence: input.journalEvidence,
  };
}

const PROCESS_DECISIONS: DecisionRecord['action'][] = [
  'researched',
  'skipped',
  'journaled',
  'invalidated',
];

export function lastProcessDecisions(records: DecisionRecord[], limit = 22): DecisionRecord[] {
  return [...records]
    .filter((r) => PROCESS_DECISIONS.includes(r.action))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function countNamedInvalidation(records: DecisionRecord[]): number {
  return records.filter(
    (r) =>
      r.action === 'invalidated' ||
      (typeof r.invalidation === 'string' && r.invalidation.trim().length > 0),
  ).length;
}

export function invalidationRatioSentence(
  records: DecisionRecord[],
  limit = 22,
): string | undefined {
  const last = lastProcessDecisions(records, limit);
  if (last.length < 4) return undefined;
  const named = countNamedInvalidation(last);
  return `You explicitly recorded invalidation conditions in ${named} of your last ${last.length} decisions.`;
}

export function formatWhySummary(items: DnaEvidenceItem[]): string {
  if (!items.length) return 'Not enough observable process events yet.';
  const replay = items.filter((i) => i.source === 'replay').reduce((s, i) => s + i.count, 0);
  const journal = items.filter((i) => i.source === 'journal').reduce((s, i) => s + i.count, 0);
  const log = items
    .filter((i) => i.source === 'decision_log' || i.source === 'checklist')
    .reduce((s, i) => s + i.count, 0);
  const academy = items
    .filter((i) => i.source === 'academy' || i.source === 'lab')
    .reduce((s, i) => s + i.count, 0);
  const parts: string[] = [];
  if (replay > 0) parts.push(`${replay} replay decision${replay === 1 ? '' : 's'}`);
  if (log > 0) parts.push(`${log} decision-log event${log === 1 ? '' : 's'}`);
  if (journal > 0) {
    parts.push(`${journal} journal process ${journal === 1 ? 'entry' : 'entries'}`);
  }
  if (academy > 0) parts.push(`${academy} practice event${academy === 1 ? '' : 's'}`);
  if (!parts.length) {
    return `Based on ${items.reduce((s, i) => s + i.count, 0)} observable process events.`;
  }
  if (parts.length === 1) return `Based on ${parts[0]}.`;
  return `Based on ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`;
}

/** Count-only evidence lines for "Why?" — never journal bodies. */
export function formatWhyBullets(items: DnaEvidenceItem[]): string[] {
  if (!items.length) return [];
  const replay = items.filter((i) => i.source === 'replay').reduce((s, i) => s + i.count, 0);
  const journal = items.filter((i) => i.source === 'journal').reduce((s, i) => s + i.count, 0);
  const log = items
    .filter((i) => i.source === 'decision_log' || i.source === 'checklist')
    .reduce((s, i) => s + i.count, 0);
  const academy = items
    .filter((i) => i.source === 'academy' || i.source === 'lab')
    .reduce((s, i) => s + i.count, 0);
  const bullets: string[] = [];
  if (replay > 0) bullets.push(`${replay} replay decision${replay === 1 ? '' : 's'}`);
  if (log > 0) bullets.push(`${log} decision-log event${log === 1 ? '' : 's'}`);
  if (journal > 0) {
    bullets.push(`${journal} journal process ${journal === 1 ? 'entry' : 'entries'}`);
  }
  if (academy > 0) bullets.push(`${academy} practice event${academy === 1 ? '' : 's'}`);
  return bullets;
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
