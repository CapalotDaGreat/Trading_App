import type { ReadinessDimension, TrainingReadiness } from '../types/progress.types';
import type { SkillModelSnapshot } from '../types/progress.types';
import { SKILL_DOMAIN_LABELS } from '@/shared/constants/skill-domains';

function dimension(
  id: ReadinessDimension['id'],
  label: string,
  score: number,
  note: string,
  samples: number,
  minSamples: number,
): ReadinessDimension {
  const insufficient = samples < minSamples;
  const capped = insufficient ? Math.min(score, 28) : score;
  const evidence = insufficient || capped <= 0 ? 'none' : capped < 40 ? 'thin' : capped < 70 ? 'moderate' : 'strong';
  return {
    id,
    label,
    score: capped,
    evidence,
    note: insufficient ? `Insufficient demonstrated evidence yet. ${note}` : note,
  };
}

/**
 * Educational feedback only. Never claims the user is ready to trade real money.
 * Scores stay modest until there is demonstrated quality, not just activity.
 */
export function assessTrainingReadiness(input: {
  skill: SkillModelSnapshot;
  lessonsRead: number;
  practiced: number;
  journalCount: number;
  thesisDecisions: number;
  closeReviews: number;
  practiceAccuracy: number;
}): TrainingReadiness {
  const byDomain = Object.fromEntries(input.skill.domains.map((item) => [item.domain, item.score]));
  const knowledgeBase = Math.round(
    ((byDomain.market_understanding ?? 0) + (byDomain.chart_reading ?? 0) + (byDomain.technical_analysis ?? 0)) / 3,
  );
  const knowledge =
    input.practiced >= 2
      ? Math.round(knowledgeBase * 0.6 + Math.min(100, input.practiceAccuracy * 100) * 0.4)
      : knowledgeBase;
  const risk = byDomain.risk_management ?? 0;
  const consistencyRaw = Math.min(55, input.practiced * 8 + input.journalCount * 5);
  const decision = byDomain.decision_making ?? Math.min(40, input.thesisDecisions * 10);
  const emotion = byDomain.psychology ?? 0;
  const simulationRaw =
    input.closeReviews === 0
      ? Math.min(28, input.thesisDecisions * 6)
      : Math.min(100, input.thesisDecisions * 8 + input.closeReviews * 14);
  const reviewRaw = Math.min(100, input.journalCount * 10 + input.closeReviews * 16);
  const uncertainty = byDomain.process_discipline ?? Math.round((decision + reviewRaw) / 2);

  const dimensions: ReadinessDimension[] = [
    dimension(
      'knowledge',
      'Knowledge',
      knowledge,
      `${input.lessonsRead} lessons read; drill accuracy used only after two attempts. Knowledge is exposure, not readiness.`,
      input.lessonsRead + input.practiced,
      2,
    ),
    dimension(
      'risk_discipline',
      'Risk discipline',
      risk,
      'Sized from lessons, drills, and challenge rails — not from P/L.',
      input.skill.domains.find((item) => item.domain === 'risk_management')?.evidence === 'none' ? 0 : 2,
      2,
    ),
    dimension(
      'consistency',
      'Consistency',
      consistencyRaw,
      'Repeated demonstrated practice and journal loops. Opening a link is not a streak.',
      input.practiced + input.journalCount,
      3,
    ),
    dimension(
      'decision_quality',
      'Decision quality',
      decision,
      'Thesis, evidence, and invalidation on record — not fill count.',
      input.thesisDecisions,
      2,
    ),
    dimension(
      'emotional_discipline',
      'Emotional discipline',
      emotion,
      'Only from psychology work you actually did.',
      input.skill.domains.find((item) => item.domain === 'psychology')?.evidence === 'none' ? 0 : 2,
      2,
    ),
    dimension(
      'simulation_behavior',
      'Simulation behavior',
      simulationRaw,
      input.closeReviews === 0
        ? 'Paper fills without close reviews do not demonstrate simulation behavior.'
        : 'Thesis-backed paper decisions plus close reviews. Simulated P/L is not the grade.',
      input.closeReviews + input.thesisDecisions,
      2,
    ),
    dimension(
      'review_quality',
      'Review quality',
      reviewRaw,
      'Journal notes and post-trade process reviews.',
      input.journalCount + input.closeReviews,
      2,
    ),
    dimension(
      'uncertainty',
      'Uncertainty handling',
      uncertainty,
      'Whether you named what you did not know.',
      input.thesisDecisions + input.closeReviews,
      2,
    ),
  ];

  const ranked = [...dimensions].sort((a, b) => b.score - a.score);
  const strengths = ranked.filter((item) => item.evidence !== 'none' && item.score >= 50).slice(0, 2).map((item) => item.label);
  const gaps = ranked.filter((item) => item.evidence !== 'none' && item.score < 50).slice(-3).map((item) => item.label);
  const weakestDomain = input.skill.weakest ? SKILL_DOMAIN_LABELS[input.skill.weakest] : gaps[0];

  return {
    headline:
      strengths.length && gaps.length
        ? `Your training shows strengths in ${strengths.join(' and ')} and areas to improve in ${gaps.slice(0, 2).join(' and ')}.`
        : strengths.length
          ? `Your training shows emerging strength in ${strengths.join(' and ')}. Keep collecting process evidence.`
          : 'There is not enough process evidence yet to describe strengths or areas to improve.',
    certifiesLiveTrading: false,
    disclaimer:
      'This is educational feedback about your training record. It is not permission, advice, or a claim that you are ready to trade real money. Being profitable in simulation does not mean you are ready.',
    strengths,
    gaps: weakestDomain ? [...new Set([weakestDomain, ...gaps])] : gaps,
    dimensions,
    nextHref: input.lessonsRead === 0 ? '/academy/path/path-foundations' : '/',
    nextLabel: input.lessonsRead === 0 ? 'Start Learning' : "Open Today's Training",
  };
}
