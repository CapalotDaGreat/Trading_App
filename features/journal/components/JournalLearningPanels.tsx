import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { JournalLearningJourney } from '@/features/journal/types/journal-learning-journey.types';
import type { PassportPeriodSummary } from '@/features/decision-passport/types/passport.types';
import { Button } from '@/shared/components/ui/Button';
import { Chip } from '@/shared/components/ui/Chip';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatDate } from '@/shared/utils/date';

function PeriodList({
  title,
  items,
}: {
  title: string;
  items: PassportPeriodSummary[];
}) {
  return (
    <GlassCard className="p-4" bordered>
      <Text variant="h3">{title}</Text>
      <View className="mt-3 gap-3">
        {items.map((item) => (
          <View key={item.key} className="border-b border-border pb-2">
            <Text variant="label">{item.label}</Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              Journals {item.journaled} · Research {item.researched} · Replays {item.replayed} ·
              Skips {item.skippedOrIgnored}
              {item.avgDecisionQuality != null
                ? ` · Avg DQS ${item.avgDecisionQuality}`
                : ''}
            </Text>
            <Text variant="body-sm" className="mt-1 text-text-tertiary">
              {item.insight}
            </Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function JournalTimelinePanel({ journey }: { journey: JournalLearningJourney }) {
  if (!journey.timeline.length) {
    return (
      <GlassCard className="p-4" bordered>
        <Text variant="h3">Decision Timeline</Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Decisions you research, skip, journal, and replay will appear here automatically.
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4" bordered testID="journal-decision-timeline">
      <Text variant="h3">Decision Timeline</Text>
      <Text variant="caption" className="mt-1 text-text-tertiary">
        Latest process events — learning over outcomes
      </Text>
      <View className="mt-3 gap-3">
        {journey.timeline.slice(0, 24).map((event) => (
          <View key={event.id} className="flex-row gap-3">
            <View className="w-1 rounded-full bg-accent" />
            <View className="flex-1">
              <Text variant="label">
                {event.label}
                {event.symbol ? ` · ${event.symbol}` : ''}
              </Text>
              <Text variant="caption" className="text-text-tertiary">
                {formatDate(event.at)}
              </Text>
              {event.note ? (
                <Text variant="body-sm" className="mt-1 text-text-secondary" numberOfLines={2}>
                  {event.note}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function JournalReviewsPanel({ journey }: { journey: JournalLearningJourney }) {
  const weekly = journey.weeklyReview;
  const tape = journey.weeklyTape;

  return (
    <View className="gap-4" testID="journal-reviews">
      <GlassCard className="p-4" bordered>
        <Text variant="h3">Weekly Review</Text>
        {weekly ? (
          <View className="mt-3 gap-2">
            <Text variant="body-sm" className="text-text-secondary">
              Best: {weekly.bestDecision}
            </Text>
            <Text variant="body-sm" className="text-text-secondary">
              Watch: {weekly.biggestMistake}
            </Text>
            <Text variant="body-sm" className="text-text-secondary">
              Lesson: {weekly.aiLesson}
            </Text>
            <Text variant="caption" className="text-text-tertiary">
              Journal consistency: {weekly.journalConsistency}
            </Text>
            <Text variant="caption" className="text-text-tertiary">
              Focus: {weekly.recommendedFocus}
            </Text>
          </View>
        ) : (
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Log a few decisions this week to unlock the weekly chapter.
          </Text>
        )}
        {tape ? (
          <View className="mt-4 gap-1 border-t border-border pt-3">
            <Text variant="label">Game tape</Text>
            <Text variant="caption" className="text-text-secondary">
              Disciplined: {tape.mostDisciplined}
            </Text>
            <Text variant="caption" className="text-text-secondary">
              Emotional: {tape.mostEmotional}
            </Text>
            <Text variant="caption" className="text-text-secondary">
              Next week: {tape.lessonForNextWeek}
            </Text>
          </View>
        ) : null}
      </GlassCard>

      <PeriodList title="Monthly Review" items={journey.monthly} />
      <PeriodList title="Quarterly Review" items={journey.quarterly} />
      <PeriodList title="Yearly Review" items={journey.yearly} />
    </View>
  );
}

export function JournalInsightsPanel({ journey }: { journey: JournalLearningJourney }) {
  const router = useRouter();

  return (
    <View className="gap-4" testID="journal-insights">
      <GlassCard className="p-4" bordered>
        <Text variant="h3">AI Coaching</Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {journey.coach?.recommendation ??
            'Log closed decisions with emotion and lessons to personalize coaching.'}
        </Text>
        {journey.coach?.psychology ? (
          <Text variant="caption" className="mt-2 text-text-tertiary">
            {journey.coach.psychology}
          </Text>
        ) : null}
        <Button
          className="mt-3"
          variant="outline"
          size="sm"
          onPress={() => router.push('/decision/coach' as never)}
        >
          Open full coach
        </Button>
      </GlassCard>

      <GlassCard className="p-4" bordered>
        <Text variant="h3">Improvement suggestions</Text>
        <View className="mt-3 gap-2">
          {journey.improvements.map((item) => (
            <Text key={item} variant="body-sm" className="text-text-secondary">
              • {item}
            </Text>
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4" bordered>
        <Text variant="h3">Psychology trends</Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          {journey.psychology.narrative}
        </Text>
        <Text variant="caption" className="mt-2 text-text-tertiary">
          Stress-tagged share {journey.psychology.stressShare}% ·{' '}
          {journey.psychology.improvementHint}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {journey.psychology.weeklyPoints.map((point) => (
            <Chip
              key={point.key}
              label={`${point.label}: ${point.stressShare}%`}
              disabled
            />
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4" bordered>
        <Text variant="h3">Behavior analysis</Text>
        <View className="mt-3 gap-2">
          {journey.behaviorInsights.map((insight) => (
            <View key={insight.id}>
              <Text variant="label">{insight.statement}</Text>
              <Text variant="caption" className="text-text-tertiary">
                {insight.evidence[0]}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4" bordered>
        <Text variant="h3">Strategy insights</Text>
        {journey.strategyInsights.length === 0 ? (
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Add a strategy or tag on journals to surface process patterns.
          </Text>
        ) : (
          <View className="mt-3 gap-3">
            {journey.strategyInsights.map((s) => (
              <View key={s.strategy}>
                <Text variant="label">
                  {s.strategy} · {s.count} entries
                </Text>
                <Text variant="body-sm" className="text-text-secondary">
                  {s.tip}
                </Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      {journey.dna ? (
        <GlassCard className="p-4" bordered>
          <Text variant="h3">Trading DNA evolution</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {journey.dna.becomingLabel}
          </Text>
          <Text variant="caption" className="mt-1 text-text-tertiary">
            Style: {journey.dna.styleLabel}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {journey.dna.traits.slice(0, 4).map((trait) => (
              <Chip
                key={trait.id}
                label={`${trait.label} ${trait.score}`}
                disabled
              />
            ))}
          </View>
          {journey.dnaEvolution[0] ? (
            <Text variant="caption" className="mt-3 text-text-tertiary">
              Latest chapter: {journey.dnaEvolution[journey.dnaEvolution.length - 1]?.summary}
            </Text>
          ) : null}
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onPress={() => router.push('/decision/intelligence' as never)}
          >
            Open Personal Intelligence
          </Button>
        </GlassCard>
      ) : null}

      {journey.decisionGraph ? (
        <GlassCard className="p-4" bordered>
          <Text variant="h3">Decision Graph</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {journey.decisionGraph.insight}
          </Text>
          <Text variant="caption" className="mt-1 text-text-tertiary">
            Overall process intensity {journey.decisionGraph.overallScore} ·{' '}
            {journey.decisionGraph.period}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {journey.decisionGraph.metrics.slice(0, 6).map((metric) => (
              <Pressable
                key={metric.id}
                onPress={() => router.push(metric.href as never)}
              >
                <Chip label={`${metric.label} ${metric.score}`} />
              </Pressable>
            ))}
          </View>
        </GlassCard>
      ) : null}

      <GlassCard className="p-4" bordered>
        <Text variant="h3">Replay references</Text>
        <View className="mt-3 gap-2">
          {journey.replayReferences.map((link) => (
            <Pressable key={link.href + link.label} onPress={() => router.push(link.href as never)}>
              <Text variant="label" className="text-accent">
                {link.label}
              </Text>
              <Text variant="caption" className="text-text-tertiary">
                {link.reason}
              </Text>
            </Pressable>
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4" bordered>
        <Text variant="h3">Academy recommendations</Text>
        {journey.academyRecommendations.length === 0 ? (
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            Keep journaling — lessons will map to your process gaps.
          </Text>
        ) : (
          <View className="mt-3 gap-3">
            {journey.academyRecommendations.map((rec) => (
              <Pressable
                key={rec.lessonId + rec.title}
                onPress={() => router.push(`/academy/lesson/${rec.lessonId}` as never)}
              >
                <Text variant="label" className="text-accent">
                  {rec.title}
                </Text>
                <Text variant="caption" className="text-text-tertiary">
                  {rec.reason}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </GlassCard>
    </View>
  );
}
