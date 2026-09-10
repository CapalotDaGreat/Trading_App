import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ReplayTvEpisodeCard } from '@/features/decision-replay-tv/components/ReplayTvEpisodeCard';
import { ReplayTvSkillProgressCard } from '@/features/decision-replay-tv/components/ReplayTvSkillProgressCard';
import {
  REPLAY_TV_COLLECTIONS,
  REPLAY_TV_EPISODES,
  listByDifficulty,
  listEpisodesForCollection,
  listSessionsAroundMinutes,
  listShortSessions,
} from '@/features/decision-replay-tv/content/replay-tv.catalog';
import { useReplayTv } from '@/features/decision-replay-tv/hooks/useReplayTv';
import { episodeRequiresPremium } from '@/features/decision-replay-tv/services/replay-tv-access.service';
import {
  filterReplayTvLibrary,
  type ReplayTvCompletedFilter,
  type ReplayTvDifficultyFilter,
  type ReplayTvDurationFilter,
  type ReplayTvMarketFilter,
  type ReplayTvThemeFilter,
  type ReplayTvWeakAreaFilter,
  inferWeakAreaFromProgress,
} from '@/features/decision-replay-tv/services/replay-tv-filter.service';
import {
  episodesForDnaGrowth,
  rankReplayTvEpisodes,
} from '@/features/decision-replay-tv/services/replay-tv-rank.service';
import { deriveReplayTvSkillProgress } from '@/features/decision-replay-tv/services/replay-tv-skills.service';
import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import { LoopCtaRow } from '@/features/navigation/components/LoopCtaRow';
import { TrainingHandoffBanner } from '@/features/learning-engine/components/TrainingHandoffBanner';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';
import { PremiumPreviewCard } from '@/features/subscription/components/PremiumPreviewCard';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { FilterChip } from '@/shared/components/ui/FilterChip';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { CALM_ATTENTION } from '@/shared/constants/trust-language';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { trackEvent } from '@/shared/services/analytics';

const EMPTY_GROWTH_EDGES: string[] = [];

function EpisodeRow({
  title,
  description,
  episodes,
  progress,
  isStarting,
  isPremium,
  onBegin,
  defaultExpanded = false,
  plain = false,
}: {
  title: string;
  description: string;
  episodes: ReplayTvEpisode[];
  progress: ReturnType<typeof useReplayTv>['progress'];
  isStarting: boolean;
  isPremium: boolean;
  onBegin: (id: string) => void;
  defaultExpanded?: boolean;
  /** Flattened list — use inside an outer collapsible so rooms are not nested. */
  plain?: boolean;
}) {
  if (!episodes.length) return null;
  const list = (
    <View className="gap-3">
      {episodes.slice(0, 6).map((episode) => {
        const premiumLocked = !isPremium && episodeRequiresPremium(episode);
        return (
          <ReplayTvEpisodeCard
            key={episode.id}
            episode={episode}
            completed={progress.completedEpisodeIds.includes(episode.id)}
            bestProcess={progress.bestProcessByEpisode[episode.id]}
            lockedHint={premiumLocked ? CALM_ATTENTION.includedWithPremium : null}
            onPress={() => {
              if (isStarting) return;
              onBegin(episode.id);
            }}
          />
        );
      })}
    </View>
  );
  if (plain) {
    return (
      <View className="gap-2">
        <Text variant="label">{title}</Text>
        <Text variant="caption" className="text-text-tertiary">
          {description}
        </Text>
        {list}
      </View>
    );
  }
  return (
    <CollapsibleSection title={title} description={description} defaultExpanded={defaultExpanded}>
      {list}
    </CollapsibleSection>
  );
}

