import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { TradingMentorBrief } from '@/features/decision/types/mentor.types';
import { useFeatureFlag } from '@/features/ops-config/hooks/useOpsConfig';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { trackFeatureUse } from '@/shared/services/analytics';

interface MentorCardProps {
  brief?: TradingMentorBrief | null;
  isLoading?: boolean;
}

/** Compact Trading Mentor card for the Today screen. */
export function MentorCard({ brief, isLoading }: MentorCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const mentorEnabled = useFeatureFlag('mentorEnabled');

  if (isLoading && !brief) {
    return <Skeleton height={160} rounded="lg" testID="mentor-card-loading" />;
  }

  if (!brief || !mentorEnabled) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Trading Mentor"
      accessibilityHint="Expands today's coaching focus into the full mentor page"
      testID="mentor-card"
      onPress={() => {
        trackFeatureUse('mentor');
        router.push('/decision/mentor' as never);
      }}
      className="active:opacity-90"
    >
      <Surface className="p-4" emphasis="outlined" testID="mentor-card-surface">
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-info-muted">
                <Ionicons name="compass" size={16} color={colors.info.primary} />
              </View>
              <Text variant="caption" className="font-medium text-info">
                Trading Mentor
              </Text>
            </View>
            <Text variant="h3" className="leading-snug text-text-primary">
              {brief.daily.headline}
            </Text>
            <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
              {brief.daily.todaysFocus}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </View>

        <Text variant="caption" className="text-info">
          Open Trading Mentor
        </Text>
      </Surface>
    </Pressable>
  );
}
