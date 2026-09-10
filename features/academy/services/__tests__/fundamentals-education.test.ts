import { ALL_LESSONS } from '../../content';
import { LEARNING_PATHS } from '../../content/paths-and-checklists';
import {
  IMPORTANT_FUNDAMENTAL_CONCEPTS,
  auditFundamentalConceptProgression,
  auditFundamentalsEducation,
  fundamentalAnalysisLessons,
  fundamentalExerciseEvidenceType,
} from '../fundamentals-education.service';
import {
  ingestKnowledgeCheck,
  ingestLessonCompletion,
  ingestLessonExercise,
  ingestPracticeAttempt,
  recipeFor,
  resolveCompetencyId,
  scoreCompetencyMastery,
  useCompetencyEvidenceStore,
} from '@/features/competency';

const NOW = Date.parse('2026-09-10T16:00:00.000Z');

describe('fundamental analysis education audit', () => {
  const audit = auditFundamentalsEducation();

  it('publishes every fundamental lesson with application, drills, sim, replay, and prerequisites', () => {
    const ids = fundamentalAnalysisLessons().map((lesson) => lesson.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'fund-basics',
        'fund-calendar',
        'fund-statements',
        'fund-valuation-quality',
        'fund-economy',
      ]),
    );
    expect(ids).toHaveLength(5);
    expect(audit.lessons.every((item) => item.missing.length === 0)).toBe(true);
    expect(audit.ok).toBe(true);
  });

  it('keeps the research path in prerequisite order', () => {
    const path = LEARNING_PATHS.find((item) => item.id === 'path-beyond-charts');
    expect(path?.lessonIds.slice(0, 5)).toEqual([
      'fund-basics',
      'fund-calendar',
      'fund-statements',
      'fund-valuation-quality',
      'fund-economy',
    ]);
  });

  it('resolves profitability, margins, cash flow, and moat onto existing taxonomy ids', () => {
    expect(resolveCompetencyId('profitability')).toBe('earnings');
    expect(resolveCompetencyId('margins')).toBe('earnings');
    expect(resolveCompetencyId('cash-flow')).toBe('earnings');
    expect(resolveCompetencyId('fcf')).toBe('earnings');
    expect(resolveCompetencyId('moat')).toBe('competitive-position');
    expect(resolveCompetencyId('quality')).toBe('business-quality');
    expect(resolveCompetencyId('revenue')).toBe('revenue-growth');
  });

  it('maps multiple-choice lesson items to knowledge and applied kinds to application', () => {
    expect(fundamentalExerciseEvidenceType('select')).toBe('knowledge_check');
    expect(fundamentalExerciseEvidenceType('choose')).toBe('knowledge_check');
    expect(fundamentalExerciseEvidenceType('scenario')).toBe('applied_exercise');
    expect(fundamentalExerciseEvidenceType('compare')).toBe('applied_exercise');
    expect(fundamentalExerciseEvidenceType('explain')).toBe('applied_exercise');
  });

  it('requires the eight-step progression for each important fundamental concept', () => {
    for (const conceptId of IMPORTANT_FUNDAMENTAL_CONCEPTS) {
      const row = auditFundamentalConceptProgression(conceptId);
      expect(row.missing).toEqual([]);
      expect(row.lessonIds.length).toBeGreaterThan(0);
      expect(row.drillIds.length).toBeGreaterThan(0);
      expect(row.recipeRequiresApplication).toBe(true);
    }
  });

  it('does not treat quiz or lesson completion as demonstration for earnings', () => {
    const recipe = recipeFor('earnings');
    expect(recipe.requirements.some((item) => item.role === 'application')).toBe(true);
    expect(recipe.concealOnRetest).toBe(true);

    const rows = ingestAndCollect('quiz-user', () => {
      ingestLessonCompletion('quiz-user', 'fund-statements', NOW);
      ingestKnowledgeCheck('quiz-user', 'fund-statements', 'earnings', true, NOW + 1);
      ingestLessonExercise('quiz-user', 'fund-statements', 'earnings', true, NOW + 2, {
        kind: 'select',
        exerciseId: 'ex-fs-earnings-recognize',
      });
    });
    const mastery = scoreCompetencyMastery('earnings', rows, NOW + 3);
    expect(mastery.state).not.toBe('demonstrated');
    expect(mastery.missingRoles).toEqual(expect.arrayContaining(['application']));
  });

  it('scopes applied exercise evidence to the exercise concept and a unique source id', () => {
    useCompetencyEvidenceStore.getState().resetAll();
    ingestLessonExercise('alice', 'fund-statements', 'earnings', true, NOW, {
      kind: 'scenario',
      exerciseId: 'ex-fs-margins',
      helpLevel: 'example',
    });
    ingestLessonExercise('alice', 'fund-statements', 'balance-sheet', true, NOW + 1, {
      kind: 'scenario',
      exerciseId: 'ex-fs-balance',
    });
    const rows = useCompetencyEvidenceStore.getState().evidenceFor('alice');
    expect(rows.every((item) => item.conceptId === 'earnings' || item.conceptId === 'balance-sheet')).toBe(true);
    expect(rows.some((item) => item.sourceId === 'fund-statements:exercise:ex-fs-margins')).toBe(true);
    expect(rows.some((item) => item.sourceId === 'fund-statements:exercise:ex-fs-balance')).toBe(true);
    expect(rows.find((item) => item.sourceId.endsWith('ex-fs-margins'))?.evidenceLayer).toBe('guided_application');
    expect(rows.find((item) => item.sourceId.endsWith('ex-fs-balance'))?.evidenceLayer).toBe(
      'independent_application',
    );
  });

  it('can demonstrate earnings from independent application plus practice, not from MCQ alone', () => {
    useCompetencyEvidenceStore.getState().resetAll();
    ingestKnowledgeCheck('pat', 'fund-statements', 'earnings', true, NOW);
    ingestPracticeAttempt('pat', 'changing-margins', true, NOW + 1);
    ingestLessonExercise('pat', 'fund-statements', 'earnings', true, NOW + 2, {
      kind: 'scenario',
      exerciseId: 'ex-fs-mixed',
      asTransfer: true,
      scenarioContext: 'earnings',
    });
    ingestLessonExercise('pat', 'fund-valuation-quality', 'earnings', true, NOW + 3, {
      kind: 'compare',
      exerciseId: 'ex-fs-compare',
      scenarioContext: 'ambiguous_setup',
    });
    const rows = useCompetencyEvidenceStore.getState().evidenceFor('pat', 'earnings');
    const mastery = scoreCompetencyMastery('earnings', rows, NOW + 4);
    expect(mastery.missingRoles).not.toContain('application');
    expect(mastery.state).toBe('demonstrated');
  });

  it('uses simplified educational companies and refuses recommendation copy in correct answers', () => {
    const text = fundamentalAnalysisLessons()
      .flatMap((lesson) => [
        ...(lesson.exercises ?? []).map((exercise) => exercise.situation ?? ''),
        ...lesson.keyTakeaways,
      ])
      .join('\n');
    expect(text).toMatch(/Cedar Retail|Harbor Components|Northline Utilities|BrightCanvas/);
    expect(text).toMatch(/not an investment recommendation|not a buy/i);
    for (const row of audit.lessons) {
      expect(row.recommendationHits).toEqual([]);
    }
  });

  it('keeps every FA lesson concept id on a published lesson object', () => {
    for (const lesson of ALL_LESSONS.filter((item) => item.category === 'fundamental_analysis')) {
      expect(lesson.exercises?.some((exercise) => exercise.kind === 'scenario' || exercise.kind === 'compare' || exercise.kind === 'explain')).toBe(
        true,
      );
      expect(lesson.conceptIds?.every((id) => resolveCompetencyId(id) === id)).toBe(true);
    }
  });
});

function ingestAndCollect(uid: string, run: () => void) {
  useCompetencyEvidenceStore.getState().resetAll();
  run();
  return useCompetencyEvidenceStore.getState().evidenceFor(uid);
}
