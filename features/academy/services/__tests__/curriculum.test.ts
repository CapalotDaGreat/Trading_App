import { ALL_LESSONS } from '../../content';
import { LEARNING_PATHS } from '../../content/paths-and-checklists';
import { collectWeakConcepts } from '../academy-mastery.service';
import {
  auditLessonsWithoutPractice,
  auditLessonsWithoutSimulation,
  buildDefaultNextLesson,
  buildPersonalizedCurriculum,
  evaluatePathUnlocks,
  getDefaultOperatorPath,
  mapMistakeToLesson,
} from '../curriculum.service';
import type { LabChallenge } from '@/features/decision-lab/types/lab.types';
import type { TraderMemory } from '@/features/decision/types/decision.types';

describe('academy curriculum', () => {
  it('defaults to the Foundations path', () => {
    const path = getDefaultOperatorPath();
    expect(path.isDefault).toBe(true);
    expect(path.id).toBe('path-foundations');
    expect(path.lessonIds.length).toBeGreaterThan(3);
  });

  it('builds free default next lesson without personalization', () => {
    const rec = buildDefaultNextLesson({
      isRead: () => false,
      isPracticed: () => false,
    });
    expect(rec?.isPersonalized).toBe(false);
    expect(rec?.lesson.id).toBe('foundations-market');
  });

  it('personalizes from DNA mistakes', () => {
    const memory: TraderMemory = {
      favoriteAssets: [],
      tradingStyle: 'swing',
      riskTolerance: 'moderate',
      avgHoldHint: 'days',
      typicalMistakes: ['Moving stops after losses'],
      favoriteIndicators: [],
      bestSetups: [],
      weakestSetups: [],
      notes: [],
      updatedAt: Date.now(),
    };
    const recs = buildPersonalizedCurriculum({
      memory,
      isRead: () => false,
      isPracticed: () => false,
      limit: 2,
    });
    expect(recs[0]?.source).toBe('dna');
    expect(recs[0]?.lesson.id).toBe('dec-invalidation');
    expect(recs[0]?.isPersonalized).toBe(true);
  });

  it('recommends False Breakouts after repeated misses, not a random lesson', () => {
    const rec = buildDefaultNextLesson({
      isRead: () => false,
      isPracticed: () => false,
      weakConcepts: collectWeakConcepts({
        conceptResults: {
          'false-breakouts': { attempts: 4, misses: 3 },
        },
        repeatedDrillIds: [],
      }),
    });
    expect(rec?.source).toBe('weakness');
    expect(rec?.lesson.id).toBe('ta-false-breakouts');
  });

  it('unlocks path mastery from Lab challenges', () => {
    const challenges: LabChallenge[] = [
      {
        id: 'trend-only',
        title: 't',
        description: 'd',
        targetCount: 3,
        progress: 3,
        completed: true,
        celebrateCopy: 'c',
      },
    ];
    const unlocks = evaluatePathUnlocks(challenges);
    const tech = unlocks.find((u) => u.path.id === 'path-technical-foundations');
    expect(tech?.masteryUnlocked).toBe(true);
  });

  it('maps replay mistakes to Academy lessons', () => {
    const mapped = mapMistakeToLesson('You move stops too early after FOMO entries');
    expect(mapped?.lesson.id).toBeTruthy();
  });

  it('passes content quality bar — every lesson routes to practice and simulation', () => {
    expect(auditLessonsWithoutPractice()).toEqual([]);
    expect(auditLessonsWithoutSimulation()).toEqual([]);
  });

  it('keeps unique lesson ids and path membership', () => {
    const ids = ALL_LESSONS.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const path of LEARNING_PATHS) {
      for (const lessonId of path.lessonIds) {
        expect(ids).toContain(lessonId);
      }
    }
  });
});
