/** Shared learning topics for Academy, Practice, and onboarding. */

export type LearningTopic =
  | 'chart_reading'
  | 'technical_analysis'
  | 'risk'
  | 'psychology'
  | 'fundamentals'
  | 'decision_making';

export const LEARNING_TOPIC_LABELS: Record<LearningTopic, string> = {
  chart_reading: 'Chart Reading',
  technical_analysis: 'Technical Analysis',
  risk: 'Risk',
  psychology: 'Psychology',
  fundamentals: 'Fundamentals',
  decision_making: 'Decision Making',
};

export const LEARNING_TOPICS = Object.keys(LEARNING_TOPIC_LABELS) as LearningTopic[];
