import type { EducationalChartSpec } from './educational-chart.types';
import type { CompetencyScenarioContext } from '@/features/competency/types/competency.types';

export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type LessonCategory =
  | 'basics'
  | 'technical_analysis'
  | 'fundamental_analysis'
  | 'risk_management'
  | 'psychology'
  | 'options'
  | 'crypto'
  | 'decision'
  | 'journaling'
  | 'portfolio';

export type AcademyTrack = 'decision' | 'classic';

export type CalloutType = 'tip' | 'warning' | 'practice';

export type LessonExerciseKind =
  | 'identify'
  | 'select'
  | 'rank'
  | 'calculate'
  | 'annotate'
  | 'explain'
  | 'compare'
  | 'choose'
  | 'scenario';

export interface LessonSection {
  heading: string;
  body: string;
  callout?: {
    type: CalloutType;
    text: string;
  };
  chart?: EducationalChartSpec;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  /** Why the correct answer is right. */
  explanation: string;
  /** Per-choice coaching. Index matches `choices`. Required for flagship checks. */
  choiceExplanations?: string[];
  conceptId?: string;
}

export interface LessonExercise {
  id: string;
  kind: LessonExerciseKind;
  prompt: string;
  explanation: string;
  conceptId?: string;
  askEvidence?: boolean;
  situation?: string;
  choices?: string[];
  correctIndex?: number;
  choiceExplanations?: string[];
  items?: string[];
  correctOrder?: number[];
  expectedValue?: number;
  tolerance?: number;
  unit?: string;
  minChars?: number;
  modelAnswer?: string;
  leftLabel?: string;
  rightLabel?: string;
  chart?: EducationalChartSpec;
  /** Guided interpretation still counts as applied, not as independent demonstration. */
  guided?: boolean;
  /** Mixed / unfamiliar prompt — recorded as transfer, not as the same example twice. */
  asTransfer?: boolean;
  scenarioContext?: CompetencyScenarioContext;
  interactingConceptIds?: string[];
}

export interface PracticeLink {
  label: string;
  href: string;
  description?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  durationMinutes: number;
  /** Short summary kept for Firestore compatibility / cards */
  content: string;
  sections: LessonSection[];
  keyTakeaways: string[];
  quiz: QuizQuestion[];
  practiceLinks: PracticeLink[];
  relatedLessonIds: string[];
  track: AcademyTrack;
  sortOrder: number;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  prerequisiteIds?: string[];
  searchKeywords?: string[];
  commonMistakes?: string[];
  whenItWorks?: string[];
  whenItFails?: string[];
  educationalCharts?: EducationalChartSpec[];
  learningObjectives?: string[];
  whyItMatters?: string;
  practicalExamples?: string[];
  limitations?: string[];
  exercises?: LessonExercise[];
  simulationLinks?: PracticeLink[];
  replayLinks?: PracticeLink[];
  journalHref?: string;
  conceptIds?: string[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  sortOrder: number;
  isRequired: boolean;
  hint?: string;
}

export interface TradingChecklist {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
  isPremium: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  track: AcademyTrack;
  lessonIds: string[];
  icon: string;
  sortOrder: number;
  isPremium: boolean;
}

export const CATEGORY_LABELS: Record<LessonCategory, string> = {
  basics: 'Basics',
  technical_analysis: 'Technical',
  fundamental_analysis: 'Fundamentals',
  risk_management: 'Risk',
  psychology: 'Psychology',
  options: 'Options',
  crypto: 'Crypto',
  decision: 'Decision',
  journaling: 'Journal',
  portfolio: 'Portfolio',
};
