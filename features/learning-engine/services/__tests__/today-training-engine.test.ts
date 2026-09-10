import { createEvidenceRecord, scoreAllCompetencyMastery, scoreCompetencyMastery } from '@/features/competency';
import type { CompetencyEvidenceInput, CompetencyEvidenceRecord } from '@/features/competency';

import { buildLearningEvidence } from '../learning-evidence.service';
import { activityKey, withConceptHandoff } from '../concept-handoff.service';
import { composeTodaysTraining, PRIORITY_RANK } from '../today-training-engine.service';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-10T12:00:00.000Z');

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

function emptySnapshot(
  extra: Partial<Parameters<typeof buildLearningEvidence>[0]> = {},
) {
  return buildLearningEvidence({
    now: NOW,
    lessonProgress: {},
    conceptResults: {},
    attempts: [],
    journal: [],
    replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
    ...extra,
  });
}

function sizingPath(at = NOW): CompetencyEvidenceRecord[] {
  return [
    ev({
      conceptId: 'position-sizing',
      sourceType: 'knowledge_check',
      sourceId: 'quiz',
      occurredAt: at - 5 * DAY,
      result: 'pass',
    }),
    ev({
      conceptId: 'position-sizing',
      sourceType: 'calculation_exercise',
      sourceId: 'calc',
      occurredAt: at - 4 * DAY,
      result: 'pass',
    }),
    ev({
      conceptId: 'position-sizing',
      sourceType: 'simulation_decision',
      sourceId: 'sim-trend',
      occurredAt: at - 3 * DAY,
      difficulty: 'complex',
      scenarioContext: 'trend',
      processMetrics: { processQuality: 82, simulatedProfitable: false, simulatedPnl: -30 },
    }),
    ev({
      conceptId: 'position-sizing',
      sourceType: 'simulation_decision',
      sourceId: 'sim-vol',
      occurredAt: at - DAY,
      difficulty: 'complex',
      scenarioContext: 'high_volatility',
      processMetrics: { processQuality: 80, simulatedProfitable: true, simulatedPnl: 40 },
    }),
  ];
}

function blob(plan: ReturnType<typeof composeTodaysTraining>): string {
  return `${plan.headline} ${plan.coachLine} ${plan.items.map((item) => `${item.title} ${item.whyToday} ${item.reason}`).join(' ')}`.toLowerCase();
}

