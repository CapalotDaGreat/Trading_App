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
  quiz: QuizQuestion[];
  takeaways: string[];
  practice?: PracticeLink[];
  simulation?: PracticeLink[];
  journalHref?: string;
  isPremium?: boolean;
}

export function makeFlagshipLesson(input: FlagshipLessonInput): Lesson {
  const practiceLinks = input.practice?.length ? input.practice : [{ ...DEFAULT_PRACTICE }];
  const simulationLinks = input.simulation?.length ? input.simulation : [{ ...DEFAULT_SIMULATION }];
  const sections = [
    {
      heading: 'Learning objectives',
      body: input.objectives.map((item, index) => `${index + 1}. ${item}`).join('\n'),
    },
    {
      heading: 'Why it matters',
      body: input.whyItMatters,
    },
    {
      heading: 'The idea',
      body: input.explanation,
      chart: input.chart,
    },
    {
      heading: 'Practical examples',
      body: input.examples.map((item) => `• ${item}`).join('\n'),
    },
    {
      heading: 'Common mistakes',
      body: input.mistakes.map((item) => `• ${item}`).join('\n'),
      callout: {
        type: 'warning' as const,
        text: input.limitations[0] ?? 'Every model fails. Name the failure mode before you size.',
      },
    },
    {
      heading: 'When the concept fails',
      body: input.whenItFails.map((item) => `• ${item}`).join('\n'),
      callout: {
        type: 'practice' as const,
        text: 'After this lesson: practice the drill, then apply the idea on a simulated decision and journal the reasoning.',
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
    exercises: [input.exercise],
    quiz: input.quiz,
    keyTakeaways: input.takeaways,
    practiceLinks,
    simulationLinks,
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
