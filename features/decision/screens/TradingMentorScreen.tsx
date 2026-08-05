import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { useTradingMentor } from '@/features/decision/hooks/useTradingMentor';
import { MentorSetupInviteCard } from '@/features/onboarding/components/MentorSetupInviteCard';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export function TradingMentorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useTradingMentor();
  const { showMentorSetupInvite, dismissMentorInvite, mentorSetupCompleted } = useCoachProfile();

  return (
    <Screen
      scrollable
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
    >
      <Header
        title="Trading Mentor"
        subtitle="Long-term process coach — never market predictions"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        {showMentorSetupInvite ? (
          <MentorSetupInviteCard onLater={() => void dismissMentorInvite()} />
        ) : null}
        {!mentorSetupCompleted && !showMentorSetupInvite ? (
          <Button variant="outline" onPress={() => router.push('/onboarding' as never)}>
            Refresh your coach profile
          </Button>
        ) : null}
        <EducationalModeBadge size="md" />

        {isLoading && !data ? (
          <View className="gap-3">
            <Skeleton height={140} rounded="lg" />
            <Skeleton height={180} rounded="lg" />
          </View>
        ) : null}

        {data ? (
          <>
            <GlassCard className="p-4" bordered>
              <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
                Today&apos;s focus
              </Text>
              <Text variant="h2" className="mt-2 leading-snug">
                {data.daily.headline}
              </Text>
              <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
                {data.daily.todaysFocus}
              </Text>
              <Text variant="body-sm" className="mt-3 leading-relaxed text-text-secondary">
                {data.daily.detail}
              </Text>
            </GlassCard>

            <EducationalPanel
              variant="tip"
              title="What should I improve?"
              body={data.daily.improveNext}
            />
            <EducationalPanel
              variant="risk"
              title="What mistakes am I repeating?"
              body={data.daily.repeatingMistake}
            />

            <GlassCard className="p-4">
              <Text variant="caption" className="mb-1 font-semibold uppercase tracking-wide text-text-tertiary">
                Current goal
              </Text>
              <Text variant="body" className="leading-relaxed text-text-primary">
                {data.currentGoal}
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                <StatPill label="Learning streak" value={`${data.learningStreakDays}d`} />
                <StatPill label="Loop today" value={`${data.loopStepsCompletedToday}/3`} />
                <StatPill label="Process week" value={`${data.processScoreWeek}`} />
                <StatPill label="Regime" value={data.regimeLabel} />
              </View>
            </GlassCard>

            <GlassCard className="p-4">
              <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
                Weekly progress
              </Text>
              <Row label="Most improved habit" value={data.weekly.mostImprovedHabit} />
              <Row label="Most common mistake" value={data.weekly.mostCommonMistake} />
              <Row label="Greatest strength" value={data.weekly.greatestStrength} />
              <Row label="One challenge" value={data.weekly.challenge} />
            </GlassCard>

            <GlassCard className="p-4">
              <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
                Trading identity
              </Text>
              <Text variant="h3" className="mb-2">
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
            </GlassCard>

            {data.coachingReferences?.length ? (
              <GlassCard className="p-4">
                <Text variant="caption" className="mb-2 font-semibold uppercase tracking-wide text-text-tertiary">
                  Mentor references
                </Text>
                <Text variant="body-sm" className="mb-3 text-text-secondary">
                  Passport · Replay · Academy · Journal · Decision Graph · DNA · Heatmap · Decision Log
                </Text>
                <View className="gap-2">
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
              </GlassCard>
            ) : null}

            {data.weekly.academyRecommendation ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open Academy lesson ${data.weekly.academyRecommendation.title}`}
                onPress={() =>
                  router.push(
                    `/academy/lesson/${data.weekly.academyRecommendation!.lessonId}` as never,
                  )
                }
                className="active:opacity-90"
              >
                <GlassCard className="p-4">
                  <View className="mb-1 flex-row items-center">
                    <Ionicons name="school-outline" size={16} color={colors.info.primary} />
                    <Text variant="caption" className="ml-2 font-semibold uppercase tracking-wide text-info">
                      Academy recommendation
                    </Text>
                  </View>
                  <Text variant="label" className="text-text-primary">
                    {data.weekly.academyRecommendation.title}
                  </Text>
                  <Text variant="body-sm" className="mt-1 text-text-secondary">
                    {data.weekly.academyRecommendation.reason}
                  </Text>
                </GlassCard>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={data.weekly.replayRecommendation.label}
              onPress={() => router.push(data.weekly.replayRecommendation.href as never)}
              className="active:opacity-90"
            >
              <GlassCard className="p-4">
                <View className="mb-1 flex-row items-center">
                  <Ionicons name="play-back-outline" size={16} color={colors.accent.primary} />
                  <Text variant="caption" className="ml-2 font-semibold uppercase tracking-wide text-accent">
                    Replay recommendation
                  </Text>
                </View>
                <Text variant="label" className="text-text-primary">
                  {data.weekly.replayRecommendation.label}
                </Text>
                <Text variant="body-sm" className="mt-1 text-text-secondary">
                  {data.weekly.replayRecommendation.reason}
                </Text>
              </GlassCard>
            </Pressable>

            {data.evidenceNotes.length > 0 ? (
              <EducationalPanel
                variant="why"
                title="Evidence used"
                body={data.evidenceNotes.join(' · ')}
              />
            ) : null}

            <EducationalPanel
              variant="practice"
              body="Your mentor coaches decision quality. It does not predict prices, issue trade signals, or guarantee outcomes."
              learnMoreHref="/settings/educational-mode"
              learnMoreLabel="Educational Mode"
            />
          </>
        ) : null}

        {!isLoading && !data ? (
          <GlassCard className="p-4">
            <Text variant="h3">Mentor warming up</Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Open Today&apos;s brief and log a few decisions so coaching can personalize from your
              process — not from market guesses.
            </Text>
          </GlassCard>
        ) : null}

        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/decision/heatmap' as never)}
          className="rounded-2xl border border-border px-4 py-3 active:opacity-70"
        >
          <Text variant="label" className="text-accent">
            View Decision Heatmap
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            Process consistency across time — never profits
          </Text>
        </Pressable>
      </View>
    </Screen>
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
