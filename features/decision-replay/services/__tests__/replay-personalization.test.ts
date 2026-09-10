import { createEvidenceRecord, scoreAllCompetencyMastery } from '@/features/competency';
import type {
  CompetencyEvidenceInput,
  CompetencyEvidenceRecord,
  CompetencyMastery,
} from '@/features/competency';
import { REPLAY_TV_EPISODES } from '@/features/decision-replay-tv/content/replay-tv.catalog';
import { catalogEntryForReplayEpisode, rankReplayTvEpisodes } from '@/features/decision-replay-tv/services/replay-tv-rank.service';

import {
  GENERIC_REPLAY_TRAINING_RATIONALE,
  personalizeReplayTraining,
  scoreReplayCatalogMatch,
  type ReplayCatalogEntry,
} from '../replay-personalization.service';
import { REPLAY_CORE_QUESTION } from '../../types/replay-scenario.types';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');

function ev(
  partial: Partial<CompetencyEvidenceInput> &
    Pick<CompetencyEvidenceInput, 'uid' | 'conceptId' | 'sourceType' | 'sourceId'>,
): CompetencyEvidenceRecord {
  return createEvidenceRecord({
    occurredAt: NOW,
    independent: true,
    hintsUsed: false,
    result: 'fail',
    ...partial,
  });
}

function mastery(partial: Pick<CompetencyMastery, 'conceptId' | 'competenceState' | 'state'> & Partial<CompetencyMastery>): CompetencyMastery {
  return {
    title: partial.conceptId,
    family: null,
    userLabel: 'Developing',
    strength: 40,
    quality: {
      knowledge: null,
      application: null,
      independence: null,
      consistency: null,
      difficulty: null,
      recency: null,
      variety: null,
    },
    transfer: {
      contexts: [],
      assetClasses: [],
      formats: [],
      mixedConceptSourceIds: [],
      applicationCount: 0,
      proven: false,
    },
    falseMastery: false,
    explanations: [],
    demonstrationCount: 1,
    independentDemonstrationCount: 1,
    contextCount: 1,
    recipeMet: false,
    missingRoles: [],
    previouslyDemonstrated: false,
    lastEvidenceAt: NOW,
    lastIndependentSuccessAt: NOW,
    nextRedemonstrationAt: null,
    remediation: null,
    nextDemonstration: null,
    disclaimer: 'Educational process label only.',
    ...partial,
  };
}

const catalog: ReplayCatalogEntry[] = REPLAY_TV_EPISODES.map(catalogEntryForReplayEpisode);

