import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

import { EmbeddedAiInsight } from '@/features/decision/components/EmbeddedAiInsight';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Text } from '@/shared/components/ui/Text';

import { useNews } from '../hooks/useNews';
import { NewsCard } from './NewsCard';

interface NewsFeedProps {
  query?: string;
  category?: 'business' | 'technology' | 'general';
}

export function NewsFeed({ query, category }: NewsFeedProps) {
  const router = useRouter();
  const {
    articles,
    source,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNews({ query, category, pageSize: 15 });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Unable to load news"
        description="Check your connection and try again."
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        title="No news found"
        description="Try a different search or check back later."
      />
    );
  }

  const top = articles[0];
  const decisionBody = top
    ? `"${top.title}" — treat this as a research trigger, not a trade signal. Cross-check levels on the chart before acting.`
    : 'Scan headlines for catalysts, then verify on Setup Radar.';

  return (
    <View className="flex-1">
      <EmbeddedAiInsight
        className="mb-3"
        title="News → decision"
        body={decisionBody}
        onExplain={() => router.push('/decision/radar' as never)}
      />
      {source ? (
        <Text variant="caption" className="mb-2 text-text-tertiary">
          Source: {source}
        </Text>
      ) : null}
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsCard article={item} />}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => void refetch()} tintColor="#00D4AA" />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator className="py-4" color="#00D4AA" />
          ) : null
        }
      />
    </View>
  );
}
