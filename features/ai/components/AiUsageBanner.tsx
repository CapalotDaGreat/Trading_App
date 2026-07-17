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

/** Soft warning at ≥80% of daily AI quota; hard-limit copy when exhausted. */
export function AiUsageBanner({ usage, isPremium, className }: AiUsageBannerProps) {
  const router = useRouter();
  if (!usage) return null;

  const { usedToday, limit, isNearLimit, isAtLimit } = usage;
  const label = isUnlimited(limit)
    ? `${usedToday} analyses today`
    : `${usedToday}/${limit} analyses today`;

  if (isAtLimit) {
    return (
      <View className={className}>
        <Text variant="caption" className="text-center text-bearish">
          {label} — daily limit reached. Resets at midnight UTC.
        </Text>
        {!isPremium ? (
          <Pressable onPress={() => router.push('/subscription' as never)}>
            <Text variant="caption" className="mt-1 text-center text-accent">
              Upgrade to Premium for a higher fair-use allowance →
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
          {label} — you&apos;re near today&apos;s AI limit
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
