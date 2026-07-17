import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface PathCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  track: 'decision' | 'classic';
  completedCount: number;
  totalCount: number;
}

export function PathCard({
  id,
  title,
  description,
  icon,
  track,
  completedCount,
  totalCount,
}: PathCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/academy/path/${id}` as never)}
      className="mb-3 overflow-hidden rounded-2xl bg-background-elevated p-4 active:opacity-80"
    >
      <View className="flex-row items-start">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-surface">
          <Ionicons
            name={(icon as keyof typeof Ionicons.glyphMap) || 'book-outline'}
            size={20}
            color={colors.accent.primary}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text variant="caption" className="mb-0.5 uppercase text-text-tertiary">
            {track === 'decision' ? 'Decision coach' : 'Trading school'}
          </Text>
          <Text variant="h3">{title}</Text>
          <Text variant="body-sm" className="mt-1" numberOfLines={2}>
            {description}
          </Text>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
            <View
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </View>
          <Text variant="caption" className="mt-1.5">
            {completedCount}/{totalCount} lessons complete
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </View>
    </Pressable>
  );
}
