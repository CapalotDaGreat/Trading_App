import type { LearningTopic } from '@/shared/constants/learning-topics';
import type { SkillDomain } from '@/shared/constants/skill-domains';
import { SKILL_DOMAINS } from '@/shared/constants/skill-domains';
import type { PracticeAttempt } from '@/features/practice/stores/practice-progress.store';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import type { Lesson } from '@/features/academy/types/academy.types';
import type { LessonProgress } from '@/features/academy/stores/academy-progress.store';
import type { EvidenceLevel, SkillDomainScore, SkillModelSnapshot } from '../types/progress.types';

const TOPIC_TO_DOMAIN: Record<LearningTopic, SkillDomain> = {
  chart_reading: 'chart_reading',
  technical_analysis: 'technical_analysis',
  risk: 'risk_management',
  psychology: 'psychology',
  fundamentals: 'fundamental_analysis',
  decision_making: 'decision_making',
};

const CATEGORY_TO_DOMAIN: Partial<Record<Lesson['category'], SkillDomain>> = {
  basics: 'market_understanding',
  technical_analysis: 'technical_analysis',
  fundamental_analysis: 'fundamental_analysis',
  risk_management: 'risk_management',
  psychology: 'psychology',
  decision: 'decision_making',
  journaling: 'process_discipline',
  portfolio: 'portfolio_management',
  crypto: 'market_understanding',
  options: 'market_understanding',
};

function evidenceLevel(samples: number): EvidenceLevel {
  if (samples <= 0) return 'none';
  if (samples < 3) return 'thin';
  if (samples < 8) return 'moderate';
  return 'strong';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function domainForLesson(lesson: Lesson): SkillDomain {
  return CATEGORY_TO_DOMAIN[lesson.category] ?? 'decision_making';
}

export function domainForTopic(topic: LearningTopic): SkillDomain {
  return TOPIC_TO_DOMAIN[topic];
}

export function buildSkillModel(input: {
  lessons: Lesson[];
  lessonProgress: Record<string, LessonProgress>;
  attempts: PracticeAttempt[];
  journalCount?: number;
  thesisDecisionCount?: number;
}): SkillModelSnapshot {
  const samples: Record<SkillDomain, { hits: number; total: number }> = Object.fromEntries(
    SKILL_DOMAINS.map((domain) => [domain, { hits: 0, total: 0 }]),
  ) as Record<SkillDomain, { hits: number; total: number }>;

  for (const lesson of input.lessons) {
    const domain = domainForLesson(lesson);
    const progress = input.lessonProgress[lesson.id];
    if (!progress) continue;
    samples[domain].total += 1;
    if (progress.read || progress.practiced) samples[domain].hits += 1;
    if ((progress.quizBestScore ?? 0) >= 70) samples[domain].hits += 1;
  }

  for (const attempt of input.attempts) {
    const drill = PRACTICE_DRILLS.find((item) => item.id === attempt.drillId);
    if (!drill) continue;
    const domain = domainForTopic(drill.topic);
    samples[domain].total += 1;
    if (attempt.correct) samples[domain].hits += 1;
  }

  if ((input.journalCount ?? 0) > 0) {
    samples.process_discipline.total += input.journalCount!;
    samples.process_discipline.hits += input.journalCount!;
  }
  if ((input.thesisDecisionCount ?? 0) > 0) {
    samples.decision_making.total += input.thesisDecisionCount!;
    samples.decision_making.hits += input.thesisDecisionCount!;
    samples.process_discipline.total += 1;
    samples.process_discipline.hits += 1;
  }

  const domains: SkillDomainScore[] = SKILL_DOMAINS.map((domain) => {
    const row = samples[domain];
    const score = row.total === 0 ? 0 : clamp((row.hits / Math.max(1, row.total)) * 100);
    const evidence = evidenceLevel(row.total);
    return {
      domain,
      score,
      evidence,
      evidenceNote:
        evidence === 'none'
          ? 'No observed work in this domain yet.'
          : `${row.total} observed action${row.total === 1 ? '' : 's'} from lessons, drills, or decisions.`,
      trend: 'unknown',
    };
  });

  const withEvidence = domains.filter((item) => item.evidence !== 'none');
  const weakest = withEvidence.slice().sort((a, b) => a.score - b.score)[0]?.domain ?? null;
  const strongest = withEvidence.slice().sort((a, b) => b.score - a.score)[0]?.domain ?? null;

  return {
    domains,
    weakest,
    strongest,
    evidenceNote:
      withEvidence.length === 0
        ? 'Scores stay hidden until you complete a lesson, drill, or journaled decision.'
        : 'These are process-evidence scores. Simulated profit is not included.',
  };
}