describe('replay personalization', () => {
  it('maps repeated FOMO flags to psychology / recurring-mistake practice without naming a trade', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'fomo',
        sourceType: 'replay_decision',
        sourceId: 'r1',
        processMetrics: { processQuality: 28, flags: { fomoEntry: true } },
      }),
      ev({
        uid: 'learner',
        conceptId: 'fomo',
        sourceType: 'replay_decision',
        sourceId: 'r2',
        occurredAt: NOW + 1,
        processMetrics: { processQuality: 30, flags: { fomoEntry: true } },
      }),
    ];
    const plan = personalizeReplayTraining({
      records,
      mastery: scoreAllCompetencyMastery(records, NOW),
      catalog,
    });
    expect(['recurring_mistake', 'psychology']).toContain(plan.intent);
    expect(plan.personalized).toBe(true);
    expect(plan.preferredCollections).toEqual(expect.arrayContaining(['psychology']));
    expect(plan.trainingRationale).toBe(GENERIC_REPLAY_TRAINING_RATIONALE);
    expect(plan.coreQuestion).toBe(REPLAY_CORE_QUESTION);
    expect(plan.trainingRationale?.toLowerCase()).not.toMatch(/fomo|buy this|sell this|correct trade|winner/);
  });

  it('maps weak invalidation to a competency-practice context', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'invalidation',
        sourceType: 'replay_decision',
        sourceId: 'i1',
        processMetrics: { processQuality: 32, flags: { missingInvalidation: true } },
      }),
    ];
    const plan = personalizeReplayTraining({
      records,
      mastery: [mastery({ conceptId: 'invalidation', competenceState: 'needs_revisit', state: 'needs_remediation' })],
      catalog,
    });
    expect(plan.intent).toBe('weak_competency');
    expect(plan.preferredConceptIds).toEqual(expect.arrayContaining(['invalidation']));
  });

  it('maps event-risk gaps to event-awareness rooms', () => {
    const records = [
      ev({
        uid: 'learner',
        conceptId: 'event-risk',
        sourceType: 'event_exercise',
        sourceId: 'e1',
        scenarioContext: 'earnings',
        processMetrics: { processQuality: 30 },
      }),
      ev({
        uid: 'learner',
        conceptId: 'event-risk',
        sourceType: 'replay_decision',
        sourceId: 'e2',
        occurredAt: NOW + 1,
        scenarioContext: 'earnings',
        processMetrics: { processQuality: 28 },
      }),
    ];
    const plan = personalizeReplayTraining({
      records,
      mastery: [mastery({ conceptId: 'event-risk', competenceState: 'needs_revisit', state: 'needs_remediation' })],
      catalog,
    });
    expect(plan.intent).toBe('event_awareness');
    expect(plan.preferredEventKinds).toEqual(expect.arrayContaining(['earnings']));
    expect(plan.preferredDifficulty).toBe('intermediate');
  });

  it('maps unproven transfer to mixed independent rooms', () => {
    const plan = personalizeReplayTraining({
      records: [],
      mastery: [mastery({ conceptId: 'invalidation', competenceState: 'transfer_unproven', state: 'demonstrated' })],
      catalog,
    });
    expect(plan.intent).toBe('transfer');
    expect(plan.preferredDifficulty).toBe('mixed');
  });

  it('maps due retention to advanced rooms', () => {
    const plan = personalizeReplayTraining({
      records: [],
      mastery: [
        mastery({
          conceptId: 'event-risk',
          competenceState: 'demonstrated',
          state: 'due_for_redemonstration',
          previouslyDemonstrated: true,
          nextRedemonstrationAt: NOW - 1,
        }),
      ],
      catalog,
    });
    expect(plan.intent).toBe('retention');
    expect(plan.preferredDifficulty).toBe('advanced');
    expect(plan.preferredConceptIds).toEqual(expect.arrayContaining(['event-risk']));
  });

  it('maps overconfidence to psychology without rigging a historical winner', () => {
    const plan = personalizeReplayTraining({
      records: [
        ev({
          uid: 'learner',
          conceptId: 'overconfidence',
          sourceType: 'practice_drill',
          sourceId: 'o1',
          processMetrics: { processQuality: 34 },
        }),
      ],
      mastery: [mastery({ conceptId: 'overconfidence', competenceState: 'needs_revisit', state: 'needs_remediation' })],
      catalog,
    });
    expect(plan.intent).toBe('psychology');
    expect(plan.preferredEpisodeId).toBeTruthy();
    const chosen = catalog.find((item) => item.id === plan.preferredEpisodeId);
    expect(chosen?.collections.some((id) => id === 'psychology' || id === 'patience' || id === 'manias')).toBe(true);
  });

  it('maps regime gaps onto regime-change collections', () => {
    const plan = personalizeReplayTraining({
      records: [],
      mastery: [
        mastery({ conceptId: 'trend-identification', competenceState: 'needs_revisit', state: 'needs_remediation' }),
      ],
      catalog,
    });
    expect(plan.intent).toBe('regime_gap');
    expect(plan.preferredCollections).toEqual(expect.arrayContaining(['regime_changes']));
  });

  it('does not personalize when there is no learner gap', () => {
    const plan = personalizeReplayTraining({ records: [], mastery: [], catalog });
    expect(plan.personalized).toBe(false);
    expect(plan.preferredEpisodeId).toBeUndefined();
    expect(plan.trainingRationale).toBeUndefined();
    expect(plan.coreQuestion).toBe(REPLAY_CORE_QUESTION);
  });

  it('scores catalog matches and ranking boosts without dropping the library', () => {
    const plan = personalizeReplayTraining({
      records: [],
      mastery: [mastery({ conceptId: 'event-risk', competenceState: 'needs_revisit', state: 'needs_remediation' })],
      catalog,
    });
    expect(plan.intent).toBe('event_awareness');
    const earnings = catalog.find((item) => item.collections.includes('earnings'))!;
    const unrelated = catalog.find((item) => !item.collections.includes('earnings') && item.eventKind !== 'earnings')!;
    expect(scoreReplayCatalogMatch(earnings, plan)).toBeGreaterThan(scoreReplayCatalogMatch(unrelated, plan));

    const ranked = rankReplayTvEpisodes(REPLAY_TV_EPISODES, { trainingPlan: plan });
    expect(ranked).toHaveLength(REPLAY_TV_EPISODES.length);
    expect(
      ranked[0]?.collectionIds.some((id) => id === 'earnings' || id === 'policy' || id === 'employment') ||
        ranked[0]?.eventKind === 'earnings' ||
        ranked[0]?.eventKind === 'rate_decision' ||
        ranked[0]?.eventKind === 'employment' ||
        ranked[0]?.eventKind === 'inflation',
    ).toBe(true);
  });
});
