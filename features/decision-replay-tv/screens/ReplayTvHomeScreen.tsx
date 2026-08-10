import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ReplayTvEpisodeCard } from '@/features/decision-replay-tv/components/ReplayTvEpisodeCard';
import {
  REPLAY_TV_COLLECTIONS,
  REPLAY_TV_EPISODES,
  listEpisodesForCollection,
} from '@/features/decision-replay-tv/content/replay-tv.catalog';
import { useReplayTv } from '@/features/decision-replay-tv/hooks/useReplayTv';
import { rankReplayTvEpisodes } from '@/features/decision-replay-tv/services/replay-tv-rank.service';
import type { ReplayTvCollectionId } from '@/features/decision-replay-tv/types/replay-tv.types';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { ScreenScaffold } from '@/shared/components/layout/ScreenScaffold';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Button } from '@/shared/components/ui/Button';
import { Chip } from '@/shared/components/ui/Chip';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvHomeScreen() {
  const router = useRouter();
  const { activeSession, episode: activeEpisode, beginEpisode, isStarting, progress } = useReplayTv();
  const { profile } = useCoachProfile();
  const [collectionId, setCollectionId] = useState<ReplayTvCollectionId>('featured');

  const episodes = useMemo(() => {
    const base =
      collectionId === 'featured'
        ? listEpisodesForCollection('featured')
        : listEpisodesForCollection(collectionId);
    return rankReplayTvEpisodes(base, {
      markets: profile.markets,
      struggles: profile.struggles,
      completedIds: progress.completedEpisodeIds,
    });
  }, [collectionId, profile.markets, profile.struggles, progress.completedEpisodeIds]);

  const collection = REPLAY_TV_COLLECTIONS.find((c) => c.id === collectionId);
  const featuredEpisode = episodes[0];

  return (
    <ScreenScaffold
      title="Decision Replay TV"
      subtitle="Practice decision process on historical reconstructions with the future hidden."
      contentClassName="pb-12"
    >
      <View className="gap-4">
        <EducationalModeBadge />

        {activeSession && activeEpisode ? (
          <Surface tone="accent" emphasis="outlined">
            <Text variant="label" className="text-accent">CONTINUE REPLAY</Text>
            <Text variant="h2" headingLevel={2} className="mt-2">{activeEpisode.title}</Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              Return to the hidden tape at the point where you paused.
            </Text>
            <Button className="mt-4" onPress={() => router.push('/decision/replay-tv/session' as never)}>
              Continue replay
            </Button>
          </Surface>
        ) : featuredEpisode ? (
          <Surface tone="accent" emphasis="outlined">
            <Text variant="label" className="text-accent">FEATURED FOR YOU</Text>
            <Text variant="h2" headingLevel={2} className="mt-2">{featuredEpisode.title}</Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {featuredEpisode.teaser}
            </Text>
            <Button
              className="mt-4"
              disabled={isStarting}
              onPress={() => void beginEpisode(featuredEpisode.id)}
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
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Mastery and streaks celebrate process completion — never profits.
          </Text>
        </Surface>

        <CollapsibleSection
          title="Replay library"
          description="Choose a collection when you want a different practice context."
        >
          <View className="flex-row flex-wrap gap-2">
            {REPLAY_TV_COLLECTIONS.map((col) => (
              <Chip
                key={col.id}
                label={col.title}
                selected={collectionId === col.id}
                onPress={() => setCollectionId(col.id)}
              />
            ))}
          </View>

          {collection ? (
            <Text variant="body-sm" className="text-text-secondary">
              {collection.description}
            </Text>
          ) : null}

          <View className="gap-3">
            {episodes
              .filter((episode) => activeEpisode?.id !== episode.id)
              .map((episode) => (
                <ReplayTvEpisodeCard
                  key={episode.id}
                  episode={episode}
                  completed={progress.completedEpisodeIds.includes(episode.id)}
                  bestProcess={progress.bestProcessByEpisode[episode.id]}
                  onPress={() => {
                    if (isStarting) return;
                    void beginEpisode(episode.id);
                  }}
                />
              ))}
          </View>
        </CollapsibleSection>
      </View>
    </ScreenScaffold>
  );
}
