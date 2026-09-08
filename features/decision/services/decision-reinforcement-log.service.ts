/**
 * Encode / parse Replay process evidence on the existing Decision Log note.
 *
 * Counts only — never thesis, evidence, invalidation text, journal bodies,
 * or free-text reasoning. Count keys are chosen so they are not substrings
 * of the boolean DNA needles (`rtv:wait`, `rtv:invalidation`, …).
 */

import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type {
  ReplayTvDecision,
  ReplayTvDecisionRecord,
} from '@/features/decision-replay-tv/types/replay-tv.types';

export interface ReplayProcessEvidenceCounts {
  checkpoints: number;
  waits: number;
  skips: number;
  researchMore: number;
  namedInvalidation: number;
  missingInvalidation: number;
  thesis: number;
  evidenceWrote: number;
  uncertaintyWrote: number;
  adaptability: number;
}

export const EMPTY_REPLAY_PROCESS_EVIDENCE: ReplayProcessEvidenceCounts = {
  checkpoints: 0,
  waits: 0,
  skips: 0,
  researchMore: 0,
  namedInvalidation: 0,
  missingInvalidation: 0,
  thesis: 0,
  evidenceWrote: 0,
  uncertaintyWrote: 0,
  adaptability: 0,
};

function isDecisionRecord(
  value: ReplayTvDecision | ReplayTvDecisionRecord,
): value is ReplayTvDecisionRecord {
  return typeof value === 'object' && value !== null && 'checkpointId' in value;
}

function hasText(value?: string): boolean {
  return Boolean(value && value.trim().length > 0);
}

function namedAtCheckpoint(record: ReplayTvDecisionRecord): boolean {
  return record.decision === 'mark_invalidation' || hasText(record.structured?.invalidation);
}

export function countReplayProcessEvidence(input: {
  decisions?: Array<ReplayTvDecision | ReplayTvDecisionRecord>;
  namedInvalidation?: boolean;
}): ReplayProcessEvidenceCounts {
  const counts: ReplayProcessEvidenceCounts = { ...EMPTY_REPLAY_PROCESS_EVIDENCE };
  const decisions = input.decisions ?? [];
  if (!decisions.length) {
    if (input.namedInvalidation) counts.namedInvalidation = 1;
    return counts;
  }

  for (const item of decisions) {
    if (isDecisionRecord(item)) {
      counts.checkpoints += 1;
      if (item.decision === 'wait') counts.waits += 1;
      if (item.decision === 'skip' || item.decision === 'protect_attention') counts.skips += 1;
      if (item.decision === 'research_more') counts.researchMore += 1;
      if (item.decision === 'mark_invalidation') counts.adaptability += 1;
      if (namedAtCheckpoint(item)) counts.namedInvalidation += 1;
      else if (item.decision === 'wait' || item.decision === 'research_more') {
        counts.missingInvalidation += 1;
      }
      if (hasText(item.structured?.thesis)) counts.thesis += 1;
      if (hasText(item.structured?.evidence)) counts.evidenceWrote += 1;
      if (hasText(item.structured?.mainUncertainty)) counts.uncertaintyWrote += 1;
      continue;
    }

    counts.checkpoints += 1;
    if (item === 'wait') counts.waits += 1;
    if (item === 'skip' || item === 'protect_attention') counts.skips += 1;
    if (item === 'research_more') counts.researchMore += 1;
    if (item === 'mark_invalidation') {
      counts.adaptability += 1;
      counts.namedInvalidation += 1;
    }
  }

  if (!decisions.some(isDecisionRecord)) {
    if (input.namedInvalidation) {
      counts.namedInvalidation = Math.max(counts.namedInvalidation, 1);
      counts.missingInvalidation = 0;
    } else if (counts.waits > 0 || counts.researchMore > 0) {
      counts.missingInvalidation = Math.max(
        counts.missingInvalidation,
        counts.waits + counts.researchMore,
      );
    }
  }

  return counts;
}

export function encodeReplayProcessEvidenceTags(counts: ReplayProcessEvidenceCounts): string[] {
  const tags: string[] = [];
  if (counts.checkpoints > 0) tags.push(`rtv:ckpt:${counts.checkpoints}`);
  if (counts.waits > 0) tags.push(`rtv:ckpt_wait:${counts.waits}`);
  if (counts.skips > 0) tags.push(`rtv:ckpt_skip:${counts.skips}`);
  if (counts.researchMore > 0) tags.push(`rtv:ckpt_more:${counts.researchMore}`);
  if (counts.namedInvalidation > 0) tags.push(`rtv:ckpt_named:${counts.namedInvalidation}`);
  if (counts.missingInvalidation > 0) tags.push(`rtv:ckpt_miss_inv:${counts.missingInvalidation}`);
  if (counts.thesis > 0) tags.push(`rtv:ckpt_thesis:${counts.thesis}`);
  if (counts.evidenceWrote > 0) tags.push(`rtv:ckpt_ev:${counts.evidenceWrote}`);
  if (counts.uncertaintyWrote > 0) tags.push(`rtv:ckpt_unc:${counts.uncertaintyWrote}`);
  if (counts.adaptability > 0) tags.push(`rtv:ckpt_adapt:${counts.adaptability}`);
  return tags;
}

function readTaggedCount(note: string, key: string): number {
  const match = note.match(new RegExp(`${key}:(\\d+)`));
  return match?.[1] ? Number(match[1]) || 0 : 0;
}

