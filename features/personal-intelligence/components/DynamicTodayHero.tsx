import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { useTheme } from '@/shared/hooks/useTheme';
import { fadeInDown } from '@/shared/utils/motion';

import type { PersonalizedTodayFocus } from '../types/personal-intelligence.types';

interface DynamicTodayHeroProps {
  focus: PersonalizedTodayFocus;
  becomingQuestion?: string;
}

export function DynamicTodayHero({
  focus,
  becomingQuestion = 'Who am I becoming as a trader?',
}: DynamicTodayHeroProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View entering={fadeInDown(reduceMotion)} testID="today-section-dynamic-today">
      <GlassCard className="overflow-hidden p-6">
        <Text variant="caption" className="font-medium tracking-wide text-accent">
          {focus.eyebrow}
        </Text>
        <Text variant="h2" className="mt-2 tracking-tight text-text-primary">
          {focus.headline}
        </Text>
        <Text variant="body-sm" className="mt-3 max-w-md leading-6 text-text-secondary">
          {focus.detail}
        </Text>
        <Text variant="caption" className="mt-4 text-text-tertiary">
          {becomingQuestion}
        </Text>
        <View className="mt-6 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={focus.primaryCta.label}
            testID="dynamic-today-primary-cta"
            onPress={() => router.push(focus.primaryCta.href as never)}
            className="min-h-13 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent px-4"
          >
            <Ionicons name="arrow-forward" size={16} color={colors.text.inverse} />
            <Text variant="label" className="text-text-inverse">
              {focus.primaryCta.label}
            </Text>
          </Pressable>
          {focus.secondaryCta ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={focus.secondaryCta.label}
              testID="dynamic-today-secondary-cta"
              onPress={() => router.push(focus.secondaryCta!.href as never)}
              className="min-h-13 flex-1 items-center justify-center rounded-xl bg-accent-muted px-4"
            >
              <Text variant="label" className="text-accent">
                {focus.secondaryCta.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </GlassCard>
    </Animated.View>
  );
}
