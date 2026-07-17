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
  | 'journaling';

export type AcademyTrack = 'decision' | 'classic';

export type CalloutType = 'tip' | 'warning' | 'practice';

export interface LessonSection {
  heading: string;
  body: string;
  callout?: {
    type: CalloutType;
    text: string;
  };
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
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
};
