import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  canAccessDecisionOs,
  decisionOsUpsellCopy,
  type DecisionOsFeature,
} from '@/features/decision/services/decision-os-access.service';
import { PremiumPreviewCard } from '@/features/subscription/components/PremiumPreviewCard';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

interface PremiumOsGateProps {
  feature: DecisionOsFeature;
  children: ReactNode;
  /** If true, always show children (core free) and skip gate. */
  freeAlways?: boolean;
  /** Optional teaser for the preview card. */
  teaser?: string;
}

const TEASERS: Record<DecisionOsFeature, string> = {
  advancedResearchQueue: 'Your queue continues beyond the free top three.',
  tradingDnaInsights: "We've identified recurring strengths in your Trading DNA.",
  weeklyReviews: 'Your weekly process review has new patterns to explore.',
  portfolioIntelligence: 'Portfolio concentration and stress insights are ready.',
  advancedReplay: 'Advanced Process Tape comparisons are available.',
  convictionDrift: 'Your Decision Graph has updated with new process edges.',
  decisionLab: 'Decision Lab challenges and advanced stats are ready to practice.',
};

/**
 * Soft gate: free users see a Premium preview instead of a hard lock.
 */
export function PremiumOsGate({ feature, children, freeAlways, teaser }: PremiumOsGateProps) {
  const tier = useSubscriptionStore((s) => s.tier);

  if (freeAlways || canAccessDecisionOs(tier, feature)) {
    return <>{children}</>;
  }

  return (
    <PremiumPreviewCard
      testID={`premium-os-gate-${feature}`}
      title={decisionOsUpsellCopy(feature)}
      teaser={teaser ?? TEASERS[feature]}
      ctaLabel="Unlock deeper insights"
      preview={
        <View>
          <Text variant="body-sm" className="text-text-secondary">
            Preview · full detail included with Premium
          </Text>
          <View className="mt-2 h-10 rounded-lg bg-surface" />
          <View className="mt-2 h-10 w-2/3 rounded-lg bg-surface" />
        </View>
      }
    />
  );
}