export function ReplayTvHomeScreen() {
  const router = useRouter();
  const { episode: episodeParam } = useLocalSearchParams<{ episode?: string }>();
  const episodeKickoff = useRef<string | null>(null);
  const {
    activeSession,
    episode: activeEpisode,
    beginEpisode,
    isStarting,
    progress,
    accessBlock,
    clearAccessBlock,
    isPremium,
  } = useReplayTv();
  const { profile } = useCoachProfile();
  const { isOnline } = useOnlineStatus();
  const intelligence = usePersonalIntelligence();
  const growthEdges = intelligence.data?.dna.growthEdges ?? EMPTY_GROWTH_EDGES;
  const reinforcementTrait = intelligence.data?.reinforcement?.primaryPractice?.traitId;
  const rankEdges = useMemo(() => {
    if (!reinforcementTrait) return growthEdges;
    return [...growthEdges, reinforcementTrait.replace(/([A-Z])/g, ' $1').toLowerCase()];
  }, [growthEdges, reinforcementTrait]);
  const [difficultyFilter, setDifficultyFilter] = useState<ReplayTvDifficultyFilter>('all');
  const [marketFilter, setMarketFilter] = useState<ReplayTvMarketFilter>('all');
  const [themeFilter, setThemeFilter] = useState<ReplayTvThemeFilter>('all');
  const [durationFilter, setDurationFilter] = useState<ReplayTvDurationFilter>('all');
  const [completedFilter, setCompletedFilter] = useState<ReplayTvCompletedFilter>('all');
  const [weakAreaFilter, setWeakAreaFilter] = useState<ReplayTvWeakAreaFilter>('all');

  const rankInput = useMemo(
    () => ({
      markets: profile.markets,
      struggles: [
        ...(profile.struggles ?? []),
        inferWeakAreaFromProgress(progress) === 'breakouts' ? 'breakout' : '',
        inferWeakAreaFromProgress(progress) === 'risk' ? 'risk' : '',
      ].filter(Boolean),
      styles: profile.styles,
      experience: profile.experience,
      growthEdges: rankEdges,
      completedIds: progress.completedEpisodeIds,
      practiceTraitId: reinforcementTrait ?? null,
    }),
    [
      profile.markets,
      profile.struggles,
      profile.styles,
      profile.experience,
      rankEdges,
      progress.completedEpisodeIds,
      progress.bestProcessByEpisode,
      reinforcementTrait,
    ],
  );

  const recommended = useMemo(
    () => rankReplayTvEpisodes(REPLAY_TV_EPISODES, rankInput).slice(0, 6),
    [rankInput],
  );
  const dnaEpisodes = useMemo(
    () =>
      episodesForDnaGrowth(REPLAY_TV_EPISODES, rankEdges, progress.completedEpisodeIds).slice(
        0,
        6,
      ),
    [rankEdges, progress.completedEpisodeIds],
  );
  const beginner = useMemo(() => listByDifficulty('foundation'), []);
  const masterclass = useMemo(
    () =>
      rankReplayTvEpisodes(listByDifficulty(['advanced', 'expert']), rankInput).slice(0, 6),
    [rankInput],
  );
  const historical = useMemo(
    () =>
      rankReplayTvEpisodes(
        [
          ...listEpisodesForCollection('crashes'),
          ...listEpisodesForCollection('policy'),
          ...listEpisodesForCollection('regime_changes'),
        ].filter(
          (ep, i, arr) => arr.findIndex((x) => x.id === ep.id) === i,
        ),
        rankInput,
      ).slice(0, 8),
    [rankInput],
  );
  const shortSessions = useMemo(() => listShortSessions(15), []);
  const twentyMinute = useMemo(() => listSessionsAroundMinutes(20), []);
  const filteredLibrary = useMemo(
    () =>
      rankReplayTvEpisodes(
        filterReplayTvLibrary(REPLAY_TV_EPISODES, {
          difficulty: difficultyFilter,
          market: marketFilter,
          theme: themeFilter,
          duration: durationFilter,
          completed: completedFilter,
          weakArea: weakAreaFilter,
          completedIds: progress.completedEpisodeIds,
        }),
        rankInput,
      ),
    [difficultyFilter, marketFilter, themeFilter, durationFilter, completedFilter, weakAreaFilter, rankInput, progress],
  );
  const filtersActive =
    difficultyFilter !== 'all' ||
    marketFilter !== 'all' ||
    themeFilter !== 'all' ||
    durationFilter !== 'all' ||
    completedFilter !== 'all' ||
    weakAreaFilter !== 'all';
  const skillProgress = useMemo(() => deriveReplayTvSkillProgress(progress), [progress]);

  const onBegin = (id: string) => {
    void beginEpisode(id).catch(() => {
      /* accessBlock state surfaces calm Premium / monthly preview */
    });
  };

  useEffect(() => {
    if (!episodeParam || episodeKickoff.current === episodeParam) return;
    episodeKickoff.current = episodeParam;
    void beginEpisode(episodeParam).catch(() => {
      /* accessBlock surfaces Premium / missing episode */
    });
  }, [beginEpisode, episodeParam]);

  return (
    <ScreenScaffold
      title="Decision Replay TV"
      subtitle="Can you make a good decision without knowing what happens next?"
      contentClassName="pb-12"
    >
      <View className="gap-4">
        <EducationalModeBadge />
        <TrainingHandoffBanner />

        {!isOnline ? (
          <Text variant="caption" className="text-text-tertiary">
            Replay rooms are stored on this device. Educational sample tapes still work offline.
          </Text>
        ) : null}

        <Surface padding="md" tone="subtle" testID="replay-tv-intro">
          <Text variant="h3" headingLevel={2}>
            The future stays hidden until you commit.
          </Text>
          <Text variant="body-sm" className="mt-2 leading-6 text-text-secondary">
            If the freeze is 10 January, you do not get the 11 January tape, headlines, or outcome.
            That is the historical information boundary.
          </Text>
          <Text variant="body-sm" className="mt-2 leading-6 text-text-secondary">
            Practice research-time decisions on a blind tape. Waiting is a valid expert decision.
            Scores measure process (DQS), never whether price went your way.
          </Text>
        </Surface>

        {accessBlock ? (
          <PremiumPreviewCard
            title={
              accessBlock.reason === 'monthly_limit'
                ? 'Monthly free sessions used'
                : 'Masterclass library'
            }
            teaser={
              accessBlock.message ??
              'Premium includes unlimited Replay TV sessions and the full historical library.'
            }
            ctaLabel={CALM_ATTENTION.seePremium}
            testID="replay-tv-access-preview"
          />
        ) : null}

        {activeSession && activeEpisode ? (
          <Surface tone="accent" emphasis="outlined">
            <Text variant="label" className="text-accent">
              {CALM_ATTENTION.continueSession}
            </Text>
            <Text variant="h2" headingLevel={2} className="mt-2">
              {activeEpisode.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Return to the hidden tape at the point where you paused. Freeze state is preserved.
            </Text>
            <Button
              className="mt-4"
              onPress={() => router.push('/decision/replay-tv/session' as never)}
            >
              {CALM_ATTENTION.continueSession}
            </Button>
            {accessBlock ? (
              <Button className="mt-2" variant="ghost" onPress={clearAccessBlock}>
                Dismiss notice
              </Button>
            ) : null}
          </Surface>
        ) : recommended[0] ? (
          <Surface tone="accent" emphasis="outlined">
            <Text variant="label" className="text-accent">
              Next session
            </Text>
            <Text variant="h2" headingLevel={2} className="mt-2">
              {recommended[0].title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {recommended[0].teaser}
            </Text>
            <Button
              className="mt-4"
              disabled={isStarting}
              onPress={() => onBegin(recommended[0]!.id)}
            >
              Start process practice
            </Button>
          </Surface>
        ) : null}

        <CollapsibleSection
          title="Progress"
          description="Completed rooms and process skills — never whether the tape paid."
          defaultExpanded={false}
          testID="replay-tv-progress"
        >
          <Surface padding="sm" tone="subtle">
            <Text variant="label">Sessions completed</Text>
            <Text variant="body-sm" className="mt-1 text-text-secondary">
              {progress.completedEpisodeIds.length}/{REPLAY_TV_EPISODES.length} episodes · streak{' '}
              {progress.streakDays} day{progress.streakDays === 1 ? '' : 's'}
            </Text>
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Streaks celebrate process completion — never profits.
            </Text>
          </Surface>
          <View className="mt-3">
            <ReplayTvSkillProgressCard skills={skillProgress} />
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          title="Find a room"
          description="Difficulty, market, and theme — when you want to browse."
          defaultExpanded={false}
          testID="replay-tv-filters"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pr-4">
              {(
                [
                  ['all', 'All levels'],
                  ['beginner', 'Beginner'],
                  ['intermediate', 'Intermediate'],
                  ['advanced', 'Advanced'],
                  ['mixed', 'Unlabeled'],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  selected={difficultyFilter === id}
                  accessibilityRole="tab"
                  accessibilityLabel={`${label} difficulty`}
                  onPress={() => {
                    setDifficultyFilter(id);
                    if (id !== 'all') {
                      void trackEvent('replay_difficulty_selected', { difficulty: id });
                    }
                  }}
                />
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pr-4">
              {(
                [
                  ['all', 'All markets'],
                  ['forex', 'Forex'],
                  ['crypto', 'Crypto'],
                  ['stocks', 'Stocks'],
                  ['indices', 'Indices'],
                  ['commodities', 'Commodities'],
                  ['macro', 'Macro'],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  selected={marketFilter === id}
                  accessibilityRole="tab"
                  accessibilityLabel={`${label} market`}
                  onPress={() => setMarketFilter(id)}
                />
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pr-4">
              {(
                [
                  ['all', 'All themes'],
                  ['macro', 'Macro events'],
                  ['patterns', 'Technical patterns'],
                  ['psychology', 'Psychology'],
                  ['risk', 'Risk management'],
                  ['volatility', 'Volatility'],
                  ['patience', 'Patience'],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  selected={themeFilter === id}
                  accessibilityRole="tab"
                  accessibilityLabel={`${label} theme`}
                  onPress={() => setThemeFilter(id)}
                />
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pr-4">
              {(
                [
                  ['all', 'Any length'],
                  ['short', 'Short'],
                  ['standard', 'Standard'],
                  ['long', 'Longer'],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  selected={durationFilter === id}
                  onPress={() => setDurationFilter(id)}
                />
              ))}
              {(
                [
                  ['all', 'All rooms'],
                  ['todo', 'Not done'],
                  ['done', 'Completed'],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  selected={completedFilter === id}
                  onPress={() => setCompletedFilter(id)}
                />
              ))}
              {(
                [
                  ['all', 'Any weak area'],
                  ['breakouts', 'Breakouts'],
                  ['risk', 'Risk'],
                  ['patience', 'Patience'],
                  ['uncertainty', 'Uncertainty'],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  selected={weakAreaFilter === id}
                  onPress={() => setWeakAreaFilter(id)}
                />
              ))}
            </View>
          </ScrollView>
        </CollapsibleSection>

        {filtersActive ? (
          <EpisodeRow
            title="Matching rooms"
            description="Spoiler-safe teasers only — outcomes stay hidden."
            episodes={filteredLibrary}
            progress={progress}
            isStarting={isStarting}
            isPremium={isPremium}
            onBegin={onBegin}
            defaultExpanded
          />
        ) : (
          <EpisodeRow
            title="Practice this skill"
            description="Rooms mapped to your current Trading DNA growth areas."
            episodes={dnaEpisodes.length ? dnaEpisodes : beginner.slice(0, 3)}
            progress={progress}
            isStarting={isStarting}
            isPremium={isPremium}
            onBegin={onBegin}
            defaultExpanded
          />
        )}

        <CollapsibleSection
          title="More rooms"
          description="Beginner, masterclass, history, and collections — when you want to browse."
          defaultExpanded={false}
        >
          <View className="gap-3">
            <EpisodeRow
              title="Recommended"
              description="From Mentor Setup markets, styles, and struggles."
              episodes={recommended}
              progress={progress}
              isStarting={isStarting}
              isPremium={isPremium}
              onBegin={onBegin}
              plain
            />
            <EpisodeRow
              title="Foundation"
              description="Short, clear process pauses."
              episodes={beginner}
              progress={progress}
              isStarting={isStarting}
              isPremium={isPremium}
              onBegin={onBegin}
              plain
            />
            <EpisodeRow
              title="Masterclass"
              description="Advanced historical rooms — included with Premium."
              episodes={masterclass}
              progress={progress}
              isStarting={isStarting}
              isPremium={isPremium}
              onBegin={onBegin}
              plain
            />
            <EpisodeRow
              title="Historical events"
              description="Crashes, policy shocks, and regime changes — teasers only."
              episodes={historical}
              progress={progress}
              isStarting={isStarting}
              isPremium={isPremium}
              onBegin={onBegin}
              plain
            />
            <EpisodeRow
              title="Short sessions"
              description="About 10–15 minutes."
              episodes={shortSessions}
              progress={progress}
              isStarting={isStarting}
              isPremium={isPremium}
              onBegin={onBegin}
              plain
            />
            <EpisodeRow
              title="Longer sessions"
              description="About 20 minutes when you have a deeper research block."
              episodes={twentyMinute}
              progress={progress}
              isStarting={isStarting}
              isPremium={isPremium}
              onBegin={onBegin}
              plain
            />
            {REPLAY_TV_COLLECTIONS.map((col) => {
              const items = rankReplayTvEpisodes(
                listEpisodesForCollection(col.id),
                rankInput,
              ).slice(0, 3);
              if (!items.length) return null;
              return (
                <View key={col.id} className="gap-2">
                  <Text variant="label">{col.title}</Text>
                  <Text variant="caption" className="text-text-tertiary">
                    {col.description}
                  </Text>
                  {items.map((episode) => (
                    <ReplayTvEpisodeCard
                      key={episode.id}
                      episode={episode}
                      completed={progress.completedEpisodeIds.includes(episode.id)}
                      bestProcess={progress.bestProcessByEpisode[episode.id]}
                      lockedHint={
                        !isPremium && episodeRequiresPremium(episode)
                          ? CALM_ATTENTION.includedWithPremium
                          : null
                      }
                      onPress={() => onBegin(episode.id)}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </CollapsibleSection>
        <LoopCtaRow current="replay" title="After a historical room" />
      </View>
    </ScreenScaffold>
  );
}
