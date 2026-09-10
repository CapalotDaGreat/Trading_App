import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import { resolveCompetencyId } from '@/features/competency/services/taxonomy.service';
import { ALL_LESSONS } from '../../content';
import {
  PRIMARY_LESSON_BY_CONCEPT,
  PRIORITY_CURRICULUM_CONCEPTS,
  buildCurriculumCoverageMatrix,
  getNominalConceptIds,
  getPriorityCoverageRows,
} from '../curriculum-coverage.service';

describe('curriculum coverage matrix', () => {
  const matrix = buildCurriculumCoverageMatrix();
  const byId = new Map(matrix.map((row) => [row.conceptId, row]));

  it('resolves legacy lesson ids onto canonical taxonomy ids', () => {
    expect(resolveCompetencyId('volatility')).toBe('volatility-aware-risk');
    expect(resolveCompetencyId('revenge')).toBe('revenge-trading');
    expect(resolveCompetencyId('assumptions')).toBe('thesis');
    expect(resolveCompetencyId('scenarios')).toBe('scenario-thinking');
    expect(resolveCompetencyId('probabilities')).toBe('uncertainty');
    expect(resolveCompetencyId('exposure')).toBe('concentration-risk');
    expect(resolveCompetencyId('stops')).toBe('invalidation');
  });

  it('closes the Learn → Practice → Replay → Simulate loop for priority concepts', () => {
    const rows = getPriorityCoverageRows();
    expect(rows).toHaveLength(PRIORITY_CURRICULUM_CONCEPTS.length);
    for (const row of rows) {
      expect(row.missingFlagshipFields).toEqual([]);
      expect(row.status).toBe('closed_loop');
      expect(row.graphNode).toBe(true);
      expect(row.lessonIds.length).toBeGreaterThan(0);
      expect(row.drillIds.length).toBeGreaterThan(0);
      expect(row.replayIds.length).toBeGreaterThan(0);
      expect(row.hasSimulation).toBe(true);
    }
  });

  it('points each priority concept at a real primary lesson that exists', () => {
    const lessonIds = new Set(ALL_LESSONS.map((lesson) => lesson.id));
    const drillIds = new Set(PRACTICE_DRILLS.map((drill) => drill.id));
    for (const conceptId of PRIORITY_CURRICULUM_CONCEPTS) {
      const primary = PRIMARY_LESSON_BY_CONCEPT[conceptId];
      expect(lessonIds.has(primary)).toBe(true);
      const row = byId.get(conceptId);
      expect(row?.lessonIds).toContain(primary);
      for (const drillId of row?.drillIds ?? []) {
        expect(drillIds.has(drillId)).toBe(true);
      }
    }
  });

  it('keeps educational copy from becoming a personalized recommendation', () => {
    const banned = /\b(buy this|sell this|short this|buy now|sell now|guaranteed (return|profit)|price target)\b/i;
    for (const conceptId of PRIORITY_CURRICULUM_CONCEPTS) {
      const lesson = ALL_LESSONS.find((item) => item.id === PRIMARY_LESSON_BY_CONCEPT[conceptId]);
      const blob = [
        lesson?.whyItMatters,
        ...(lesson?.keyTakeaways ?? []),
        ...(lesson?.quiz ?? []).map((question) => question.choices[question.correctIndex] ?? ''),
      ].join('\n');
      expect(banned.test(blob)).toBe(false);
    }
  });

  it('reports remaining nominal taxonomy ids instead of inventing filler lessons', () => {
    const nominal = getNominalConceptIds();
    expect(nominal).toEqual(
      expect.arrayContaining([
        'anchoring',
        'alternative-explanations',
        'avoiding-hindsight',
        'employment',
        'geopolitical',
        'commodity-shocks',
        'information-timing',
        'identifying-mistakes',
        'identifying-strengths',
        'extracting-lessons',
        'adapting-decisions',
      ]),
    );
    for (const id of PRIORITY_CURRICULUM_CONCEPTS) {
      expect(nominal).not.toContain(id);
    }
  });
});
