import { PRACTICE_DRILLS } from '../../content/practice-drills';
import {
  filterPracticeDrills,
  parsePracticeTopicParam,
  recommendPracticeDrill,
  type PracticeLibraryFilters,
} from '../practice-library.service';

const all: PracticeLibraryFilters = {
  topic: 'all',
  difficulty: 'all',
  time: 'all',
  completion: 'all',
};

describe('practice library', () => {
  it('filters by topic, difficulty, time, and completion', () => {
    const attempts = [{ drillId: 'identify-trend', at: '2026-01-01', correct: true, selectedIndex: 0 }];
    expect(filterPracticeDrills(PRACTICE_DRILLS, { ...all, topic: 'psychology' }, []).map((d) => d.id)).toEqual([
      'confirmation-bias',
      'fomo-chase',
      'revenge-interrupt',
      'confidence-check',
      'loss-aversion',
      'premature-entry',
      'recency-bias',
    ]);
    expect(
      filterPracticeDrills(PRACTICE_DRILLS, { ...all, difficulty: 'intermediate' }, []).every(
        (d) => d.difficulty === 'intermediate',
      ),
    ).toBe(true);
    expect(
      filterPracticeDrills(PRACTICE_DRILLS, { ...all, time: 'short' }, []).every((d) => d.estimatedMinutes <= 4),
    ).toBe(true);
    expect(
      filterPracticeDrills(PRACTICE_DRILLS, { ...all, completion: 'completed' }, attempts).map((d) => d.id),
    ).toEqual(['identify-trend']);
    expect(
      filterPracticeDrills(PRACTICE_DRILLS, { ...all, completion: 'not_completed' }, attempts).some(
        (d) => d.id === 'identify-trend',
      ),
    ).toBe(false);
  });

  it('recommends a repeated miss, then a lesson-linked drill, then an unattempted drill', () => {
    const misses = [
      { drillId: 'find-support', at: 'a', correct: false, selectedIndex: 0 },
      { drillId: 'find-support', at: 'b', correct: false, selectedIndex: 0 },
    ];
    expect(recommendPracticeDrill({ attempts: misses }).id).toBe('find-support');
    expect(recommendPracticeDrill({ attempts: [], nextLessonId: 'foundations-fx' }).id).toBe('fx-convert');
    expect(recommendPracticeDrill({ attempts: [] }).id).toBe(PRACTICE_DRILLS[0]!.id);
    expect(recommendPracticeDrill({ attempts: [], preferredDrillIds: ['confirmation-bias'] }).id).toBe(
      'confirmation-bias',
    );
  });

  it('parses practice topic query params used by event handoff', () => {
    expect(parsePracticeTopicParam('fundamentals')).toBe('fundamentals');
    expect(parsePracticeTopicParam(['psychology'])).toBe('psychology');
    expect(parsePracticeTopicParam('all')).toBeNull();
    expect(parsePracticeTopicParam('not-a-topic')).toBeNull();
    expect(parsePracticeTopicParam(undefined)).toBeNull();
  });
});
