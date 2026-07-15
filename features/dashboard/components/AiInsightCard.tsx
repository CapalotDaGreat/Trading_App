import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Text } from '@/shared/components/ui/Text';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiInsightPreview } from '../services/dashboard.service';

interface AiInsightCardProps {
  data?: AiInsightPreview;
  isLoading?: boolean;
}

const SENTIMENT_VARIANTS: Record<
  AiInsightPreview['sentiment'],
  'success' | 'danger' | 'default'
> = {
  bullish: 'success',
  bearish: 'danger',
  neutral: 'default',
};

export function AiInsightCard({ data, isLoading }: AiInsightCardProps) {
  const router = useRouter();

  if (isLoading || !data) {
    return (
      <GlassCard className="p-4" glow>
        <Skeleton height={20} width="60%" className="mb-3" />
        <Skeleton height={60} />
      </GlassCard>
    );
  }

  return (
    <Pressable onPress={() => router.push('/ai' as never)}>
      <GlassCard className="p-4" glow>
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles" size={18} color="#00D4AA" />
            <Text variant="h3">AI Insight</Text>
          </View>
          <Badge label={data.sentiment} variant={SENTIMENT_VARIANTS[data.sentiment]} size="sm" />
        </View>

        <Text variant="body-sm" className="leading-relaxed">
          {data.summary}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <Text variant="caption">{formatRelativeTime(data.generatedAt)}</Text>
          <View className="flex-row items-center gap-1">
            <Text variant="caption" className="text-accent">
              Ask AI
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#00D4AA" />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}
