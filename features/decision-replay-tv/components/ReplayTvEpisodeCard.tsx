import { Pressable, View } from 'react-native';

import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';
import { Chip } from '@/shared/components/ui/Chip';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

interface ReplayTvEpisodeCardProps {
  episode: ReplayTvEpisode;
  completed?: boolean;
  bestProcess?: number;
  onPress: () => void;
  lockedHint?: string | null;
}

const DIFFICULTY_LABEL: Record<ReplayTvEpisode['difficulty'], string> = {
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function ReplayTvEpisodeCard({
  episode,
  completed,
  bestProcess,
  onPress,
  lockedHint,
}: ReplayTvEpisodeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        `Open Replay TV episode ${episode.title}`,
        episode.eraLabel,
        episode.symbolLabel,
        `${episode.durationMinutes} minutes`,
        DIFFICULTY_LABEL[episode.difficulty],
        completed ? 'Completed' : null,
        bestProcess != null ? `Best decision quality score ${bestProcess}` : null,
        lockedHint,
        'Blind tape. Outcome hidden.',
      ]
        .filter(Boolean)
        .join('. ')}
      accessibilityHint="Starts or resumes a blind educational replay. Future prices stay hidden."
      testID={`replay-tv-episode-${episode.id}`}
    >
      <GlassCard className="p-4" bordered>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text variant="caption" className="text-text-tertiary">
              {episode.eraLabel} · {episode.symbolLabel} · {episode.durationMinutes} min ·{' '}
              {episode.markets[0]}
            </Text>
            <Text variant="h3" className="mt-1">
              {episode.title}
            </Text>
            <Text variant="body-sm" className="mt-2 text-text-secondary">
              {episode.teaser}
            </Text>
            <Text variant="caption" className="mt-2 text-text-tertiary">
              Skills: {episode.skills.slice(0, 4).join(' · ')}
            </Text>
          </View>
          <Chip label={DIFFICULTY_LABEL[episode.difficulty]} />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {completed ? <Chip label="Completed" tone="success" /> : null}
          {bestProcess != null ? (
            <Chip label={`Best DQS ${bestProcess}`} />
          ) : null}
          <Chip label="Blind tape" />
          {lockedHint ? <Chip label={lockedHint} /> : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}
