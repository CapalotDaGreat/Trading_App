import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';

import type { DecisionPassportProfile } from '../types/passport.types';

interface PassportHeroProps {
  profile: DecisionPassportProfile;
}

export function PassportHero({ profile }: PassportHeroProps) {
  return (
    <Animated.View entering={FadeInDown.springify()}>
      <GlassCard className="overflow-hidden p-5" bordered glow>
        <Text variant="caption" className="font-semibold uppercase tracking-widest text-accent">
          Decision Passport
        </Text>
        <Text variant="h1" className="mt-2">
          {profile.identity.styleLabel}
        </Text>
        <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
          {profile.identity.summary}
        </Text>

        <View className="mt-5 flex-row gap-3">
          <Stat label="Process sessions" value={String(profile.processSessions)} />
          <Stat label="Avg process" value={String(profile.averageProcessScore)} />
          <Stat label="Streak" value={`${profile.consistency.streakDays}d`} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2.5">
      <Text variant="caption" className="text-text-tertiary">
        {label}
      </Text>
      <Text variant="h3" className="mt-1">
        {value}
      </Text>
    </View>
  );
}
