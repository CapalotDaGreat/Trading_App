import { createEvidenceRecord, scoreCompetencyMastery } from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';

import {
  adaptiveStageFor,
  consecutiveFailCount,
  nextTransferStep,
  pickSurpriseAssessment,
  selectAdaptivePractice,
  shouldOfferSurpriseAssessment,
  targetComplexityFor,
} from '../adaptive-difficulty.service';
import { scaffoldingFor as practiceScaffolding } from '../deliberate-practice.service';
import type { ConceptEvidenceSlice } from '../learning-evidence.service';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function ev(
  partial: Partial<CompetencyEvidenceInput> &
    Pick<CompetencyEvidenceInput, 'conceptId' | 'sourceType' | 'sourceId'>,
): CompetencyEvidenceRecord {
  return createEvidenceRecord({
    uid: 'user-a',
    occurredAt: NOW,
    independent: true,
    hintsUsed: false,
    ...partial,
  });
}

function scaffolding(stage: 'foundation' | 'application' | 'deliberate' = 'application') {
  return practiceScaffolding({ stage, experience: 'intermediate' });
}

describe('adaptive difficulty progression', () => {
  it('moves from guided recognition toward deliberate practice without padding copy', () => {
    const exposed = [
      ev({
        conceptId: 'support',
        sourceType: 'lesson_completion',
        sourceId: 'ta-structure',
        result: 'observed',
      }),
    ];
    expect(adaptiveStageFor(scoreCompetencyMastery('support', exposed, NOW), exposed)).toBe('guided_recognition');

    const guided = [
      ...exposed,
      ev({
        conceptId: 'support',
        sourceType: 'knowledge_check',
        sourceId: 'q1',
        result: 'pass',
        occurredAt: NOW - DAY,
      }),
      ev({
        conceptId: 'support',
        sourceType: 'practice_drill',
        sourceId: 'find-support',
        result: 'pass',
        independent: false,
        hintsUsed: true,
        helpLevel: 'example',
      }),
    ];
    expect(adaptiveStageFor(scoreCompetencyMastery('support', guided, NOW), guided)).toBe(
      'independent_application',
    );

    const independent = [
      ev({
        conceptId: 'support',
        sourceType: 'practice_drill',
        sourceId: 'find-support',
        result: 'pass',
        occurredAt: NOW - DAY,
      }),
      ev({
        conceptId: 'support',
        sourceType: 'replay_decision',
        sourceId: 'false-breakout-drill',
        result: 'pass',
        processMetrics: { processQuality: 78 },
      }),
    ];
    expect(nextTransferStep(independent)).toBe('new_condition');
    expect(adaptiveStageFor(scoreCompetencyMastery('support', independent, NOW), independent)).toBe(
      'unfamiliar_application',
    );
  });

  it('reduces hints after independent success and restores them after struggle', () => {
    const success = Array.from({ length: 3 }, (_, index) =>
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: `ok-${index}`,
        occurredAt: NOW - (3 - index) * DAY,
        processMetrics: { processQuality: 80 },
      }),
    );
    const faded = practiceScaffolding({
      stage: 'integration',
      experience: 'intermediate',
      recentRecords: success,
    });
    expect(faded.showHints).toBe(false);
    expect(faded.showExamples).toBe(false);
    expect(faded.incompleteInformation).toBe(true);

    const struggle = [
      ...success,
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'miss-1',
        occurredAt: NOW - 1000,
        result: 'fail',
        processMetrics: { processQuality: 30 },
      }),
      ev({
        conceptId: 'invalidation',
        sourceType: 'simulation_decision',
        sourceId: 'miss-2',
        occurredAt: NOW,
        result: 'fail',
        processMetrics: { processQuality: 28 },
      }),
    ];
    const supported = practiceScaffolding({
      stage: 'integration',
      experience: 'intermediate',
      recentRecords: struggle,
    });
    expect(supported.showHints).toBe(true);
    expect(supported.showExamples).toBe(true);
    expect(supported.concealConcept).toBe(false);
    expect(supported.timePressure).toBe('none');
  });
});

describe('identical high competence does not freeze content', () => {
  it('rotates the next activity across days even when mastery is unchanged', () => {
    const records = [
      ev({
        conceptId: 'position-sizing',
        sourceType: 'knowledge_check',
        sourceId: 'quiz',
        occurredAt: NOW - 5 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'calculation_exercise',
        sourceId: 'calc',
        occurredAt: NOW - 4 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'sim-trend',
        occurredAt: NOW - 3 * DAY,
        scenarioContext: 'trend',
        processMetrics: { processQuality: 82 },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'simulation_decision',
        sourceId: 'sim-vol',
        occurredAt: NOW - DAY,
        scenarioContext: 'high_volatility',
        processMetrics: { processQuality: 80 },
      }),
    ];
    const mastery = scoreCompetencyMastery('position-sizing', records, NOW);
    const first = selectAdaptivePractice({
      conceptId: 'position-sizing',
      records,
      mastery,
      experience: 'advanced',
      now: NOW,
      scaffolding: scaffolding('deliberate'),
    });
    const later = selectAdaptivePractice({
      conceptId: 'position-sizing',
      records,
      mastery,
      experience: 'advanced',
      now: NOW + 3 * DAY,
      recentActivityKeys: [first.href.split('&concept=')[0] ?? first.href],
      scaffolding: scaffolding('deliberate'),
    });
    expect(first.href).toBeTruthy();
    expect(later.href).toBeTruthy();
    expect(`${first.href}|${first.transferStep}`).not.toBe(`${later.href}|${later.transferStep}`);
  });
});

