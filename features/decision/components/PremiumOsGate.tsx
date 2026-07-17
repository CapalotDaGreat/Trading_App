import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  canAccessDecisionOs,
  decisionOsUpsellCopy,
  type DecisionOsFeature,
} from '@/features/decision/services/decision-os-access.service';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

interface PremiumOsGateProps {
  feature: DecisionOsFeature;
  children: ReactNode;
  /** If true, always show children (core free) and skip gate. */
  freeAlways?: boolean;
}

/**
 * Soft gate: free users see a short upsell instead of advanced OS panels.
 * Core coaching surfaces should pass freeAlways or not use this gate.
 */
export function PremiumOsGate({ feature, children, freeAlways }: PremiumOsGateProps) {
  const router = useRouter();
  const tier = useSubscriptionStore((s) => s.tier);

  if (freeAlways || canAccessDecisionOs(tier, feature)) {
    return <>{children}</>;
  }

  return (
    <View className="rounded-2xl border border-border bg-background-elevated p-4">
      <Text variant="caption" className="mb-1 font-semibold text-text-tertiary">
        PREMIUM
      </Text>
      <Text variant="body-sm" className="mb-3 text-text-secondary">
        {decisionOsUpsellCopy(feature)}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/subscription' as never)}
        className="self-start rounded-full bg-accent-muted px-3 py-1.5"
      >
        <Text variant="caption" className="font-semibold text-accent">
          Unlock Premium
        </Text>
      </Pressable>
    </View>
  );
}
