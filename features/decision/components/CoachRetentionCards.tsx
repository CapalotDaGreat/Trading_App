import { View } from 'react-native';

import type { DisciplineStreak, WeeklyReviewInsight, WhyNotInsight } from '@/features/decision/types/decision.types';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export function DisciplineStreakCard({ streak }: { streak: DisciplineStreak }) {
  const checks = [
    { key: 'morningBrief', label: 'Morning brief', done: streak.completedToday.morningBrief },
    { key: 'researchPlan', label: 'Research plan', done: streak.completedToday.researchPlan },
    { key: 'journal', label: 'Journal', done: streak.completedToday.journal },
  ] as const;

  return (
    <GlassCard className="p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="h3">Trading discipline</Text>
        <Text variant="price" className="text-accent">
          {streak.days}d
        </Text>
      </View>
      <Text variant="caption" className="mb-3 text-text-secondary">
        Streak of days you completed the decision loop
      </Text>
      {checks.map((c) => (
        <Text
          key={c.key}
          variant="body-sm"
          className={c.done ? 'mb-1 text-bullish' : 'mb-1 text-text-secondary'}
        >
          {c.done ? '✓' : '○'} {c.label}
        </Text>
      ))}
    </GlassCard>
  );
}

export function WeeklyReviewCard({ review }: { review: WeeklyReviewInsight }) {
  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        {review.isSundayReview ? 'SUNDAY REVIEW' : 'YOUR WEEK'}
      </Text>
      <Text variant="h3" className="mb-2">
        {review.decisionsMade} decisions logged
      </Text>
      {review.celebrateDiscipline ? (
        <Text variant="body-sm" className="mb-2 text-bullish">
          {review.celebrateDiscipline}
        </Text>
      ) : null}
      <Text variant="body-sm" className="mb-1 text-text-secondary">
        Best: {review.bestDecision}
      </Text>
      <Text variant="body-sm" className="mb-1 text-text-secondary">
        Watch: {review.biggestMistake}
      </Text>
      {review.journalConsistency ? (
        <Text variant="caption" className="mb-1 text-text-tertiary">
          Journal: {review.journalConsistency}
        </Text>
      ) : null}
      {review.decisionQualityTrend != null ? (
        <Text variant="caption" className="mb-1 text-text-tertiary">
          Process score: {review.decisionQualityTrend}
          {review.researchHoursEstimate != null
            ? ` · ~${review.researchHoursEstimate}h research est.`
            : ''}
        </Text>
      ) : null}
      <Text variant="body-sm" className="mt-2 leading-relaxed text-text-primary">
        Lesson: {review.aiLesson}
      </Text>
      {review.recommendedFocus ? (
        <Text variant="caption" className="mt-2 text-accent">
          Next week: {review.recommendedFocus}
        </Text>
      ) : null}
    </GlassCard>
  );
}

export function WhyNotCard({ items }: { items: WhyNotInsight[] }) {
  if (!items.length) return null;

  return (
    <GlassCard className="p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        Why not?
      </Text>
      <Text variant="h3" className="mb-1">
        Save your attention
      </Text>
      <Text variant="caption" className="mb-3 text-text-secondary">
        Ideas worth skipping so you protect research time
      </Text>
      {items.map((item) => (
        <View key={item.symbol} className="mb-3 pb-3 last:mb-0 last:pb-0">
          <Text variant="label" className="mb-1 text-text-primary">
            {item.symbol} · save ~{item.savedMinutes}m
          </Text>
          {item.reasons.map((r) => (
            <Text key={r} variant="caption" className="mb-0.5 leading-relaxed text-text-secondary">
              ⚠ {r}
            </Text>
          ))}
        </View>
      ))}
    </GlassCard>
  );
}
