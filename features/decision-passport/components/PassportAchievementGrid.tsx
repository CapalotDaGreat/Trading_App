import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import type { PassportAchievement } from '../types/passport.types';

interface PassportAchievementGridProps {
  achievements: PassportAchievement[];
}

export function PassportAchievementGrid({ achievements }: PassportAchievementGridProps) {
  const { colors } = useTheme();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <View className="gap-3" testID="passport-achievements">
      <Text variant="body-sm" className="text-text-secondary">
        {unlocked}/{achievements.length} unlocked · celebrate process milestones only
      </Text>
      {achievements.map((achievement, index) => {
        const pct = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
        return (
          <Animated.View key={achievement.id} entering={FadeInDown.springify().delay(index * 40)}>
            <GlassCard className="p-4" bordered={achievement.unlocked}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text variant="label" className="text-text-primary">
                    {achievement.title}
                  </Text>
                  <Text variant="caption" className="mt-1 text-text-secondary">
                    {achievement.detail}
                  </Text>
                </View>
                <Badge
                  label={achievement.unlocked ? 'Earned' : `${achievement.progress}/${achievement.target}`}
                  variant={achievement.unlocked ? 'success' : 'outline'}
                  size="sm"
                />
              </View>
              <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: achievement.unlocked
                      ? colors.bullish.primary
                      : colors.accent.primary,
                  }}
                />
              </View>
              {achievement.unlocked ? (
                <Text variant="caption" className="mt-2 text-text-tertiary">
                  {achievement.celebrateCopy}
                </Text>
              ) : null}
            </GlassCard>
          </Animated.View>
        );
      })}
    </View>
  );
}
