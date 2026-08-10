import type { DecisionRecord } from '@/features/decision-log/services/decision-log.service';

import type {
  DnaBehaviourPattern,
  TradingDnaProfile,
} from '../types/personal-intelligence.types';
import {
  buildEvidenceBundle,
  collectEvidence,
  evidenceItem,
} from './dna-evidence.service';
import { getTraitScore } from './trading-dna-traits.service';

/**
 * Detect neutral coaching patterns. Never diagnoses psychological conditions.
 */
export function buildDnaPatterns(input: {
  records: DecisionRecord[];
  dna: TradingDnaProfile;
  nowMs?: number;
}): DnaBehaviourPattern[] {
  const now = input.nowMs ?? Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const b = buildEvidenceBundle({
    records: input.records,
    memory: {
      favoriteAssets: [],
      tradingStyle: '',
      riskTolerance: 'moderate',
      avgHoldHint: '',
      typicalMistakes: [],
      favoriteIndicators: [],
      bestSetups: [],
      weakestSetups: [],
      notes: [],
      updatedAt: now,
    },
    sinceMs: weekAgo,
    windowMs: 7 * 86_400_000,
  });

  const patterns: DnaBehaviourPattern[] = [];
  const patience = getTraitScore(input.dna, 'patience');
  const invalidation = getTraitScore(input.dna, 'invalidationDiscipline');
  const efficiency = getTraitScore(input.dna, 'researchEfficiency');
  const fomo = getTraitScore(input.dna, 'fomoResistance');
  const evidence = getTraitScore(input.dna, 'evidenceDiscipline');

  if (b.researched >= 4 && b.briefOpened + b.checklist < b.researched * 0.4) {
    patterns.push({
      id: 'research_too_quickly',
      title: 'Entering research too quickly',
      detail: 'Several research opens arrived before brief or checklist evidence caught up.',
      tone: 'growth',
      evidence: collectEvidence(
        evidenceItem('decision_log', b.researched, 'research sessions'),
        evidenceItem('checklist', b.checklist, 'checklists'),
      ),
    });
  }

  if (b.researched >= 3 && b.invalidated === 0 && (invalidation == null || invalidation < 55)) {
    patterns.push({
      id: 'ignoring_invalidation',
      title: 'Invalidation under-specified',
      detail: 'Research is active, but few cases record what would change your mind.',
      tone: 'growth',
      evidence: collectEvidence(
        evidenceItem('decision_log', b.researched, 'research sessions'),
        evidenceItem('decision_log', b.invalidated, 'invalidation marks'),
      ),
    });
  }

  if (b.researched >= 5 && (efficiency == null || efficiency < 50) && (b.avgRvs ?? 50) < 55) {
    patterns.push({
      id: 'over_research_low_value',
      title: 'Over-researching lower-value ideas',
      detail: 'Attention is spreading across many symbols with modest research value.',
      tone: 'growth',
      evidence: collectEvidence(evidenceItem('decision_log', b.researched, 'research sessions')),
    });
  }

  if (b.ignored >= 2 && b.skipped === 0 && (fomo == null || fomo < 55)) {
    patterns.push({
      id: 'repeated_fomo',
      title: 'Urgency without deliberate skips',
      detail: 'Ignored ideas without matching skip discipline can signal rushed attention.',
      tone: 'growth',
      evidence: collectEvidence(
        evidenceItem('decision_log', b.ignored, 'ignored ideas'),
        evidenceItem('decision_log', b.skipped, 'skips'),
      ),
    });
  }

  if (b.journaled >= 2 && /tilt|revenge|fomo|anxious|frustrated/i.test(
    input.records
      .filter((r) => r.action === 'journaled' && r.createdAt >= weekAgo)
      .map((r) => r.note ?? '')
      .join(' '),
  )) {
    patterns.push({
      id: 'emotional_reactivity',
      title: 'Emotional notes after decisions',
      detail: 'Journal language shows charged moments — awareness is useful; no diagnosis implied.',
      tone: 'neutral',
      evidence: collectEvidence(evidenceItem('journal', b.journaled, 'journal entries', '/journal')),
    });
  }

  if ((evidence ?? 0) >= 65 && b.checklist + b.journaled >= 3) {
    patterns.push({
      id: 'consistent_evidence',
      title: 'Consistent evidence gathering',
      detail: 'Checklist and journal loops are supporting clearer research cases.',
      tone: 'strength',
      evidence: collectEvidence(
        evidenceItem('checklist', b.checklist, 'checklists'),
        evidenceItem('journal', b.journaled, 'journals'),
      ),
    });
  }

  const patienceTrait = input.dna.traits.find((t) => t.id === 'patience');
  if (patienceTrait?.trend === 'up' || ((patience ?? 0) >= 60 && b.skipped >= 2)) {
    patterns.push({
      id: 'improving_patience',
      title: 'Improving patience',
      detail: 'Skips and waiting practice are showing up more often in your process.',
      tone: 'strength',
      evidence: collectEvidence(
        evidenceItem('decision_log', b.skipped, 'skips'),
        evidenceItem('replay', b.replay, 'replay sessions'),
      ),
    });
  }

  const invTrait = input.dna.traits.find((t) => t.id === 'invalidationDiscipline');
  if (invTrait?.trend === 'up' || b.invalidated >= 2) {
    patterns.push({
      id: 'improving_invalidation',
      title: 'Improving invalidation discipline',
      detail: 'You are naming what would change the case more often.',
      tone: 'strength',
      evidence: collectEvidence(
        evidenceItem('decision_log', b.invalidated, 'invalidation marks'),
        evidenceItem('replay', b.replay, 'replay practice'),
      ),
    });
  }

  if (b.skipped >= 3 && b.researched <= 1) {
    patterns.push({
      id: 'skipping_strong_setups',
      title: 'Very selective research week',
      detail: 'High skip rate can be healthy — confirm you are not avoiding strong cases.',
      tone: 'neutral',
      evidence: collectEvidence(
        evidenceItem('decision_log', b.skipped, 'skips'),
        evidenceItem('decision_log', b.researched, 'research sessions'),
      ),
    });
  }

  return patterns.slice(0, 6);
}
