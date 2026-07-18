import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
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
  practicedCount?: number;
  isDefault?: boolean;
  isSupporting?: boolean;
  masteryUnlocked?: boolean;
  unlockHint?: string;
  iaHint?: string;
}

export function PathCard({
  id,
  title,
  description,
  icon,
  track,
  completedCount,
  totalCount,
  practicedCount = 0,
  isDefault,
  isSupporting,
  masteryUnlocked,
  unlockHint,
  iaHint,
}: PathCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/academy/path/${id}` as never)}
      className={
        isDefault
          ? 'mb-3 overflow-hidden rounded-2xl border border-accent/40 bg-accent-muted/30 p-4 active:opacity-80'
          : 'mb-3 overflow-hidden rounded-2xl bg-background-elevated p-4 active:opacity-80'
      }
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
          <View className="mb-0.5 flex-row flex-wrap items-center gap-1.5">
            <Text variant="caption" className="uppercase text-text-tertiary">
              {track === 'decision' ? 'Decision coach' : 'Trading school'}
            </Text>
            {isDefault ? <Badge label="Start here" variant="accent" size="sm" /> : null}
            {isSupporting ? <Badge label="Supporting" variant="outline" size="sm" /> : null}
            {masteryUnlocked ? <Badge label="Mastery" variant="success" size="sm" /> : null}
          </View>
          <Text variant="h3">{title}</Text>
          <Text variant="body-sm" className="mt-1" numberOfLines={2}>
            {description}
          </Text>
          {iaHint ? (
            <Text variant="caption" className="mt-1 text-accent">
              {iaHint}
            </Text>
          ) : null}
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
            <View
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </View>
          <Text variant="caption" className="mt-1.5">
            {completedCount}/{totalCount} read · {practicedCount}/{totalCount} practiced
          </Text>
          {unlockHint ? (
            <Text variant="caption" className="mt-1 text-text-tertiary">
              {unlockHint}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
      </View>
    </Pressable>
  );
}
