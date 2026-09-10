import { createEvidenceRecord } from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';
import { DEMO_USER_UID } from '@/firebase/config';
import { composeLearnerModel, toAnalyticsSafeLearnerSummary } from '@/features/learner-model';
import { composeTrainingPlan } from '@/features/training-planner/services/training-planner.service';
import { buildLearningEvidence } from '@/features/learning-engine/services/learning-evidence.service';
import { scoreAllCompetencyMastery } from '@/features/competency';

import {
  composeMistakeLibrary,
  emptyMistakeLibrary,
  mistakeLibraryContainsJudgmentalLanguage,
  plannerScoreDeltaForMistakeLibrary,
  preferredPracticeDrillIds,
  simulationFocusFromMistakeLibrary,
  toAnalyticsSafeMistakeSummary,
} from '../mistake-library.service';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function ev(
  uid: string,
  partial: Partial<CompetencyEvidenceInput> &
    Pick<CompetencyEvidenceInput, 'conceptId' | 'sourceType' | 'sourceId'>,
): CompetencyEvidenceRecord {
  return createEvidenceRecord({
    uid,
    occurredAt: NOW,
    independent: true,
    hintsUsed: false,
    ...partial,
  });
}

describe('mistake library', () => {
  it('detects recurring chase entries from structured flags, not from prose', () => {
    const records = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd1',
        scenarioContext: 'trend',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd2',
        occurredAt: NOW + HOUR,
        scenarioContext: 'trend',
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + HOUR });
    const pattern = library.patterns.find((row) => row.patternId === 'fomo_chase');
    expect(pattern?.count).toBe(2);
    expect(pattern?.recentCount).toBe(2);
    expect(pattern?.contexts).toEqual(['trend']);
    expect(pattern?.affectedConcepts).toEqual(expect.arrayContaining(['fomo']));
    expect(pattern?.summary).toMatch(/shortly after missing a move/i);
    expect(pattern?.summary).toMatch(/Training focus: waiting for a defined thesis and invalidation/);
    expect(pattern?.summary.toLowerCase()).not.toMatch(/you are an emotional trader|diagnos|disorder/);
    expect(pattern?.recommendedTraining.some((row) => row.loop === 'practice')).toBe(true);
    expect(pattern?.recommendedTraining.some((row) => row.loop === 'simulation')).toBe(true);
    expect(pattern?.recommendedTraining.some((row) => row.loop === 'replay')).toBe(true);
    expect(mistakeLibraryContainsJudgmentalLanguage(library)).toBe(false);
  });

  it('does not invent patterns from journal body text', () => {
    const records = [
      ev('user-a', {
        conceptId: 'journaling',
        sourceType: 'journal_reflection',
        sourceId: 'j1',
        result: 'pass',
        journalSignals: {
          thesisPresent: true,
          thesisSpecificity: 'specific',
          invalidationPresent: true,
          riskConsidered: true,
          uncertaintyAcknowledged: true,
          reflectionCompleted: true,
        },
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW });
    expect(library.patterns.find((row) => row.patternId === 'fomo_chase')).toBeUndefined();
    expect(JSON.stringify(library)).not.toMatch(/I always panic and revenge trade/i);
  });

  it('detects premature entry, unclear thesis, invalidation, size, and skipped evidence', () => {
    const records = [
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'p1',
        scenarioContext: 'ambiguous_setup',
        processMetrics: {
          processQuality: 22,
          evidence: 20,
          confirmation: 30,
          flags: { missingThesis: true, missingInvalidation: true, missingEvidence: true, exceededRiskLimit: true },
        },
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'p2',
        occurredAt: NOW + HOUR,
        scenarioContext: 'range',
        processMetrics: {
          processQuality: 24,
          evidence: 18,
          confirmation: 28,
          flags: { missingThesis: true, missingInvalidation: true, missingEvidence: true, exceededRiskLimit: true },
        },
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + HOUR });
    const ids = library.patterns.map((row) => row.patternId);
    expect(ids).toEqual(
      expect.arrayContaining([
        'premature_entry',
        'unclear_thesis',
        'insufficient_invalidation',
        'oversized_position',
        'skipped_conflicting_evidence',
        'confirmation_seeking',
      ]),
    );
  });

  it('detects event-window neglect from event awareness metrics', () => {
    const records = [
      ev('user-a', {
        conceptId: 'event-risk',
        sourceType: 'simulation_decision',
        sourceId: 'e1',
        scenarioContext: 'earnings',
        result: 'fail',
        processMetrics: { eventAwareness: 20, flags: { missingEvidence: true } },
      }),
      ev('user-a', {
        conceptId: 'event-risk',
        sourceType: 'replay_decision',
        sourceId: 'e2',
        occurredAt: NOW + HOUR,
        scenarioContext: 'event_window',
        result: 'fail',
        processMetrics: { eventAwareness: 18 },
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + HOUR });
    expect(library.patterns.some((row) => row.patternId === 'event_risk_neglect')).toBe(true);
  });

  it('detects clustered decisions after a process miss without using simulated P/L', () => {
    const records = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'm1',
        result: 'fail',
        processMetrics: { processQuality: 30, flags: { fomoEntry: true }, simulatedPnl: -80, simulatedProfitable: false },
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'm2',
        occurredAt: NOW + 30 * 60 * 1000,
        result: 'fail',
        processMetrics: { processQuality: 40, simulatedPnl: 12, simulatedProfitable: true },
      }),
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'm3',
        occurredAt: NOW + 50 * 60 * 1000,
        result: 'fail',
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + 50 * 60 * 1000 });
    const cluster = library.patterns.find((row) => row.patternId === 'post_miss_cluster');
    expect(cluster?.count).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(cluster)).not.toMatch(/emotional trader|revenge addict/i);
  });

  it('detects high decision frequency and review gaps', () => {
    const records = Array.from({ length: 6 }, (_, index) =>
      ev('user-a', {
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: `burst-${index}`,
        occurredAt: NOW + index * 10 * 60 * 1000,
        result: 'observed',
      }),
    );
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + 6 * HOUR });
    expect(library.patterns.some((row) => row.patternId === 'high_decision_frequency')).toBe(true);
    expect(library.patterns.some((row) => row.patternId === 'review_gap')).toBe(true);
  });

  it('decays old observations so stale patterns drop in recommendation priority', () => {
    const stale = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'old-1',
        occurredAt: NOW - 40 * DAY,
        processMetrics: { flags: { fomoEntry: true } },
      }),
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'old-2',
        occurredAt: NOW - 39 * DAY,
        processMetrics: { flags: { fomoEntry: true } },
      }),
    ];
    const fresh = [
      ev('user-b', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'new-1',
        occurredAt: NOW - DAY,
        processMetrics: { flags: { fomoEntry: true } },
      }),
      ev('user-b', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'new-2',
        occurredAt: NOW,
        processMetrics: { flags: { fomoEntry: true } },
      }),
    ];
    const oldLib = composeMistakeLibrary({ uid: 'user-a', records: stale, now: NOW });
    const newLib = composeMistakeLibrary({ uid: 'user-b', records: fresh, now: NOW });
    const oldPattern = oldLib.patterns.find((row) => row.patternId === 'fomo_chase')!;
    const newPattern = newLib.patterns.find((row) => row.patternId === 'fomo_chase')!;
    expect(oldPattern.count).toBe(2);
    expect(newPattern.count).toBe(2);
    expect(oldPattern.recencyScore).toBeLessThan(newPattern.recencyScore);
    expect(oldPattern.recommendationPriority).not.toBe('high');
    expect(newPattern.recommendationPriority).toBe('high');
  });

  it('records improvement without erasing history and reduces recommendation priority', () => {
    const records = [
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'inv-1',
        occurredAt: NOW - 3 * DAY,
        scenarioContext: 'trend',
        result: 'fail',
        processMetrics: { flags: { missingInvalidation: true } },
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'inv-2',
        occurredAt: NOW - 2 * DAY,
        scenarioContext: 'trend',
        result: 'fail',
        processMetrics: { flags: { missingInvalidation: true } },
      }),
      ev('user-a', {
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'inv-clear',
        occurredAt: NOW,
        scenarioContext: 'high_volatility',
        result: 'pass',
        independent: true,
        processMetrics: { processQuality: 82, invalidation: 88, flags: { missingInvalidation: false } },
      }),
    ];
    const before = composeMistakeLibrary({ uid: 'user-a', records: records.slice(0, 2), now: NOW - 2 * DAY });
    const after = composeMistakeLibrary({ uid: 'user-a', records, now: NOW });
    const prior = before.patterns.find((row) => row.patternId === 'insufficient_invalidation')!;
    const next = after.patterns.find((row) => row.patternId === 'insufficient_invalidation')!;
    expect(next.count).toBe(prior.count);
    expect(next.observations).toHaveLength(2);
    expect(next.lastDemonstratedImprovement?.verifiedInNewContext).toBe(true);
    expect(next.improvementTrend).toBe('improving');
    expect(['low', 'watch']).toContain(next.recommendationPriority);
    expect(plannerScoreDeltaForMistakeLibrary({ href: '/simulate?start=1&focus=invalidation_discipline', conceptId: 'invalidation' }, after)).toBeLessThan(
      plannerScoreDeltaForMistakeLibrary({ href: '/simulate?start=1&focus=invalidation_discipline', conceptId: 'invalidation' }, before),
    );
  });

  it('isolates users and does not mix guest evidence', () => {
    const records = [
      ev('alice', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'a1',
        processMetrics: { flags: { fomoEntry: true } },
      }),
      ev('alice', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'a2',
        occurredAt: NOW + 1,
        processMetrics: { flags: { fomoEntry: true } },
      }),
      ev(DEMO_USER_UID, {
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'g1',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
      ev(DEMO_USER_UID, {
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'g2',
        occurredAt: NOW + 1,
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
    ];
    const alice = composeMistakeLibrary({ uid: 'alice', records, now: NOW + 1 });
    const guest = composeMistakeLibrary({ uid: DEMO_USER_UID, records, now: NOW + 1 });
    expect(alice.uid).toBe('alice');
    expect(guest.uid).toBe(DEMO_USER_UID);
    expect(alice.patterns.some((row) => row.patternId === 'fomo_chase')).toBe(true);
    expect(alice.patterns.some((row) => row.patternId === 'oversized_position')).toBe(false);
    expect(guest.patterns.some((row) => row.patternId === 'oversized_position')).toBe(true);
    expect(guest.patterns.some((row) => row.patternId === 'fomo_chase')).toBe(false);
  });

  it('does not export raw pattern labels to analytics', () => {
    const records = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd1',
        processMetrics: { flags: { fomoEntry: true } },
      }),
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd2',
        occurredAt: NOW + 1,
        processMetrics: { flags: { fomoEntry: true } },
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + 1 });
    const model = composeLearnerModel({ uid: 'user-a', records, now: NOW + 1 });
    const analytics = toAnalyticsSafeMistakeSummary(library);
    const learnerAnalytics = toAnalyticsSafeLearnerSummary(model);
    const blob = `${JSON.stringify(analytics)} ${JSON.stringify(learnerAnalytics)}`;
    expect(blob).not.toMatch(/fomo_chase|post_miss_cluster|revenge|overconfidence|confirmation_seeking/);
    expect(analytics).not.toHaveProperty('uid');
    expect(learnerAnalytics).not.toHaveProperty('uid');
    expect(analytics.surfacedPatternCount).toBeGreaterThan(0);
  });

  it('boosts matching planner training while improved patterns reduce priority', () => {
    const records = [
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd1',
        processMetrics: { flags: { fomoEntry: true } },
      }),
      ev('user-a', {
        conceptId: 'fomo',
        sourceType: 'simulation_decision',
        sourceId: 'd2',
        occurredAt: NOW + 1,
        processMetrics: { flags: { fomoEntry: true } },
      }),
    ];
    const library = composeMistakeLibrary({ uid: 'user-a', records, now: NOW + 1 });
    expect(
      plannerScoreDeltaForMistakeLibrary({ href: '/practice?drill=confirmation-bias', conceptId: 'fomo' }, library),
    ).toBeGreaterThan(0);
    expect(preferredPracticeDrillIds(library)).toContain('confirmation-bias');
    expect(simulationFocusFromMistakeLibrary(library)?.focus).toBe('fomo_chase');

    const snapshot = buildLearningEvidence({
      now: NOW + 1,
      lessonProgress: {},
      conceptResults: {},
      attempts: [],
      journal: [],
      replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
      experience: 'intermediate',
    });
    const withLibrary = composeTrainingPlan({
      uid: 'user-a',
      snapshot,
      learnerModel: composeLearnerModel({ uid: 'user-a', records, now: NOW + 1 }),
      options: { evidence: records, competency: scoreAllCompetencyMastery(records, NOW + 1) },
    });
    expect(withLibrary.whyPrimary.toLowerCase()).not.toMatch(/buy this|sell this|you are an emotional/);
    expect(withLibrary.queue.some((item) => item.reason.toLowerCase().includes('missing a move') || item.conceptId === 'fomo' || item.href.includes('practice'))).toBe(
      true,
    );
  });

  it('starts empty for a user with no evidence', () => {
    const library = emptyMistakeLibrary('user-a', NOW);
    expect(library.patterns).toEqual([]);
    expect(library.activePatternIds).toEqual([]);
  });
});
