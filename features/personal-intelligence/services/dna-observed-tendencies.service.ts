import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import type {
  DnaJournalEvidence,
  DnaObservedTendency,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';
import {
  buildEvidenceBundle,
  collectEvidence,
  evidenceItem,
  formatWhySummary,
} from './dna-evidence.service';
import { getTraitScore } from './trading-dna-traits.service';

function emptyMemory(now: number) {
  return {
    favoriteAssets: [] as string[],
    tradingStyle: '',
    riskTolerance: 'moderate' as const,
    avgHoldHint: '',
    typicalMistakes: [] as string[],
    favoriteIndicators: [] as string[],
    bestSetups: [] as string[],
    weakestSetups: [] as string[],
    notes: [] as string[],
    updatedAt: now,
  };
}

/**
 * Observed tendencies — not diagnoses, not personality labels.
 */
export function buildObservedTendencies(input: {
  records: DecisionRecord[];
  dna: TradingDnaProfile;
  journalEvidence?: DnaJournalEvidence[] | null;
  nowMs?: number;
}): DnaObservedTendency[] {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const b = buildEvidenceBundle({
    records: input.records,
    memory: emptyMemory(now),
    journalEvidence: input.journalEvidence,
    sinceMs: weekAgo,
    windowMs: 7 * 86_400_000,
  });

  const efficiency = getTraitScore(input.dna, 'researchEfficiency');
  const patience = getTraitScore(input.dna, 'patience');

  const overAnalysisEvidence = collectEvidence(
    evidenceItem('decision_log', b.researched, 'research sessions'),
    evidenceItem('journal', b.journaled, 'closed journal loops', '/journal'),
    evidenceItem('decision_log', b.skipped, 'skips'),
  );
  let overLevel: DnaObservedTendency['level'] = 'not_observed';
  if (b.researched >= 6 && b.journaled <= 1) overLevel = 'clear';
  else if (b.researched >= 4 && b.journaled < b.researched * 0.4 && (efficiency == null || efficiency < 55)) {
    overLevel = 'mild';
  }

  const confirmEvidence = collectEvidence(
    evidenceItem('decision_log', b.skipped, 'skips'),
    evidenceItem('replay', b.replay, 'replay sessions', '/decision/replay-tv'),
    evidenceItem('checklist', b.checklist, 'checklists'),
    evidenceItem('decision_log', b.researched, 'research sessions'),
  );
  let confirmLevel: DnaObservedTendency['level'] = 'not_observed';
  if (b.skipped + b.replay >= 4 && b.journaled === 0 && b.researched >= 2) confirmLevel = 'clear';
  else if (b.skipped >= 3 && b.researched >= 2 && (patience ?? 50) >= 55 && b.invalidated === 0) {
    confirmLevel = 'mild';
  }

  const dqsNow = b.avgDqs;
  const older = buildEvidenceBundle({
    records: input.records,
    memory: emptyMemory(now),
    journalEvidence: input.journalEvidence,
    sinceMs: now - 14 * 86_400_000,
    windowMs: 14 * 86_400_000,
  });
  const fatigueEvidence = collectEvidence(
    evidenceItem('decision_log', b.researched, 'research sessions this week'),
    evidenceItem('journal', b.journaled, 'journal process entries', '/journal'),
  );
  let fatigueLevel: DnaObservedTendency['level'] = 'not_observed';
  if (b.researched >= 7 && b.journaled <= 1 && (dqsNow == null || dqsNow < 55)) fatigueLevel = 'clear';
  else if (b.researched >= 5 && b.journaled < 2 && older.researched >= 4) fatigueLevel = 'mild';

  return [
    {
      id: 'over_analysis',
      label: 'Over-analysis',
      level: overLevel,
      framing: 'Observed tendency',
      detail:
        overLevel === 'not_observed'
          ? 'No clear extra-research pattern in the recent window.'
          : 'Observed tendency: research opens outpaced closed loops — attention may be spreading.',
      whySummary: formatWhySummary(overAnalysisEvidence),
      evidence: overAnalysisEvidence,
    },
    {
      id: 'confirmation_seeking',
      label: 'Confirmation seeking',
      level: confirmLevel,
      framing: 'Observed tendency',
      detail:
        confirmLevel === 'not_observed'
          ? 'No clear extra-confirmation pattern in the recent window.'
          : 'Observed tendency: skips and practice are high relative to closed theses — waiting may be crowding a decision.',
      whySummary: formatWhySummary(confirmEvidence),
      evidence: confirmEvidence,
    },
    {
      id: 'decision_fatigue',
      label: 'Decision stamina',
      level: fatigueLevel,
      framing: 'Observed tendency',
      detail:
        fatigueLevel === 'not_observed'
          ? 'No clear volume-without-closure pattern in the recent window.'
          : 'Observed tendency: several research opens with fewer closed loops — a lighter research budget may help.',
      whySummary: formatWhySummary(fatigueEvidence),
      evidence: fatigueEvidence,
    },
  ];
}