describe('today training engine', () => {
  it('starts a new user with Foundations', () => {
    const plan = composeTodaysTraining(emptySnapshot({ experience: 'beginner' }));
    expect(plan.emptyState).toBe('new_user');
    expect(plan.headline).toBe('Start with Foundations.');
    expect(plan.items[0]?.href).toContain('path-foundations');
    expect(plan.items[0]?.priority).toBe('curriculum');
    expect(plan.items[0]?.whyToday).toMatch(/foundations/i);
    expect(blob(plan)).not.toMatch(/recommended for you/);
  });

  it('keeps beginners on foundations, charts, risk, invalidation, thesis, and psychology', () => {
    const evidence = [
      ev({
        conceptId: 'chart-interpretation',
        sourceType: 'lesson_completion',
        sourceId: 'ta-candles',
        result: 'observed',
      }),
    ];
    const plan = composeTodaysTraining(emptySnapshot({ experience: 'beginner' }), {}, { evidence });
    expect(plan.items[0]?.priority).toBe('in_progress');
    expect(plan.items[0]?.conceptId).toBe('chart-interpretation');
    expect(plan.items.some((item) => item.href.includes('gamestop') || item.kind === 'event_prep')).toBe(
      false,
    );
    expect(blob(plan)).not.toMatch(/study the scenario and make your decision|assess this situation and make your decision/);
  });

  it('recommends practice for a weak competency', () => {
    const evidence = [
      ev({
        conceptId: 'invalidation',
        sourceType: 'knowledge_check',
        sourceId: 'q1',
        occurredAt: NOW - DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'd1',
        occurredAt: NOW,
        result: 'fail',
      }),
    ];
    const mastery = scoreCompetencyMastery('invalidation', evidence, NOW);
    expect(mastery.state).toBe('practiced');
    const plan = composeTodaysTraining(
      emptySnapshot({ experience: 'intermediate' }),
      {},
      { evidence, competency: scoreAllCompetencyMastery(evidence, NOW) },
    );
    expect(plan.emptyState).toBe('weak_competency');
    expect(plan.headline).toBe('Practice your weakest area.');
    expect(plan.items[0]?.priority).toBe('weak_competency');
    expect(plan.items[0]?.conceptId).toBe('invalidation');
    expect(plan.items[0]?.whyToday).toMatch(/thin|practiced/i);
  });

  it('puts required remediation first and explains the process miss', () => {
    const evidence = [
      ...sizingPath(),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss',
        occurredAt: NOW,
        result: 'fail',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW + 1000,
        result: 'fail',
        processMetrics: { flags: { exceededRiskLimit: true } },
      }),
    ];
    const plan = composeTodaysTraining(
      emptySnapshot({ experience: 'intermediate', hasSimulation: true }),
      {},
      { evidence, competency: scoreAllCompetencyMastery(evidence, NOW + 1000) },
    );
    expect(plan.items[0]?.priority).toBe('remediation');
    expect(plan.items[0]?.loopStep).toBe('remediate');
    expect(plan.items[0]?.kind).toBe('remediation');
    expect(plan.items[0]?.whyToday).toMatch(/risk|sizing/i);
    expect(plan.items[0]?.whyToday).not.toMatch(/you are bad|good at trading/i);
    expect(blob(plan)).not.toMatch(/recommended for you/);
  });

  it('surfaces due re-demonstration with an explainable reason', () => {
    const evidence = sizingPath();
    const later = NOW + 40 * DAY;
    const plan = composeTodaysTraining(
      emptySnapshot({ now: later, experience: 'intermediate' }),
      {},
      { evidence, competency: scoreAllCompetencyMastery(evidence, later) },
    );
    expect(plan.items[0]?.priority).toBe('redemonstration');
    expect(plan.items[0]?.whyToday).toMatch(/due for re-demonstration/i);
    expect(plan.items[0]?.href).toMatch(/concept=position-sizing/);
  });

  it('keeps a repeatedly deferred competency in the queue with a non-manipulative note', () => {
    const evidence = [
      ev({
        conceptId: 'invalidation',
        sourceType: 'lesson_completion',
        sourceId: 'dec-invalidation',
        result: 'observed',
      }),
    ];
    const plan = composeTodaysTraining(
      emptySnapshot({ experience: 'beginner' }),
      { 'progress-invalidation': { deferCount: 2 } },
      { evidence, conceptDeferCounts: { invalidation: 2 } },
    );
    const lead = plan.items.find((item) => item.conceptId === 'invalidation') ?? plan.items[0];
    expect(lead?.whyToday).toMatch(/deferred this twice/i);
    expect(lead?.whyToday).toMatch(/keep it in your training queue/i);
    expect(lead?.whyToday).not.toMatch(/you must|locked out|cannot skip/i);
  });

  it('uses mixed, lower-hint copy for advanced users with strong evidence', () => {
    const evidence = [
      ...sizingPath(),
      ...['invalidation', 'thesis', 'support', 'fomo'].flatMap((conceptId, index) => [
        ev({
          conceptId,
          sourceType: 'knowledge_check',
          sourceId: `q-${conceptId}`,
          occurredAt: NOW - 6 * DAY,
          result: 'pass',
        }),
        ev({
          conceptId,
          sourceType: 'practice_drill',
          sourceId: `d-${conceptId}`,
          occurredAt: NOW - 5 * DAY,
          result: 'pass',
        }),
        ev({
          conceptId,
          sourceType: 'simulation_decision',
          sourceId: `s-${conceptId}`,
          occurredAt: NOW - (4 - index) * DAY,
          result: 'pass',
          processMetrics: { processQuality: 80 },
          scenarioContext: index % 2 === 0 ? 'trend' : 'range',
        }),
      ]),
    ];
    const plan = composeTodaysTraining(
      emptySnapshot({ experience: 'advanced' }),
      {},
      { evidence, competency: scoreAllCompetencyMastery(evidence, NOW) },
    );
    const mixed = plan.items.find((item) => item.concealConcept) ?? plan.items[0];
    expect(plan.emptyState === 'strong_mixed' || mixed?.concealConcept).toBeTruthy();
    expect(`${mixed?.title} ${mixed?.whyToday}`).toMatch(/assess this situation and make your decision/i);
    expect(`${mixed?.title} ${mixed?.whyToday}`).not.toMatch(/this is a position-sizing exercise/i);
  });

  it('does not use simulation P/L as the recommendation engine', () => {
    const processFail = [
      ev({
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'win-weak',
        result: 'fail',
        processMetrics: { processQuality: 20, simulatedProfitable: true, simulatedPnl: 400 },
      }),
      ev({
        conceptId: 'thesis',
        sourceType: 'simulation_decision',
        sourceId: 'win-weak-2',
        occurredAt: NOW + 1000,
        result: 'fail',
        processMetrics: { processQuality: 22, simulatedProfitable: true, simulatedPnl: 900 },
      }),
    ];
    const plan = composeTodaysTraining(
      emptySnapshot({
        experience: 'intermediate',
        hasSimulation: true,
        simulation: { gaps: [], composite: 95, decisionCount: 8 },
      }),
      {},
      { evidence: processFail, competency: scoreAllCompetencyMastery(processFail, NOW + 1000) },
    );
    expect(plan.items[0]?.priority).toBe('remediation');
    expect(blob(plan)).not.toMatch(/good at trading|you are a good trader|profit proves/i);
    expect(PRIORITY_RANK.remediation).toBeLessThan(PRIORITY_RANK.curriculum);
  });

  it('asks a user with simulation but no journal to review the last simulated decision', () => {
    const plan = composeTodaysTraining(
      emptySnapshot({
        experience: 'intermediate',
        hasSimulation: true,
        simulation: { gaps: ['thesis'], composite: 40, decisionCount: 1 },
      }),
    );
    expect(plan.emptyState).toBe('sim_no_journal');
    expect(plan.headline).toBe('Review your last simulated decision.');
    expect(plan.items[0]?.kind).toBe('journal_review');
    expect(plan.items[0]?.href).toMatch(/journal/);
  });

  it('still includes a simulation challenge when there is no simulation history', () => {
    const plan = composeTodaysTraining(emptySnapshot({ experience: 'beginner', hasSimulation: false }));
    expect(plan.items.some((item) => item.kind === 'simulation_challenge')).toBe(true);
    expect(plan.emptyState).not.toBe('sim_no_journal');
    expect(plan.items.find((item) => item.kind === 'simulation_challenge')?.whyToday).toMatch(
      /does not grade|process/i,
    );
  });

  it('resolves conflicting priorities with remediation over re-demonstration and curriculum', () => {
    const rem = [
      ...sizingPath(),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss',
        occurredAt: NOW,
        result: 'fail',
      }),
      ev({
        conceptId: 'position-sizing',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW + 1000,
        result: 'fail',
      }),
    ];
    const due = [
      ev({
        conceptId: 'event-risk',
        sourceType: 'knowledge_check',
        sourceId: 'eq',
        occurredAt: NOW - 50 * DAY,
        result: 'pass',
      }),
      ev({
        conceptId: 'event-risk',
        sourceType: 'simulation_decision',
        sourceId: 'es',
        occurredAt: NOW - 50 * DAY,
        result: 'pass',
        processMetrics: { processQuality: 80 },
      }),
    ];
    const learning = [
      ev({
        conceptId: 'thesis',
        sourceType: 'lesson_completion',
        sourceId: 'dec-thesis',
        result: 'observed',
      }),
    ];
    const evidence = [...rem, ...due, ...learning];
    const later = NOW + 1000;
    const plan = composeTodaysTraining(
      emptySnapshot({ now: later, experience: 'advanced', nextLessonId: 'dec-thesis' }),
      {},
      { evidence, competency: scoreAllCompetencyMastery(evidence, later) },
    );
    expect(plan.items[0]?.priority).toBe('remediation');
    expect(plan.items[0]?.conceptId).toBe('position-sizing');
    expect(plan.items.some((item) => item.priority === 'redemonstration' || item.priority === 'in_progress')).toBe(
      true,
    );
  });

  it('does not repeat the exact same exercise after it was just completed', () => {
    const evidence = [
      ev({
        conceptId: 'support',
        sourceType: 'lesson_completion',
        sourceId: 'ta-structure',
        result: 'observed',
      }),
    ];
    const first = composeTodaysTraining(
      emptySnapshot({ experience: 'beginner' }),
      {},
      { evidence, competency: scoreAllCompetencyMastery(evidence, NOW) },
    );
    const leadHref = first.items[0]?.href ?? '';
    const second = composeTodaysTraining(
      emptySnapshot({ experience: 'beginner' }),
      {},
      {
        evidence,
        competency: scoreAllCompetencyMastery(evidence, NOW),
        recentActivityKeys: [activityKey(leadHref)],
      },
    );
    expect(activityKey(second.items[0]!.href)).not.toBe(activityKey(leadHref));
    expect(second.items[0]?.conceptId).toBe(first.items[0]?.conceptId);
  });

  it('preserves concept context on generated hrefs', () => {
    const href = withConceptHandoff('/practice?drill=find-support', {
      conceptId: 'invalidation',
      loop: 'practice',
      conceal: false,
      priority: 'weak_competency',
    });
    expect(href).toContain('concept=invalidation');
    expect(href).toContain('loop=practice');
    expect(activityKey(href)).toBe('/practice?drill=find-support');
  });
});
