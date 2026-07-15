import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

import type { NewsArticle } from '../services/news.service';

interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
  const openArticle = () => {
    if (article.url) {
      void Linking.openURL(article.url);
    }
  };

  return (
    <Pressable accessibilityRole="link" onPress={openArticle}>
      <GlassCard className="mb-3 overflow-hidden">
        {!compact && article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            className="h-36 w-full"
            contentFit="cover"
            accessibilityLabel=""
          />
        ) : null}
        <View className="p-3">
          <View className="mb-1 flex-row items-center justify-between">
            <Text variant="caption" className="text-accent">
              {article.source}
            </Text>
            <Text variant="caption" className="text-text-tertiary">
              {formatRelativeTime(article.publishedAt)}
            </Text>
          </View>
          <Text variant="h3" numberOfLines={compact ? 2 : 3}>
            {article.title}
          </Text>
          {!compact && article.description ? (
            <Text variant="body-sm" numberOfLines={3} className="mt-2">
              {article.description}
            </Text>
          ) : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}
