import { ALL_LESSONS } from '../../content';
import { collectWeakConcepts, scorePathMastery } from '../academy-mastery.service';

describe('academy mastery', () => {
  it('labels an untouched path as Not started', () => {
    const scored = scorePathMastery({
      lessonIds: ['ta-rsi', 'ta-macd', 'ta-false-breakouts'],
      isRead: () => false,
      isPracticed: () => false,
    });
    expect(scored.label).toBe('Not started');
  });

  it('labels a well-practised path Strong from evidence, not XP', () => {
    const scored = scorePathMastery({
      lessonIds: ['a', 'b', 'c', 'd'],
      isRead: () => true,
      isPracticed: (id) => id !== 'd',
      quizBest: () => 80,
    });
    expect(scored.label).toBe('Strong');
    expect(scored.evidence.toLowerCase()).toMatch(/read|practised|quiz/);
  });

  it('labels Improving when reading outpaces practice', () => {
    const scored = scorePathMastery({
      lessonIds: ['a', 'b', 'c', 'd'],
      isRead: () => true,
      isPracticed: (id) => id === 'a',
    });
    expect(scored.label).toBe('Improving');
  });

  it('maps repeated false-breakout misses to the False Breakouts lesson', () => {
    const weak = collectWeakConcepts({
      conceptResults: { 'false-breakouts': { attempts: 5, misses: 4 } },
      repeatedDrillIds: ['breakout-quality'],
    });
    expect(weak[0]?.lessonId).toBe('ta-false-breakouts');
    expect(weak[0]?.evidence.some((row) => /false breakouts/i.test(row))).toBe(true);
  });

  it('flagship lessons include calculate or rank work, not only multiple choice', () => {
    const sizing = ALL_LESSONS.find((lesson) => lesson.id === 'risk-per-trade');
    const stops = ALL_LESSONS.find((lesson) => lesson.id === 'risk-stops');
    expect(sizing?.exercises?.some((exercise) => exercise.kind === 'calculate')).toBe(true);
    expect(stops?.exercises?.some((exercise) => exercise.kind === 'rank')).toBe(true);
    const falseBreak = ALL_LESSONS.find((lesson) => lesson.id === 'ta-false-breakouts');
    expect(falseBreak?.quiz.some((question) => (question.choiceExplanations?.length ?? 0) > 1)).toBe(
      true,
    );
  });
});
