import { ALL_LESSONS } from '../../content';
import { searchAcademyLessons } from '../academy-search.service';
import { searchEducation } from '../educational-search.service';

describe('academy semantic search', () => {
  it('maps overbought questions to RSI rather than requiring the title', () => {
    const hits = searchAcademyLessons(ALL_LESSONS, 'How do I know when a stock is overbought?');
    expect(hits[0]?.lesson.id).toBe('ta-rsi');
    expect(hits[0]?.why.toLowerCase()).toMatch(/rsi|momentum|technical/);
  });

  it('maps false-breakout questions to the False Breakouts lesson', () => {
    const hits = searchAcademyLessons(ALL_LESSONS, 'Why did my breakout fail?');
    expect(hits[0]?.lesson.id).toBe('ta-false-breakouts');
  });

  it('maps sizing, drawdown, RSI stretch, and support questions by intent', () => {
    expect(searchAcademyLessons(ALL_LESSONS, 'How do I size a position?')[0]?.lesson.id).toMatch(
      /risk-per-trade|risk-position-sizing/,
    );
    expect(searchAcademyLessons(ALL_LESSONS, 'What does drawdown actually mean?')[0]?.lesson.id).toBe(
      'risk-drawdown',
    );
    expect(searchAcademyLessons(ALL_LESSONS, 'Why does RSI stay overbought?')[0]?.lesson.id).toMatch(
      /ta-rsi|ta-momentum/,
    );
    expect(
      searchAcademyLessons(ALL_LESSONS, 'How can I tell if support is strong?')[0]?.lesson.id,
    ).toBe('ta-structure');
  });

  it('maps risk-management intent to sizing and expectancy', () => {
    const hits = searchAcademyLessons(ALL_LESSONS, 'How do I manage risk?');
    const ids = hits.map((hit) => hit.lesson.id);
    expect(ids.some((id) => id.startsWith('risk-') || id === 'dec-portfolio-risk' || id === 'basics-rr')).toBe(
      true,
    );
  });

  it('maps candles to candlestick literacy', () => {
    const hits = searchAcademyLessons(ALL_LESSONS, 'candles');
    expect(hits[0]?.lesson.id).toBe('ta-candles');
  });

  it('understands beginner technical analysis', () => {
    const hits = searchAcademyLessons(ALL_LESSONS, 'beginner technical analysis');
    const ids = hits.map((hit) => hit.lesson.id);
    expect(ids).toEqual(expect.arrayContaining(['ta-structure', 'ta-candles']));
  });

  it('maps currency-pair questions to the FX lesson', () => {
    const hits = searchAcademyLessons(ALL_LESSONS, 'How do I trade currencies?');
    expect(hits[0]?.lesson.id).toBe('foundations-fx');
  });

  it('returns nothing for empty queries', () => {
    expect(searchAcademyLessons(ALL_LESSONS, '   ')).toEqual([]);
  });

  it('unifies lessons, practice, and glossary for educational intent', () => {
    const results = searchEducation(ALL_LESSONS, 'Why can RSI stay overbought?');
    expect(results.lessons[0]?.lesson.id).toBe('ta-rsi');
    expect(results.practice.some((hit) => hit.drill.lessonId === 'ta-rsi' || hit.drill.id === 'missing-evidence')).toBe(
      true,
    );
    expect(results.glossary.some((hit) => hit.term.toLowerCase().includes('rsi'))).toBe(true);
    expect(results.exercises.length).toBeGreaterThanOrEqual(0);
  });
});
