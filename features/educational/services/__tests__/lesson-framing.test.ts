import type { Lesson } from '@/features/academy/types/academy.types';
import { getLessonEducationalFraming } from '@/features/educational/services/lesson-framing.service';

const sampleLesson: Lesson = {
  id: 'sample',
  title: 'Sample',
  description: 'Learn to pause before sizing.',
  category: 'decision',
  difficulty: 'beginner',
  durationMinutes: 8,
  content: 'Learn to pause before sizing.',
  sections: [],
  keyTakeaways: ['Pause before size'],
  quiz: [],
  practiceLinks: [
    {
      label: 'Open Decision Lab',
      href: '/decision/lab',
      description: 'Write a full thesis before entry',
    },
  ],
  relatedLessonIds: [],
  track: 'decision',
  sortOrder: 1,
  isPremium: false,
  tags: ['patience', 'checklist'],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('getLessonEducationalFraming', () => {
  it('derives learning objective, skills, and practice suggestions', () => {
    const framing = getLessonEducationalFraming(sampleLesson);
    expect(framing.learningObjective).toContain('pause');
    expect(framing.estimatedMinutes).toBe(8);
    expect(framing.skillsPracticed).toEqual(expect.arrayContaining(['patience', 'checklist']));
    expect(framing.suggestedLabExercise.toLowerCase()).toContain('thesis');
  });
});
