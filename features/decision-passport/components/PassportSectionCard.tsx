import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { fadeInDown } from '@/shared/utils/motion';

interface PassportSectionCardProps {
  title: string;
  subtitle?: string;
  delay?: number;
  children: ReactNode;
  bordered?: boolean;
}

export function PassportSectionCard({
  title,
  subtitle,
  delay = 0,
  children,
  bordered,
}: PassportSectionCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View entering={fadeInDown(reduceMotion, { delay })}>
      <GlassCard className="p-4" bordered={bordered}>
        <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" className="mt-1 text-text-secondary">
            {subtitle}
          </Text>
        ) : null}
        <View className="mt-3">{children}</View>
      </GlassCard>
    </Animated.View>
  );
}

export function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <Text variant="body-sm" className="text-text-secondary">
        Still collecting evidence — keep logging process.
      </Text>
    );
  }
  return (
    <View className="gap-1.5">
      {items.map((item) => (
        <Text key={item} variant="body-sm" className="leading-relaxed text-text-secondary">
          · {item}
        </Text>
      ))}
    </View>
  );
}
