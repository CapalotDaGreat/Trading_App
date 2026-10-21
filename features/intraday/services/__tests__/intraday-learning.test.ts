import { ALL_LESSONS } from '@/features/academy/content';
import {
  LEARNING_PATHS,
  DEFAULT_CHECKLISTS,
} from '@/features/academy/content/paths-and-checklists';
import { COMPETENCY_CONCEPTS } from '@/features/competency/content/competency-taxonomy';

import {
  generateIntradayDrill,
  generateIntradayDrills,
  scoreIntradayDrillAttempt,
} from '../intraday-drills.service';
import { recommendIntradayNext } from '../recommendations.service';

describe('Day Trading & Scalping academy', () => {
  it('ships a structured path whose lessons all exist with substance', () => {
    const path = LEARNING_PATHS.find((p) => p.id === 'path-day-trading');
    expect(path).toBeDefined();
    expect(path!.title).toBe('Day Trading & Scalping');
    expect(path!.lessonIds.length).toBeGreaterThanOrEqual(10);
    const byId = new Map(ALL_LESSONS.map((l) => [l.id, l]));
    for (const id of path!.lessonIds) {
      const lesson = byId.get(id);
      expect(lesson).toBeDefined();
      expect(lesson!.sections.length).toBeGreaterThanOrEqual(4);
      expect(lesson!.quiz.length).toBeGreaterThanOrEqual(2);
      expect((lesson!.exercises ?? []).length).toBeGreaterThanOrEqual(1);
      expect((lesson!.learningObjectives ?? []).length).toBeGreaterThanOrEqual(3);
      expect(lesson!.practiceLinks.length).toBeGreaterThan(0);
      for (const q of lesson!.quiz) {
        expect(q.choices[q.correctIndex]).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(10);
      }
      for (const link of lesson!.practiceLinks) {
        expect(link.href.startsWith('/intraday/') || link.href.startsWith('/academy/')).toBe(true);
      }
    }
    expect(path!.lessonIds.some((id) => byId.get(id)?.difficulty === 'expert')).toBe(true);
    expect(path!.lessonIds.some((id) => byId.get(id)?.difficulty === 'advanced')).toBe(true);
  });

  it('adds intraday checklists and competency concepts', () => {
    expect(DEFAULT_CHECKLISTS.some((c) => c.id === 'pre-session-intraday')).toBe(true);
    expect(DEFAULT_CHECKLISTS.some((c) => c.id === 'post-session-intraday')).toBe(true);
    const ids = new Set(COMPETENCY_CONCEPTS.map((c) => c.id));
    for (const id of [
      'intraday-structure',
      'vwap-interpretation',
      'execution-mechanics',
      'session-planning',
    ]) {
      expect(ids.has(id)).toBe(true);
    }
    // Lesson concept references must resolve.
    for (const lesson of ALL_LESSONS.filter((l) => l.id.startsWith('dt-'))) {
      for (const conceptId of lesson.conceptIds ?? []) {
        expect(ids.has(conceptId)).toBe(true);
      }
    }
  });

  it('keeps educational copy free of signal language', () => {
    const banned =
      /\b(buy now|sell now|guaranteed (profit|return)|will (rise|moon)|price target|signal service)\b/i;
    for (const lesson of ALL_LESSONS.filter((l) => l.id.startsWith('dt-'))) {
      const blob = [
        lesson.title,
        lesson.description,
        ...lesson.keyTakeaways,
        ...lesson.sections.map((s) => s.body),
      ].join('\n');
      expect(banned.test(blob)).toBe(false);
    }
  });
});

describe('generated intraday drills', () => {
  it('generates varied advanced/expert drills with valid answer structure', () => {
    const drills = generateIntradayDrills(1234, 10);
    expect(drills).toHaveLength(10);
    expect(new Set(drills.map((d) => d.kind)).size).toBe(10);
    for (const drill of drills) {
      expect(['advanced', 'expert']).toContain(drill.difficulty);
      expect(drill.choices.length).toBe(4);
      expect(new Set(drill.choices).size).toBe(4);
      expect(drill.choices[drill.correctIndex]).toBeTruthy();
      expect(drill.explanation.length).toBeGreaterThan(40);
      expect(drill.timeLimitSeconds).toBeGreaterThan(0);
      // IDs and titles must not leak the answer position.
      expect(drill.id).not.toMatch(/correct|answer/);
      expect(drill.title).not.toMatch(/correct|answer/i);
    }
    const again = generateIntradayDrills(1234, 10);
    expect(again.map((d) => d.correctIndex)).toEqual(drills.map((d) => d.correctIndex));
  });

  it('sizing drill arithmetic is internally consistent', () => {
    const drill = generateIntradayDrill(777, 0);
    expect(drill.kind).toBe('sizing');
    // The correct choice must be the only one mentioning the risk-budget division.
    expect(drill.choices[drill.correctIndex]).toMatch(/risk budget \$[\d,]+ ÷/);
  });

  it('scores timeouts honestly and separately from wrong answers', () => {
    const drill = generateIntradayDrill(5, 6); // daily-limit, 30s
    const onTime = scoreIntradayDrillAttempt({
      drill,
      selectedIndex: drill.correctIndex,
      elapsedMs: 2_000,
      timed: true,
    });
    expect(onTime).toEqual({ correct: true, timedOut: false, elapsedMs: 2_000 });
    const late = scoreIntradayDrillAttempt({
      drill,
      selectedIndex: drill.correctIndex,
      elapsedMs: 999_000,
      timed: true,
    });
    expect(late.correct).toBe(false);
    expect(late.timedOut).toBe(true);
    const untimed = scoreIntradayDrillAttempt({
      drill,
      selectedIndex: drill.correctIndex,
      elapsedMs: 999_000,
      timed: false,
    });
    expect(untimed.correct).toBe(true);
    expect(untimed.timedOut).toBe(false);
  });
});

describe('adaptive recommendations', () => {
  it('routes every recommendation to a real intraday or academy route', () => {
    const recs = recommendIntradayNext({
      missedDrillKinds: [
        'sizing',
        'breakout-confirmation',
        'multi-timeframe',
        'cost-drag',
        'vwap-context',
      ],
      breakerSessions: 1,
      flatSessions: 0,
      costHeavySessions: 1,
      completedSessions: 2,
    });
    expect(recs.length).toBeGreaterThan(0);
    const valid = [/^\/intraday\//, /^\/academy\//, /^\/decision\/replay-tv$/];
    for (const rec of recs) {
      expect(valid.some((re) => re.test(rec.href))).toBe(true);
    }
    const breakerOnly = recommendIntradayNext({
      missedDrillKinds: [],
      breakerSessions: 1,
      flatSessions: 0,
      costHeavySessions: 0,
      completedSessions: 1,
    });
    expect(breakerOnly.some((r) => r.href === '/intraday/day')).toBe(true);
  });
});