describe('weak performance does not loop the same prompt', () => {
  it('changes source after repeated fails and stays at a foundations floor', () => {
    const records = Array.from({ length: 5 }, (_, index) =>
      ev({
        conceptId: 'support',
        sourceType: 'practice_drill',
        sourceId: 'find-support',
        occurredAt: NOW - (5 - index) * 60_000,
        result: 'fail',
      }),
    );
    expect(consecutiveFailCount(records)).toBe(5);
    const mastery = scoreCompetencyMastery('support', records, NOW);
    const next = selectAdaptivePractice({
      conceptId: 'support',
      records,
      mastery,
      experience: 'beginner',
      now: NOW,
      scaffolding: scaffolding('foundation'),
    });
    expect(next.href).not.toContain('drill=find-support');
    expect(next.complexity).toBe('foundations');
    expect(next.showHints).toBe(true);
    expect(next.reason.toLowerCase()).toMatch(/still needs practice|different example/);
    expect(next.reason.toLowerCase()).not.toMatch(/punish|you are bad/);
  });
});

describe('surprise assessments', () => {
  it('are infrequent, concealed, and skipped after a fail', () => {
    const demonstrated = [
      scoreCompetencyMastery(
        'invalidation',
        [
          ev({ conceptId: 'invalidation', sourceType: 'knowledge_check', sourceId: 'q', result: 'pass' }),
          ev({
            conceptId: 'invalidation',
            sourceType: 'practice_drill',
            sourceId: 'd',
            result: 'pass',
          }),
          ev({
            conceptId: 'invalidation',
            sourceType: 'simulation_decision',
            sourceId: 's',
            processMetrics: { processQuality: 80 },
          }),
        ],
        NOW,
      ),
      scoreCompetencyMastery(
        'thesis',
        [
          ev({ conceptId: 'thesis', sourceType: 'knowledge_check', sourceId: 'q-t', result: 'pass' }),
          ev({
            conceptId: 'thesis',
            sourceType: 'simulation_decision',
            sourceId: 's-t',
            processMetrics: { processQuality: 81 },
          }),
        ],
        NOW,
      ),
    ];
    demonstrated.forEach((row) => {
      row.state = 'demonstrated';
      row.competenceState = 'demonstrated';
    });
    const offerDay = NOW + DAY;
    expect(
      shouldOfferSurpriseAssessment({
        mastery: demonstrated,
        records: [],
        now: offerDay,
        experience: 'intermediate',
      }),
    ).toBe(Math.floor(offerDay / DAY) % 4 === 1);
    const offer = pickSurpriseAssessment({ mastery: demonstrated, now: offerDay });
    expect(offer?.concealConcept).toBe(true);
    expect(offer?.reason.toLowerCase()).toMatch(/not a penalty/);
    expect(offer?.href).toContain('replay-tv');

    expect(
      shouldOfferSurpriseAssessment({
        mastery: demonstrated,
        records: [ev({ conceptId: 'invalidation', sourceType: 'practice_drill', sourceId: 'x', result: 'fail' })],
        now: offerDay,
        experience: 'intermediate',
      }),
    ).toBe(false);
  });
});

describe('legacy complexity helper', () => {
  it('still raises conceptual complexity after consistent drill success', () => {
    const slice = (partial: Partial<ConceptEvidenceSlice> & { conceptId: string }): ConceptEvidenceSlice => ({
      quizAttempts: 0,
      quizMisses: 0,
      drillAttempts: 0,
      drillMisses: 0,
      drillCorrectRecent: 0,
      drillRecentTotal: 0,
      replayCompletions: 0,
      replayBest: null,
      lessonRead: false,
      lastPracticedAt: null,
      lastSuccessAt: null,
      successCount: 0,
      ...partial,
    });
    expect(targetComplexityFor(slice({ conceptId: 'support', drillRecentTotal: 5, drillCorrectRecent: 5 }))).toBe(
      'complex',
    );
    expect(targetComplexityFor(slice({ conceptId: 'support', drillRecentTotal: 4, drillCorrectRecent: 1 }))).toBe(
      'foundations',
    );
  });
});
