import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { useTradingMentor } from '@/features/decision/hooks/useTradingMentor';
import { MentorSetupInviteCard } from '@/features/onboarding/components/MentorSetupInviteCard';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export function TradingMentorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useTradingMentor();
  const { showMentorSetupInvite, dismissMentorInvite, mentorSetupCompleted } = useCoachProfile();

  return (
    <ScreenScaffold
      title="Trading Mentor"
      subtitle="One priority, one pattern, one exercise — never market predictions."
      showBack
      contentClassName="pb-12"
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.accent.primary}
          />
        ),
      }}
      headerAction={
        <Button size="sm" variant="ghost" onPress={() => router.push('/ai?source=mentor' as never)}>
          Ask
        </Button>
      }
      testID="mentor-screen"
    >
      <View className="gap-4">
        {showMentorSetupInvite ? (
          <MentorSetupInviteCard onLater={() => void dismissMentorInvite()} />
        ) : null}
        {!mentorSetupCompleted && !showMentorSetupInvite ? (
          <Button variant="outline" onPress={() => router.push('/onboarding' as never)}>
            Set up your coach profile
          </Button>
        ) : (
          <Button variant="ghost" onPress={() => router.push('/onboarding' as never)}>
            Edit Coach Profile
          </Button>
        )}
        <EducationalModeBadge size="md" />

        {isLoading && !data ? (
          <View className="gap-3">
            <Skeleton height={140} rounded="lg" />
            <Skeleton height={120} rounded="lg" />
          </View>
        ) : null}

        {data ? (
          <>
            <Surface tone="accent" emphasis="outlined" testID="mentor-priority">
              <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
                Coaching priority
              </Text>
              <Text variant="h2" headingLevel={2} className="mt-2 leading-snug">
                {data.daily.headline}
              </Text>
              <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
                {data.daily.todaysFocus}
              </Text>
              <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
                {data.daily.detail}
              </Text>
            </Surface>

            <Surface testID="mentor-pattern">
              <Text variant="label" className="text-text-tertiary">
                REPEATED PATTERN
              </Text>
              <Text variant="body" className="mt-2">
                {data.daily.repeatingMistake}
              </Text>
              <Text variant="caption" className="mt-2 text-text-secondary">
                Improve next: {data.daily.improveNext}
              </Text>
            </Surface>

            <Surface testID="mentor-exercise">
              <Text variant="label" className="text-accent">
                PRESCRIBED EXERCISE
              </Text>
              <Text variant="h3" headingLevel={3} className="mt-2">
                {data.weekly.academyRecommendation?.title ?? data.weekly.replayRecommendation.label}
              </Text>
              <Text variant="body-sm" className="mt-2 text-text-secondary">
                {data.weekly.academyRecommendation?.reason ?? data.weekly.replayRecommendation.reason}
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {data.weekly.academyRecommendation ? (
                  <Button
                    size="sm"
                    onPress={() =>
                      router.push(
                        `/academy/lesson/${data.weekly.academyRecommendation!.lessonId}` as never,
                      )
                    }
                  >
                    Open Academy lesson
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => router.push(data.weekly.replayRecommendation.href as never)}
                >
                  Open practice
                </Button>
              </View>
            </Surface>

            <CollapsibleSection
              title="Practice this next"
              description="Academy and Replay recommendations for this week."
            >
              {data.weekly.academyRecommendation ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open Academy lesson ${data.weekly.academyRecommendation.title}`}
                  onPress={() =>
                    router.push(
                      `/academy/lesson/${data.weekly.academyRecommendation!.lessonId}` as never,
                    )
                  }
                  className="mb-2 active:opacity-90"
                >
                  <Surface padding="sm">
                    <View className="mb-1 flex-row items-center">
                      <Ionicons name="school-outline" size={16} color={colors.info.primary} />
                      <Text variant="caption" className="ml-2 font-semibold uppercase tracking-wide text-info">
                        Academy
                      </Text>
                    </View>
                    <Text variant="label">{data.weekly.academyRecommendation.title}</Text>
                    <Text variant="body-sm" className="mt-1 text-text-secondary">
                      {data.weekly.academyRecommendation.reason}
                    </Text>
                  </Surface>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={data.weekly.replayRecommendation.label}
                onPress={() => router.push(data.weekly.replayRecommendation.href as never)}
                className="active:opacity-90"
              >
                <Surface padding="sm">
                  <View className="mb-1 flex-row items-center">
                    <Ionicons name="play-back-outline" size={16} color={colors.accent.primary} />
                    <Text variant="caption" className="ml-2 font-semibold uppercase tracking-wide text-accent">
                      Replay
                    </Text>
                  </View>
                  <Text variant="label">{data.weekly.replayRecommendation.label}</Text>
                  <Text variant="body-sm" className="mt-1 text-text-secondary">
                    {data.weekly.replayRecommendation.reason}
                  </Text>
                </Surface>
              </Pressable>
            </CollapsibleSection>

            <CollapsibleSection title="This week" description="Habits, strengths, and one challenge.">
              <Row label="Most improved habit" value={data.weekly.mostImprovedHabit} />
              <Row label="Most common mistake" value={data.weekly.mostCommonMistake} />
              <Row label="Greatest strength" value={data.weekly.greatestStrength} />
              <Row label="One challenge" value={data.weekly.challenge} />
              <View className="mt-3 flex-row flex-wrap gap-2">
                <StatPill label="Learning streak" value={`${data.learningStreakDays}d`} />
                <StatPill label="Loop today" value={`${data.loopStepsCompletedToday}/3`} />
                <StatPill label="Process week" value={`${data.processScoreWeek}`} />
                <StatPill label="Regime" value={data.regimeLabel} />
              </View>
            </CollapsibleSection>

            <CollapsibleSection title="Identity" description="Style, risk posture, and preferred conditions.">
              <Text variant="h3" headingLevel={3} className="mb-2">
                {data.identity.styleLabel}
              </Text>
              <Text variant="caption" className="mb-1 text-text-tertiary">
                Risk posture · {data.identity.riskTolerance}
              </Text>
              {data.identity.strengths.length > 0 ? (
                <Text variant="body-sm" className="mb-1 text-text-secondary">
                  Strengths: {data.identity.strengths.join(' · ')}
                </Text>
              ) : null}
              {data.identity.weaknesses.length > 0 ? (
                <Text variant="body-sm" className="mb-1 text-text-secondary">
                  Watch: {data.identity.weaknesses.join(' · ')}
                </Text>
              ) : null}
              {data.identity.preferredRegimes.length > 0 ? (
                <Text variant="body-sm" className="text-text-secondary">
                  Prefers: {data.identity.preferredRegimes.join(' · ')}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Trading DNA memory"
                className="mt-3 min-h-11 flex-row items-center"
                onPress={() => router.push('/decision/intelligence' as never)}
              >
                <Text variant="label" className="text-info">
                  View Personal Intelligence & DNA →
                </Text>
              </Pressable>
            </CollapsibleSection>

            <CollapsibleSection
              title="Evidence and references"
              description="Sources the mentor used and linked coaching surfaces."
            >
              <Text variant="body-sm" className="mb-3 text-text-secondary">
                Current goal: {data.currentGoal}
              </Text>
              {data.evidenceNotes.length > 0 ? (
                <EducationalPanel
                  variant="why"
                  title="Evidence used"
                  body={data.evidenceNotes.join(' · ')}
                />
              ) : null}
              {data.coachingReferences?.length ? (
                <View className="mt-3 gap-2">
                  {data.coachingReferences.map((ref) => (
                    <Pressable
                      key={ref.id}
                      accessibilityRole="button"
                      accessibilityLabel={ref.label}
                      testID={`mentor-ref-${ref.id}`}
                      onPress={() => router.push(ref.href as never)}
                      className="rounded-xl bg-surface px-3 py-3"
                    >
                      <Text variant="label" className="text-accent">
                        {ref.label}
                      </Text>
                      <Text variant="caption" className="mt-1 text-text-secondary">
                        {ref.reason}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </CollapsibleSection>

            <EducationalPanel
              variant="practice"
              body="Your mentor coaches decision quality. It does not predict prices, issue trade signals, or guarantee outcomes."
              learnMoreHref="/settings/educational-mode"
              learnMoreLabel="Educational Mode"
            />
          </>
        ) : null}

        {!isLoading && !data ? (
          <StatusState
            status="empty"
            title="Mentor warming up"
            description="Open Today’s brief and log a few decisions so coaching can personalize from your process — not from market guesses."
          />
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text variant="caption" className="mb-0.5 font-semibold text-text-tertiary">
        {label}
      </Text>
      <Text variant="body-sm" className="leading-relaxed text-text-primary">
        {value}
      </Text>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl bg-surface px-3 py-2">
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text variant="label" className="text-text-primary">
        {value}
      </Text>
    </View>
  );
}
