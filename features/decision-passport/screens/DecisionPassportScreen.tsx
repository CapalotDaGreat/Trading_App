import { useRouter } from 'expo-router';
import { Alert, RefreshControl, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { PassportAchievementGrid } from '../components/PassportAchievementGrid';
import { PassportHero } from '../components/PassportHero';
import { BulletList, PassportSectionCard } from '../components/PassportSectionCard';
import { PassportTimeline } from '../components/PassportTimeline';
import { PassportTrendStrip } from '../components/PassportTrendStrip';
import { useDecisionPassport } from '../hooks/useDecisionPassport';
import type { PassportTab } from '../types/passport.types';

const TABS: { value: PassportTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'journey', label: 'Journey' },
  { value: 'achievements', label: 'Achievements' },
];

export function DecisionPassportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { tab, setTab, profile, exportPackage, shareExport, isLoading, isRefetching, refetch } =
    useDecisionPassport();

  return (
    <Screen
      scrollable
      contentClassName="pb-14"
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
        title="Decision Passport"
        subtitle="Personal development profile — never a performance report"
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        <EducationalModeBadge size="md" />
        <EducationalPanel
          variant="why"
          body="Your Passport is a permanent growth record. It composes Decision Log, Journal, Replay, Mentor, Heatmap, Academy, Lab, Portfolio risk, Research Queue, and Trader Memory — without grading profits."
        />

        <SegmentedControl options={TABS} value={tab} onChange={setTab} />

        {isLoading && !profile ? (
          <View className="gap-3">
            <Skeleton height={160} rounded="lg" />
            <Skeleton height={120} rounded="lg" />
            <Skeleton height={120} rounded="lg" />
          </View>
        ) : null}

        {profile ? (
          <>
            <PassportHero profile={profile} />

            {tab === 'overview' ? <OverviewTab profile={profile} router={router} /> : null}
            {tab === 'journey' ? <JourneyTab profile={profile} /> : null}
            {tab === 'achievements' ? (
              <PassportAchievementGrid achievements={profile.achievements} />
            ) : null}

            <View className="gap-2 pt-2">
              <Button onPress={() => router.push('/decision/mentor' as never)}>
                Open Trading Mentor
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/decision/heatmap' as never)}
              >
                Decision Heatmap
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/decision/simulator' as never)}
              >
                Decision Simulator
              </Button>
              <Button
                variant="secondary"
                onPress={() => router.push('/decision/decision-replay' as never)}
              >
                Decision Replay
              </Button>
              <Button variant="secondary" onPress={() => router.push('/journal' as never)}>
                Journal
              </Button>
              <Button variant="ghost" onPress={() => router.push('/decision/memory' as never)}>
                Trader Memory / DNA
              </Button>
              <Button
                variant="outline"
                accessibilityLabel="Share Decision Passport JSON export"
                onPress={() => {
                  void shareExport().catch(() => {
                    Alert.alert(
                      'Export unavailable',
                      exportPackage?.message ??
                        'Could not share the passport export on this device.',
                    );
                  });
                }}
              >
                Share process export
              </Button>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function OverviewTab({
  profile,
  router,
}: {
  profile: NonNullable<ReturnType<typeof useDecisionPassport>['profile']>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View className="gap-4">
      <PassportSectionCard title="Current Focus" bordered delay={40}>
        <Text variant="h3">{profile.currentFocus.headline}</Text>
        <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
          {profile.currentFocus.todaysFocus}
        </Text>
        <Text variant="caption" className="mt-3 text-text-tertiary">
          Improve next: {profile.currentFocus.improveNext}
        </Text>
      </PassportSectionCard>

      <PassportSectionCard title="Mentor Goals" delay={80}>
        <Text variant="body" className="text-text-primary">
          {profile.mentorGoals.currentGoal}
        </Text>
        <Text variant="body-sm" className="mt-2 text-text-secondary">
          Challenge: {profile.mentorGoals.challenge}
        </Text>
        {profile.mentorGoals.academyTitle ? (
          <Button
            className="mt-3"
            variant="secondary"
            onPress={() =>
              router.push(`/academy/lesson/${profile.mentorGoals.academyLessonId}` as never)
            }
          >
            Academy · {profile.mentorGoals.academyTitle}
          </Button>
        ) : null}
        {profile.mentorGoals.replayHref ? (
          <Button
            className="mt-2"
            variant="ghost"
            onPress={() => router.push(profile.mentorGoals.replayHref as never)}
          >
            {profile.mentorGoals.replayLabel ?? 'Open Replay'}
          </Button>
        ) : null}
      </PassportSectionCard>

      <PassportSectionCard title="Trading Identity" delay={120}>
        <Text variant="label">{profile.identity.styleLabel}</Text>
        <Text variant="caption" className="mt-1 capitalize text-text-secondary">
          Risk tolerance · {profile.identity.riskTolerance}
        </Text>
        {profile.identity.preferredAssets.length > 0 ? (
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Focus assets: {profile.identity.preferredAssets.join(' · ')}
          </Text>
        ) : null}
      </PassportSectionCard>

      <PassportSectionCard title="Trading DNA" delay={160}>
        <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
          Strengths
        </Text>
        <BulletList items={profile.strengths} />
        <Text variant="caption" className="mb-1 mt-3 font-semibold text-text-tertiary">
          Weaknesses
        </Text>
        <BulletList items={profile.weaknesses} />
        <Text variant="caption" className="mb-1 mt-3 font-semibold text-text-tertiary">
          Best market conditions
        </Text>
        <BulletList items={profile.bestMarketConditions} />
      </PassportSectionCard>

      <PassportSectionCard title="Psychology Summary" delay={200}>
        <Text variant="body-sm" className="leading-relaxed text-text-secondary">
          {profile.psychologySummary}
        </Text>
      </PassportSectionCard>

      <PassportSectionCard title="Consistency" bordered delay={240}>
        <View className="flex-row gap-2">
          <MiniStat
            label="Consistency"
            value={String(profile.consistency.heatmap?.consistencyScore ?? 0)}
          />
          <MiniStat
            label="Learning"
            value={String(profile.consistency.heatmap?.learningScore ?? 0)}
          />
          <MiniStat
            label="Discipline"
            value={String(profile.consistency.heatmap?.disciplineScore ?? 0)}
          />
        </View>
        <Text variant="caption" className="mt-3 text-text-secondary">
          Week process {profile.consistency.processScoreWeek} · {profile.consistency.insight}
        </Text>
      </PassportSectionCard>

      <PassportSectionCard title="Decision Quality Trend" delay={280}>
        <PassportTrendStrip
          title="Decision Quality"
          points={profile.decisionQualityTrend}
          metric="decisionQualityAvg"
        />
      </PassportSectionCard>

      <PassportSectionCard title="Research Value Trend" delay={320}>
        <PassportTrendStrip
          title="Research Value"
          points={profile.researchValueTrend}
          metric="researchValueAvg"
        />
      </PassportSectionCard>

      {profile.portfolioNote ? (
        <PassportSectionCard title="Portfolio hygiene" delay={360}>
          <Text variant="body-sm" className="text-text-secondary">
            {profile.portfolioNote}
          </Text>
        </PassportSectionCard>
      ) : null}

      {profile.researchQueueNote ? (
        <PassportSectionCard title="Research Queue" delay={400}>
          <Text variant="body-sm" className="text-text-secondary">
            {profile.researchQueueNote}
          </Text>
        </PassportSectionCard>
      ) : null}

      {profile.credentials.length > 0 ? (
        <PassportSectionCard title="Process credentials" delay={440}>
          {profile.credentials.slice(0, 6).map((cred) => (
            <View key={cred.id} className="mb-3 border-b border-border/40 pb-3">
              <Text variant="label">{cred.title}</Text>
              <Text variant="caption" className="mt-1 text-text-secondary">
                {cred.detail}
              </Text>
            </View>
          ))}
        </PassportSectionCard>
      ) : null}
    </View>
  );
}

function JourneyTab({
  profile,
}: {
  profile: NonNullable<ReturnType<typeof useDecisionPassport>['profile']>;
}) {
  return (
    <View className="gap-4">
      <PassportSectionCard title="Learning Journey" bordered>
        <View className="flex-row flex-wrap gap-2">
          <MiniStat label="Academy read" value={String(profile.learningJourney.academyCompleted)} />
          <MiniStat
            label="Practiced"
            value={String(profile.learningJourney.academyPracticed)}
          />
          <MiniStat label="Journals" value={String(profile.learningJourney.journalCount)} />
          <MiniStat label="Replays" value={String(profile.learningJourney.replayCount)} />
          <MiniStat label="Replay TV" value={String(profile.counts.replayTvEpisodes)} />
          <MiniStat label="Lab closes" value={String(profile.learningJourney.labCloses)} />
          <MiniStat
            label="Simulator"
            value={String(profile.learningJourney.simulatorSessions)}
          />
        </View>
        <Text variant="caption" className="mt-3 text-text-secondary">
          Academy progress {profile.academyProgress.percent}% · Lab avg process{' '}
          {profile.learningJourney.labAvgProcess}
        </Text>
        <View className="mt-3">
          <BulletList items={profile.learningMilestones} />
        </View>
      </PassportSectionCard>

      <PassportSectionCard title="Replay History">
        <Text variant="body-sm" className="text-text-secondary">
          {profile.replayHistory.count} completed replay sessions
        </Text>
        <View className="mt-2">
          <BulletList
            items={
              profile.replayHistory.recentNotes.length
                ? profile.replayHistory.recentNotes
                : ['Complete a Chart Replay to populate history']
            }
          />
        </View>
      </PassportSectionCard>

      <PassportSectionCard title="Academy Progress">
        <Text variant="h3">
          {profile.academyProgress.completed}/{profile.academyProgress.total}
        </Text>
        <Text variant="caption" className="mt-1 text-text-secondary">
          {profile.academyProgress.practiced} practiced · soft mastery model
        </Text>
      </PassportSectionCard>

      <PassportSectionCard title="Monthly summaries">
        {profile.monthlySummaries.map((month) => (
          <View key={month.key} className="mb-3 border-b border-border/40 pb-3">
            <Text variant="label">{month.label}</Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              Research {month.researched} · Journal {month.journaled} · Replay {month.replayed} ·
              Passes {month.skippedOrIgnored}
              {month.avgDecisionQuality != null
                ? ` · DQS ${month.avgDecisionQuality}`
                : ''}
            </Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              {month.insight}
            </Text>
          </View>
        ))}
      </PassportSectionCard>

      <PassportSectionCard title="Yearly summaries">
        {profile.yearlySummaries.map((year) => (
          <View key={year.key} className="mb-3 border-b border-border/40 pb-3">
            <Text variant="label">{year.label}</Text>
            <Text variant="caption" className="mt-1 text-text-secondary">
              Research {year.researched} · Journal {year.journaled} · Replay {year.replayed}
              {year.avgResearchValue != null ? ` · RVS ${year.avgResearchValue}` : ''}
            </Text>
            <Text variant="caption" className="mt-1 text-text-tertiary">
              {year.insight}
            </Text>
          </View>
        ))}
      </PassportSectionCard>

      <PassportSectionCard title="Evolution timeline" subtitle="How habits and decision quality changed">
        <PassportTimeline events={profile.timeline} />
      </PassportSectionCard>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[30%] flex-1 rounded-2xl bg-surface px-3 py-2">
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text variant="label" className="mt-0.5">
        {value}
      </Text>
    </View>
  );
}
