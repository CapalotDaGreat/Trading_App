import type { MentorExperienceLevel } from '@/features/onboarding/types/mentor-setup.types';
import type { EventTrainingPlan, MarketEventCardModel } from '../types/events.types';

const ADVANCED: MentorExperienceLevel[] = ['advanced', 'professional'];

export function isEventPersonalizationEligible(experience: MentorExperienceLevel | null | undefined): boolean {
  return experience != null && ADVANCED.includes(experience);
}

export function composeEventTrainingPlan(input: {
  cards: MarketEventCardModel[];
  experience: MentorExperienceLevel | null | undefined;
  now?: number;
}): EventTrainingPlan | null {
  if (!isEventPersonalizationEligible(input.experience)) return null;

  const now = input.now ?? Date.now();
  const lead =
    input.cards
      .filter((card) => card.lifecycle === 'upcoming' && card.origin === 'calendar')
      .sort((a, b) => b.importance.score - a.importance.score || a.scheduledAt - b.scheduledAt)[0] ??
    input.cards
      .filter((card) => card.lifecycle === 'upcoming')
      .sort((a, b) => b.importance.score - a.importance.score || a.scheduledAt - b.scheduledAt)[0];

  if (!lead) return null;

  const daysUntil = Math.max(0, Math.round((lead.scheduledAt - now) / (24 * 60 * 60 * 1000)));
  if (daysUntil > 10) return null;

  const dayLabel = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'in 1 day' : `in ${daysUntil} days`;

  return {
    headline: `${lead.title} ${dayLabel}.`,
    eventTitle: lead.title,
    daysUntil,
    lessonTitle: lead.training.lessonTitle,
    lessonHref: `/academy/lesson/${lead.training.lessonId}`,
    practiceTitle: lead.training.practiceTitle,
    practiceHref: lead.training.practiceHref,
    replayTitle: lead.training.replayTitle,
    replayHref: lead.training.replayHref,
    simulateTitle: lead.training.simulateTitle,
    simulateHref: lead.training.simulateHref,
    reminder:
      'Recommended study stack — lesson, practice, historical replay, then a fictional simulation. Not a prediction of this event.',
  };
}
