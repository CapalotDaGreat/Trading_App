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
import { EducationalPanel } from '@/features/educational/components/EducationalPanel';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Chip } from '@/shared/components/ui/Chip';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

export function ReplayTvHomeScreen() {
  const router = useRouter();
  const { beginEpisode, isStarting, progress } = useReplayTv();
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

  return (
    <Screen scrollable contentClassName="pb-12">
      <Header
        title="Decision Replay TV"
        subtitle="Famous tapes. Blind future. Process only."
        onBack={() => router.back()}
      />

      <View className="mt-4 gap-4">
        <EducationalModeBadge />
        <EducationalPanel
          variant="practice"
          body="Replay historical market episodes with future candles hidden. Pause, decide what you would research, answer the mentor, then compare with history. No buy signals. No fake P&L contests."
        />

        <GlassCard className="p-4" bordered>
          <Text variant="h3">Your progress</Text>
          <Text variant="body-sm" className="mt-2 text-text-secondary">
            {progress.completedEpisodeIds.length}/{REPLAY_TV_EPISODES.length} episodes · streak{' '}
            {progress.streakDays} day{progress.streakDays === 1 ? '' : 's'} ·{' '}
            {progress.attemptCount} attempts
          </Text>
          <Text variant="caption" className="mt-2 text-text-tertiary">
            Mastery and streaks celebrate process completion — never profits.
          </Text>
        </GlassCard>

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
          {episodes.map((episode) => (
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
      </View>
    </Screen>
  );
}
