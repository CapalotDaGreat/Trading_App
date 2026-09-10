import type {
  Lesson,
  LessonCategory,
  LessonDifficulty,
  LessonExercise,
  PracticeLink,
  QuizQuestion,
} from '../types/academy.types';
import type { EducationalChartSpec } from '../types/educational-chart.types';

const TS = '2026-09-08T00:00:00.000Z';

const DEFAULT_PRACTICE: PracticeLink = {
  label: 'Practice this skill',
  href: '/practice',
  description: 'A short judgment drill. A correct answer is the reasoning, not a predicted tick.',
};

const DEFAULT_SIMULATION: PracticeLink = {
  label: 'Apply in simulated trading',
  href: '/simulate',
  description: 'Paper capital only. Simulated P/L does not grade the decision.',
};

const DEFAULT_REPLAY: PracticeLink = {
  label: 'Replay a historical decision',
  href: '/decision/replay-tv',
  description: 'Commit before the outcome is visible. Process is the grade — not the next print.',
};

export interface FlagshipLessonInput {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  durationMinutes: number;
  track?: Lesson['track'];
  sortOrder: number;
  tags: string[];
  searchKeywords?: string[];
  prerequisiteIds?: string[];
  relatedLessonIds: string[];
  conceptIds: string[];
  objectives: string[];
  whyItMatters: string;
  explanation: string;
  chart?: EducationalChartSpec;
  examples: string[];
  mistakes: string[];
  limitations: string[];
  whenItFails: string[];
  whenItWorks?: string[];
  exercise: LessonExercise;
  /** Extra applied / comparison / transfer exercises after the primary one. */
  extraExercises?: LessonExercise[];
  quiz: QuizQuestion[];
  takeaways: string[];
  practice?: PracticeLink[];
  simulation?: PracticeLink[];
  replay?: PracticeLink[];
  journalHref?: string;
  isPremium?: boolean;
}

export function makeFlagshipLesson(input: FlagshipLessonInput): Lesson {
  const practiceLinks = input.practice?.length ? input.practice : [{ ...DEFAULT_PRACTICE }];
  const simulationLinks = input.simulation?.length ? input.simulation : [{ ...DEFAULT_SIMULATION }];
  const replayLinks = input.replay?.length ? input.replay : [{ ...DEFAULT_REPLAY }];
  const sections = [
    {
      heading: 'The idea',
      body: input.explanation,
      chart: input.chart,
    },
    {
      heading: 'Practical interpretation',
      body: input.examples.map((item) => `• ${item}`).join('\n'),
      callout: {
        type: 'practice' as const,
        text: 'After this lesson: practise the drill, replay a historical room, then apply the idea on a simulated decision. Simulated P/L is not the grade.',
      },
    },
  ];

  return {
    id: input.id,
    title: input.title,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty,
    durationMinutes: input.durationMinutes,
    track: input.track ?? 'classic',
    sortOrder: input.sortOrder,
    isPremium: input.isPremium ?? false,
    tags: input.tags,
    searchKeywords: input.searchKeywords,
    prerequisiteIds: input.prerequisiteIds,
    relatedLessonIds: input.relatedLessonIds,
    conceptIds: input.conceptIds,
    learningObjectives: input.objectives,
    whyItMatters: input.whyItMatters,
    practicalExamples: input.examples,
    limitations: input.limitations,
    commonMistakes: input.mistakes,
    whenItWorks: input.whenItWorks,
    whenItFails: input.whenItFails,
    exercises: [input.exercise, ...(input.extraExercises ?? [])],
    quiz: input.quiz,
    keyTakeaways: input.takeaways,
    practiceLinks,
    simulationLinks,
    replayLinks,
    journalHref: input.journalHref ?? '/journal?from=academy',
    educationalCharts: input.chart ? [input.chart] : [],
    sections,
    content: `${input.description}\n\n${input.explanation}`,
    createdAt: TS,
    updatedAt: TS,
  };
}

export function defaultPractice(href: string, label: string, description?: string): PracticeLink {
  return { href, label, description };
}

export function replayEpisodeLink(episodeId: string, label: string): PracticeLink {
  return {
    href: `/decision/replay-tv?episode=${episodeId}`,
    label,
    description: 'Educational reconstruction. Outcome does not grade the process alone.',
  };
}
