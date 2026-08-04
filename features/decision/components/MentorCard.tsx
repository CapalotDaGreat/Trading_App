import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import type { TradingMentorBrief } from '@/features/decision/types/mentor.types';
import { useFeatureFlag } from '@/features/ops-config/hooks/useOpsConfig';
import { GlassCard } from '@/shared/components/ui/GlassCard';
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
      <GlassCard className="p-4" bordered>
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-info-muted">
                <Ionicons name="compass" size={16} color={colors.info.primary} />
              </View>
              <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
                Trading Mentor
              </Text>
            </View>
            <EducationalModeBadge className="mb-2" />
            <Text variant="h3" className="leading-snug text-text-primary">
              {brief.daily.headline}
            </Text>
            <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
              {brief.daily.todaysFocus}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </View>

        <View className="mt-1 flex-row flex-wrap gap-2">
          <MetaChip label={`${brief.learningStreakDays}d streak`} />
          <MetaChip label={`Process ${brief.processScoreWeek}`} />
          <MetaChip label={`${brief.loopStepsCompletedToday}/3 loop`} />
          <MetaChip label={brief.identity.styleLabel} />
        </View>

        <Text variant="caption" className="mt-3 text-info">
          Open mentor · DNA, graph, passport, replay, academy
        </Text>
      </GlassCard>
    </Pressable>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <View className="rounded-pill bg-surface px-2.5 py-1">
      <Text variant="caption" className="text-text-secondary">
        {label}
      </Text>
    </View>
  );
}
