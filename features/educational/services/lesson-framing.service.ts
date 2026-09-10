import type { Lesson } from '@/features/academy/types/academy.types';
import { CATEGORY_LABELS } from '@/features/academy/types/academy.types';

export interface LessonEducationalFraming {
  learningObjective: string;
  estimatedMinutes: number;
  difficulty: Lesson['difficulty'];
  skillsPracticed: string[];
  realWorldApplication: string;
  practiceRecommendation: string;
  simulationRecommendation: string;
  suggestedReplay: string;
  suggestedLabExercise: string;
}

/** Derive Educational Mode lesson framing without requiring every lesson to redefine metadata. */
export function getLessonEducationalFraming(lesson: Lesson): LessonEducationalFraming {
  const skillsFromTags = lesson.tags
    .filter((tag) => tag.length > 1 && tag.length < 28)
    .slice(0, 4)
    .map((tag) => tag.replace(/[-_]/g, ' '));
  const skillsFromConcepts = (lesson.conceptIds ?? []).slice(0, 4);

  const skillsPracticed =
    skillsFromConcepts.length > 0
      ? skillsFromConcepts.map((id) => id.replace(/[-_]/g, ' '))
      : skillsFromTags.length > 0
        ? skillsFromTags
        : [CATEGORY_LABELS[lesson.category], lesson.track === 'decision' ? 'Decision process' : 'Market literacy'];

  const replayLink =
    lesson.replayLinks?.[0] ??
    lesson.practiceLinks.find((link) => /replay/i.test(link.href + link.label));
  const labLink = lesson.practiceLinks.find((link) => /lab/i.test(link.href + link.label));
  const simulationLink = lesson.simulationLinks?.[0];

  return {
    learningObjective: lesson.learningObjectives?.[0] ?? lesson.description,
    estimatedMinutes: lesson.durationMinutes,
    difficulty: lesson.difficulty,
    skillsPracticed,
    realWorldApplication:
      lesson.whyItMatters ??
      (lesson.track === 'decision'
        ? 'Apply this on your next Home card, practice drill, or journal entry before you size a simulated idea.'
        : 'Use this concept to interpret charts as educational context — never as a standalone trade instruction.'),
    practiceRecommendation:
      lesson.practiceLinks[0]?.description ??
      lesson.practiceLinks[0]?.label ??
      'Journal one decision using the checklist from this lesson.',
    simulationRecommendation:
      simulationLink?.description ??
      simulationLink?.label ??
      'Paper-trade the idea. Simulated P/L does not grade the decision.',
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