export function parseReplayProcessEvidence(note: string | null | undefined): ReplayProcessEvidenceCounts {
  if (!note) return { ...EMPTY_REPLAY_PROCESS_EVIDENCE };

  const checkpoints =
    readTaggedCount(note, 'rtv:ckpt') || (note.includes('Replay TV') || note.includes('rtv:') ? 1 : 0);
  const waits =
    readTaggedCount(note, 'rtv:ckpt_wait') || (note.includes('rtv:wait') ? 1 : 0);
  const namedInvalidation =
    readTaggedCount(note, 'rtv:ckpt_named') ||
    (note.includes('rtv:invalidation_named') || /\brtv:invalidation\b/.test(note) ? 1 : 0);
  let missingInvalidation = readTaggedCount(note, 'rtv:ckpt_miss_inv');
  if (!/rtv:ckpt_miss_inv:\d+/.test(note) && waits > 0 && namedInvalidation === 0) {
    missingInvalidation = waits;
  }

  return {
    checkpoints,
    waits,
    skips: readTaggedCount(note, 'rtv:ckpt_skip') || (note.includes('rtv:skip') ? 1 : 0),
    researchMore:
      readTaggedCount(note, 'rtv:ckpt_more') || (note.includes('rtv:research_more') ? 1 : 0),
    namedInvalidation,
    missingInvalidation,
    thesis: readTaggedCount(note, 'rtv:ckpt_thesis'),
    evidenceWrote: readTaggedCount(note, 'rtv:ckpt_ev'),
    uncertaintyWrote: readTaggedCount(note, 'rtv:ckpt_unc'),
    adaptability: readTaggedCount(note, 'rtv:ckpt_adapt'),
  };
}

export function aggregateReplayProcessEvidence(
  records: DecisionRecord[],
  sinceMs: number,
): ReplayProcessEvidenceCounts {
  const totals: ReplayProcessEvidenceCounts = { ...EMPTY_REPLAY_PROCESS_EVIDENCE };
  for (const record of records) {
    if (record.action !== 'replay_completed' || record.createdAt < sinceMs) continue;
    const parsed = parseReplayProcessEvidence(record.note);
    totals.checkpoints += parsed.checkpoints;
    totals.waits += parsed.waits;
    totals.skips += parsed.skips;
    totals.researchMore += parsed.researchMore;
    totals.namedInvalidation += parsed.namedInvalidation;
    totals.missingInvalidation += parsed.missingInvalidation;
    totals.thesis += parsed.thesis;
    totals.evidenceWrote += parsed.evidenceWrote;
    totals.uncertaintyWrote += parsed.uncertaintyWrote;
    totals.adaptability += parsed.adaptability;
  }
  return totals;
}

export function countReplayCompletedSessions(records: DecisionRecord[], sinceMs: number): number {
  return records.filter((item) => item.action === 'replay_completed' && item.createdAt >= sinceMs)
    .length;
}

export function latestReplayProcessEvidence(
  records: DecisionRecord[],
): { createdAt: number; counts: ReplayProcessEvidenceCounts } | null {
  const replay = records
    .filter((item) => item.action === 'replay_completed')
    .sort((a, b) => b.createdAt - a.createdAt)[0];
  if (!replay) return null;
  return { createdAt: replay.createdAt, counts: parseReplayProcessEvidence(replay.note) };
}

export function inferLastReplayDecisionFromLog(records: DecisionRecord[]): {
  decision: ReplayTvDecision;
  namedInvalidation: boolean;
  wroteReasoning: boolean;
} | null {
  const latest = latestReplayProcessEvidence(records);
  if (!latest) return null;
  const counts = latest.counts;
  if (
    counts.checkpoints === 0 &&
    counts.waits === 0 &&
    counts.skips === 0 &&
    counts.researchMore === 0 &&
    counts.namedInvalidation === 0
  ) {
    return null;
  }
  const decision: ReplayTvDecision = counts.waits
    ? 'wait'
    : counts.researchMore
      ? 'research_more'
      : counts.skips
        ? 'skip'
        : counts.adaptability
          ? 'mark_invalidation'
          : 'wait';
  return {
    decision,
    namedInvalidation: counts.missingInvalidation === 0 && counts.namedInvalidation > 0,
    wroteReasoning: counts.thesis > 0 || counts.evidenceWrote > 0,
  };
}

/** True when an earlier gap was later practiced (named invalidation, no remaining miss). */
export function invalidationGapWasPracticed(records: DecisionRecord[], sinceMs: number): boolean {
  const replay = records
    .filter((item) => item.action === 'replay_completed' && item.createdAt >= sinceMs)
    .sort((a, b) => a.createdAt - b.createdAt);
  if (replay.length < 2) return false;
  const priorGap = replay
    .slice(0, -1)
    .some((item) => parseReplayProcessEvidence(item.note).missingInvalidation > 0);
  const latest = parseReplayProcessEvidence(replay[replay.length - 1]?.note);
  return priorGap && latest.namedInvalidation > 0 && latest.missingInvalidation === 0;
}

export function latestReplayClosedInvalidationGap(records: DecisionRecord[]): boolean {
  const latest = latestReplayProcessEvidence(records);
  if (!latest) return false;
  return latest.counts.namedInvalidation > 0 && latest.counts.missingInvalidation === 0;
}
