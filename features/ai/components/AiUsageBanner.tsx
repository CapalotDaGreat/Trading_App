import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import type { AiUsageStats } from '@/features/ai/types/ai.types';
import { Text } from '@/shared/components/ui/Text';
import { isUnlimited } from '@/shared/constants/subscription';

interface AiUsageBannerProps {
  usage: AiUsageStats | null | undefined;
  isPremium: boolean;
  className?: string;
}

/** Soft warning at ≥80% of monthly AI quota; hard-limit copy when exhausted. */
export function AiUsageBanner({ usage, isPremium, className }: AiUsageBannerProps) {
  const router = useRouter();
  if (!usage) return null;

  const { usedToday, limit, isNearLimit, isAtLimit } = usage;
  const label = isUnlimited(limit)
    ? `${usedToday} analyses this month`
    : `${usedToday}/${limit} analyses this month`;

  if (isAtLimit) {
    return (
      <View className={className}>
        <Text variant="caption" className="text-center text-bearish">
          {label} — monthly allowance reached. Resets next calendar month.
        </Text>
        {!isPremium ? (
          <Pressable onPress={() => router.push('/subscription' as never)}>
            <Text variant="caption" className="mt-1 text-center text-accent">
              Continue your growth with unlimited Premium analyses →
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isNearLimit) {
    return (
      <View className={className}>
        <Text variant="caption" className="text-center text-warning">
          {label} — you&apos;re near this month&apos;s AI allowance
        </Text>
      </View>
    );
  }

  return (
    <Text variant="caption" className={`text-center text-text-tertiary ${className ?? ''}`}>
      {label}
    </Text>
  );
}
