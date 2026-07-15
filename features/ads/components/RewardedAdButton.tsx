import { useState } from 'react';

import { adsService } from '@/features/ads/services/ads.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/components/feedback/Toast';

interface RewardedAdButtonProps {
  label?: string;
  rewardLabel?: string;
  onReward?: () => void;
  className?: string;
}

export function RewardedAdButton({
  label = 'Watch Ad for Bonus Analysis',
  rewardLabel = 'Bonus analysis unlocked!',
  onReward,
  className,
}: RewardedAdButtonProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (isPremium) return null;

  const handlePress = async () => {
    setLoading(true);
    try {
      const showAds = await adsService.shouldShowAds(user?.uid);
      if (!showAds) {
        toast.info('Premium', 'Premium members skip rewarded ads.');
        return;
      }

      const result = await adsService.showRewarded();
      if (result.rewarded) {
        toast.success('Rewarded', rewardLabel);
        onReward?.();
      } else {
        toast.info('Rewarded Ad', result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className={className}
      loading={loading}
      onPress={() => void handlePress()}
    >
      {label}
    </Button>
  );
}
