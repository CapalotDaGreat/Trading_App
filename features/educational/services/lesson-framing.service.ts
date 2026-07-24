import type { Lesson } from '@/features/academy/types/academy.types';
import { CATEGORY_LABELS } from '@/features/academy/types/academy.types';

export interface LessonEducationalFraming {
  learningObjective: string;
  estimatedMinutes: number;
  difficulty: Lesson['difficulty'];
  skillsPracticed: string[];
  realWorldApplication: string;
  practiceRecommendation: string;
  suggestedReplay: string;
  suggestedLabExercise: string;
}

/** Derive Educational Mode lesson framing without requiring every lesson to redefine metadata. */
export function getLessonEducationalFraming(lesson: Lesson): LessonEducationalFraming {
  const skillsFromTags = lesson.tags
    .filter((tag) => tag.length > 1 && tag.length < 28)
    .slice(0, 4)
    .map((tag) => tag.replace(/[-_]/g, ' '));

  const skillsPracticed =
    skillsFromTags.length > 0
      ? skillsFromTags
      : [CATEGORY_LABELS[lesson.category], lesson.track === 'decision' ? 'Decision process' : 'Market literacy'];

  const replayLink = lesson.practiceLinks.find((link) => /replay/i.test(link.href + link.label));
  const labLink = lesson.practiceLinks.find((link) => /lab/i.test(link.href + link.label));

  return {
    learningObjective: lesson.description,
    estimatedMinutes: lesson.durationMinutes,
    difficulty: lesson.difficulty,
    skillsPracticed,
    realWorldApplication:
      lesson.track === 'decision'
        ? 'Apply this on your next Today brief, research queue item, or journal entry before you size a live idea.'
        : 'Use this concept to interpret charts and news as research context — never as a standalone trade instruction.',
    practiceRecommendation:
      lesson.practiceLinks[0]?.description ??
      lesson.practiceLinks[0]?.label ??
      'Journal one decision using the checklist from this lesson.',
    suggestedReplay:
      replayLink?.description ??
      replayLink?.label ??
      'Open Decision Replay and ask: what process cue would I notice earlier next time?',
    suggestedLabExercise:
      labLink?.description ??
      labLink?.label ??
      'Open Decision Lab and write a full thesis before any simulated entry.',
  };
}
