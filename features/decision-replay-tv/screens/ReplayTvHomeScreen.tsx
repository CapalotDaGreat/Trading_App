import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ReplayTvEpisodeCard } from '@/features/decision-replay-tv/components/ReplayTvEpisodeCard';
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
  episodesForDnaGrowth,
  rankReplayTvEpisodes,
} from '@/features/decision-replay-tv/services/replay-tv-rank.service';
import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { usePersonalIntelligence } from '@/features/personal-intelligence/hooks/usePersonalIntelligence';
import { PremiumPreviewCard } from '@/features/subscription/components/PremiumPreviewCard';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

const EMPTY_GROWTH_EDGES: string[] = [];

function EpisodeRow({
  title,
  description,
  episodes,
  progress,
  isStarting,
  isPremium,
  onBegin,
}: {
  title: string;
  description: string;
  episodes: ReplayTvEpisode[];
  progress: ReturnType<typeof useReplayTv>['progress'];
  isStarting: boolean;
  isPremium: boolean;
  onBegin: (id: string) => void;
}) {
  if (!episodes.length) return null;
  return (
    <CollapsibleSection title={title} description={description} defaultExpanded={false}>
      <View className="gap-3">
        {episodes.slice(0, 6).map((episode) => {
          const premiumLocked = !isPremium && episodeRequiresPremium(episode);
          return (
            <ReplayTvEpisodeCard
              key={episode.id}
              episode={episode}
              completed={progress.completedEpisodeIds.includes(episode.id)}
              bestProcess={progress.bestProcessByEpisode[episode.id]}
              lockedHint={premiumLocked ? 'Premium library' : null}
              onPress={() => {
                if (isStarting) return;
                onBegin(episode.id);
              }}
            />
          );
        })}
      </View>
    </CollapsibleSection>
  );
}

export function ReplayTvHomeScreen() {
  const router = useRouter();
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
  const intelligence = usePersonalIntelligence();
  const growthEdges = intelligence.data?.dna.growthEdges ?? EMPTY_GROWTH_EDGES;

  const rankInput = useMemo(
    () => ({
      markets: profile.markets,
      struggles: profile.struggles,
      styles: profile.styles,
      experience: profile.experience,
      growthEdges,
      completedIds: progress.completedEpisodeIds,
    }),
    [
      profile.markets,
      profile.struggles,
      profile.styles,
      profile.experience,
      growthEdges,
      progress.completedEpisodeIds,
    ],
  );

  const recommended = useMemo(
    () => rankReplayTvEpisodes(REPLAY_TV_EPISODES, rankInput).slice(0, 6),
    [rankInput],
  );
  const dnaEpisodes = useMemo(
    () =>
      episodesForDnaGrowth(REPLAY_TV_EPISODES, growthEdges, progress.completedEpisodeIds).slice(
        0,
        6,
      ),
    [growthEdges, progress.completedEpisodeIds],
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

  const onBegin = (id: string) => {
    void beginEpisode(id).catch(() => {
      /* accessBlock state surfaces calm Premium / monthly preview */
    });
  };

  return (
    <ScreenScaffold
      title="Decision Replay TV"
      subtitle="Practice decision process on historical reconstructions with the future hidden."
      contentClassName="pb-12"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        {accessBlock ? (
          <PremiumPreviewCard
            title={
              accessBlock.reason === 'monthly_limit'
                ? 'Monthly free sessions used'
                : 'Masterclass library'
            }
            teaser={
              accessBlock.message ??
              'Premium unlocks unlimited Replay TV sessions and the full historical library.'
            }
            ctaLabel="See Premium"
            testID="replay-tv-access-preview"
          />
        ) : null}

        {activeSession && activeEpisode ? (
          <Surface tone="accent" emphasis="outlined">
            <Text variant="label" className="text-accent">
              CONTINUE WATCHING
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
              Continue watching
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
              RECOMMENDED FOR YOU
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
              Start blind replay
            </Button>
          </Surface>
        ) : null}

        <Surface padding="sm" tone="subtle">
          <Text variant="label">Progress</Text>
          <Text variant="body-sm" className="mt-1 text-text-secondary">
            {progress.completedEpisodeIds.length}/{REPLAY_TV_EPISODES.length} episodes · streak{' '}
            {progress.streakDays} day{progress.streakDays === 1 ? '' : 's'} ·{' '}
            {progress.attemptCount} attempts
            {!isPremium && progress.monthlyKey
              ? ` · ${progress.monthlyCompletions} this month`
              : ''}
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Mastery and streaks celebrate process completion — never profits.
          </Text>
        </Surface>

        <EpisodeRow
          title="Recommended for You"
          description="Ranked from Mentor Setup markets, styles, struggles, and experience."
          episodes={recommended}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <EpisodeRow
          title="Based on Your Trading DNA"
          description="Rooms that practise your current growth edges — process skills only."
          episodes={dnaEpisodes.length ? dnaEpisodes : beginner.slice(0, 3)}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <EpisodeRow
          title="Beginner Friendly"
          description="Foundation rooms with short, clear process pauses."
          episodes={beginner}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <EpisodeRow
          title="Masterclass"
          description="Advanced and expert historical rooms — Premium library."
          episodes={masterclass}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <EpisodeRow
          title="Historical Events"
          description="Crashes, policy shocks, and regime changes — spoiler-safe teasers only."
          episodes={historical}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <EpisodeRow
          title="Short Sessions"
          description="About 10–15 minutes — one focused process loop."
          episodes={shortSessions}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <EpisodeRow
          title="20-Minute Sessions"
          description="Slightly deeper rooms when you have a longer research block."
          episodes={twentyMinute}
          progress={progress}
          isStarting={isStarting}
          isPremium={isPremium}
          onBegin={onBegin}
        />

        <CollapsibleSection
          title="Collections"
          description="Browse the full taxonomy when you want a specific practice theme."
          defaultExpanded={false}
        >
          <View className="gap-3">
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
                          ? 'Premium library'
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
      </View>
    </ScreenScaffold>
  );
}
