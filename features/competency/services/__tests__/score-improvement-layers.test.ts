import { createEvidenceRecord, evidenceFromLessonCompletion, ingestLessonCompletion, ingestPracticeAttempt, scoreAllCompetencyMastery, scoreCompetencyMastery, useCompetencyEvidenceStore } from '@/features/competency';
import { composeTrainingPlan } from '@/features/training-planner/services/training-planner.service';
import { buildLearningEvidence } from '@/features/learning-engine/services/learning-evidence.service';
import { remediationPlanFor, TRANSFER_CONTEXTS } from '@/features/competency/content/remediation-catalog';
import { weakestSkillDomainFromMastery } from '@/features/competency/services/skill-domain-from-mastery.service';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');

describe('evidence layers vs mastery', () => {
  beforeEach(() => {
    useCompetencyEvidenceStore.getState().resetAll();
  });

  it('records lesson completion as exposure, not independent mastery', () => {
    ingestLessonCompletion('layer-user', 'dec-invalidation', NOW);
    const records = useCompetencyEvidenceStore.getState().evidenceFor('layer-user');
    expect(records.some((row) => row.sourceType === 'lesson_completion')).toBe(true);
    const mastery = scoreCompetencyMastery(
      'invalidation',
      records.filter((row) => row.conceptId === 'invalidation' || row.conceptId === 'stop-logic'),
      NOW,
    );
    expect(mastery.competenceState).not.toBe('demonstrated');
    expect(mastery.competenceState).not.toBe('strong');
    expect(mastery.independentDemonstrationCount).toBe(0);
  });

  it('records practice as application evidence the planner can use', () => {
    ingestLessonCompletion('layer-user', 'risk-position-sizing', NOW - 1000);
    ingestPracticeAttempt('layer-user', 'position-size', true, NOW);
    const records = useCompetencyEvidenceStore.getState().evidenceFor('layer-user');
    expect(records.some((row) => row.sourceType === 'practice_drill' || row.sourceType === 'calculation_exercise')).toBe(
      true,
    );
    const plan = composeTrainingPlan({
      uid: 'layer-user',
      snapshot: buildLearningEvidence({
        now: NOW,
        lessonProgress: {},
        conceptResults: {},
        attempts: [{ drillId: 'position-size', at: new Date(NOW).toISOString(), correct: true, selectedIndex: 0 }],
        journal: [],
        replay: { completedEpisodeIds: [], bestProcessByEpisode: {} },
      }),
      options: {
        evidence: records,
        competency: scoreAllCompetencyMastery(records, NOW),
      },
    });
    expect(plan.primary).toBeTruthy();
    expect(plan.uid).toBe('layer-user');
  });
});

describe('named remediation and transfer contexts', () => {
  it('returns named plans for uncertainty, thesis, bias, events, and valuation', () => {
    expect(remediationPlanFor('uncertainty').steps[0]?.href).toContain('dec-uncertainty');
    expect(remediationPlanFor('thesis').steps.some((step) => step.href.includes('premature-entry'))).toBe(true);
    expect(remediationPlanFor('confirmation-bias').diagnosis).toMatch(/process pattern/i);
    expect(remediationPlanFor('overconfidence').steps.some((step) => step.sourceId === 'confidence-check')).toBe(true);
    expect(remediationPlanFor('event-risk').steps.some((step) => step.href.includes('simulate'))).toBe(true);
    expect(remediationPlanFor('earnings').steps.some((step) => step.href.includes('changing-margins'))).toBe(true);
    expect(remediationPlanFor('valuation').steps.some((step) => step.href.includes('valuation-uncertainty'))).toBe(
      true,
    );
    expect(remediationPlanFor('unknown-concept-xyz').conceptId).toBe('unknown-concept-xyz');
  });

  it('extends transfer beyond sizing, invalidation, and thesis', () => {
    expect(TRANSFER_CONTEXTS.uncertainty?.length).toBeGreaterThan(1);
    expect(TRANSFER_CONTEXTS['confirmation-bias']).toContain('ambiguous_setup');
    expect(TRANSFER_CONTEXTS.overconfidence).toBeTruthy();
    expect(TRANSFER_CONTEXTS['event-risk']).toContain('event_window');
    expect(TRANSFER_CONTEXTS.earnings).toContain('earnings');
    expect(TRANSFER_CONTEXTS.valuation).toBeTruthy();
  });

  it('derives a weakness domain from competency, not a second mastery engine', () => {
    const records = [
      createEvidenceRecord({
        uid: 'dom',
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'miss',
        occurredAt: NOW,
        result: 'fail',
        independent: true,
      }),
      createEvidenceRecord({
        uid: 'dom',
        conceptId: 'invalidation',
        sourceType: 'practice_drill',
        sourceId: 'miss-2',
        occurredAt: NOW + 1,
        result: 'fail',
        independent: true,
      }),
    ];
    const mastery = scoreAllCompetencyMastery(records, NOW + 1);
    expect(weakestSkillDomainFromMastery(mastery)).toBeTruthy();
  });
});

describe('lesson completion helper', () => {
  it('builds exposure-only evidence', () => {
    const rows = evidenceFromLessonCompletion({
      uid: 'a',
      sourceId: 'dec-thesis',
      conceptIds: ['thesis'],
      occurredAt: NOW,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.sourceType === 'lesson_completion')).toBe(true);
  });
});
