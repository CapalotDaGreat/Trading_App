import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';
import type { AiLearningMemory } from '@/features/ai/types/ai-trust.types';

import type {
  AiMemoryTimelineEvent,
  DnaEvolutionPoint,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';

/**
 * Learning journey timeline — composed from DNA, evolution, log milestones, and AI learning memory.
 */
export function buildAiMemoryTimeline(input: {
  dna: TradingDnaProfile;
  evolution: DnaEvolutionPoint[];
  records: DecisionRecord[];
  aiMemory?: AiLearningMemory | null;
  nowMs?: number;
}): AiMemoryTimelineEvent[] {
  const now = input.nowMs ?? Date.now();
  const events: AiMemoryTimelineEvent[] = [];
  const weekAgo = now - 7 * 86_400_000;
  const monthAgo = now - 30 * 86_400_000;

  const week = input.records.filter((r) => r.createdAt >= weekAgo);
  const month = input.records.filter((r) => r.createdAt >= monthAgo);
  const replayWeek = week.filter((r) => r.action === 'replay_completed').length;
  const replayMonth = month.filter((r) => r.action === 'replay_completed').length;
  const journalWeek = week.filter((r) => r.action === 'journaled').length;
  const researchedWeek = week.filter((r) => r.action === 'researched').length;
  const skippedWeek = week.filter((r) => r.action === 'skipped').length;

  const patience = input.dna.traits.find((t) => t.id === 'patience');
  if (patience && patience.status === 'scored' && (patience.trend === 'up' || (patience.score ?? 0) >= 60)) {
    events.push({
      id: 'patience-improved',
      at: now - 2 * 86_400_000,
      kind: 'patience',
      title: 'Patience is improving',
      detail: patience.detail,
      href: '/decision/intelligence',
    });
  }

  if (skippedWeek >= 2 || (researchedWeek > 0 && skippedWeek >= 1)) {
    events.push({
      id: 'impulse-reduced',
      at: now - 3 * 86_400_000,
      kind: 'discipline',
      title: 'More selective attention',
      detail: `${skippedWeek} deliberate skip${skippedWeek === 1 ? '' : 's'} this week protected attention.`,
      href: '/decision/mentor',
    });
  }

  if (replayWeek > 0 || replayMonth >= 2) {
    events.push({
      id: 'replay-up',
      at: now - 86_400_000,
      kind: 'replay',
      title: 'Replay practice increased',
      detail: `${Math.max(replayWeek, replayMonth)} reflection session${replayMonth === 1 ? '' : 's'} closed the learning loop.`,
      href: '/decision/decision-replay',
    });
  }

  const researchTrait = input.dna.traits.find((t) => t.id === 'researchEfficiency');
  if (
    researchTrait &&
    researchTrait.status === 'scored' &&
    ((researchTrait.score ?? 0) >= 55 || journalWeek > 0)
  ) {
    events.push({
      id: 'research-quality',
      at: now - 4 * 86_400_000,
      kind: 'research',
      title: 'Research quality improved',
      detail:
        journalWeek > 0
          ? 'Journaling after research is raising Decision Quality signal quality.'
          : researchTrait.detail,
      href: '/decision/radar',
    });
  }

  const evidenced = input.evolution.filter((point) => point.hasEvidence);
  if (evidenced.length >= 2) {
    const prev = evidenced[evidenced.length - 2];
    const tip = evidenced[evidenced.length - 1];
    if (prev && tip && prev.styleLabel !== tip.styleLabel) {
      events.push({
        id: `identity-${tip.monthKey}`,
        at: now - 10 * 86_400_000,
        kind: 'identity',
        title: `Identity shifted toward ${tip.styleLabel}`,
        detail: `From ${prev.styleLabel} → ${tip.styleLabel}. Who you are becoming is visible in your process.`,
        href: '/decision/intelligence',
      });
    }
  }

  if (input.aiMemory?.psychologyReminder) {
    events.push({
      id: 'ai-psych',
      at: input.aiMemory.updatedAt || now - 5 * 86_400_000,
      kind: 'learning',
      title: 'Coach memory refreshed',
      detail: input.aiMemory.psychologyReminder,
      href: '/decision/intelligence',
    });
  }

  if (input.aiMemory?.journalConsistencyHint) {
    events.push({
      id: 'ai-journal-hint',
      at: (input.aiMemory.updatedAt || now) - 86_400_000,
      kind: 'learning',
      title: 'Journal consistency signal',
      detail: input.aiMemory.journalConsistencyHint,
      href: '/journal',
    });
  }

  const risk = input.dna.traits.find((t) => t.id === 'riskAwareness');
  if (risk && risk.status === 'scored' && risk.trend === 'up') {
    events.push({
      id: 'risk-up',
      at: now - 6 * 86_400_000,
      kind: 'risk',
      title: 'Risk awareness habit strengthening',
      detail: risk.detail,
      href: '/decision/risk',
    });
  }

  if (events.length === 0) {
    events.push({
      id: 'journey-start',
      at: now,
      kind: 'learning',
      title: 'Your learning journey starts with one loop',
      detail:
        'Complete brief → research or skip → journal. Memory fills from real process, never invented P&L.',
      href: '/',
    });
  }

  return events.sort((a, b) => b.at - a.at).slice(0, 8);
}
