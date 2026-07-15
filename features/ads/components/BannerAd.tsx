import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { adsService } from '@/features/ads/services/ads.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PremiumBadge } from '@/features/subscription/components/PremiumBadge';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface BannerAdProps {
  className?: string;
}

export function BannerAd({ className }: BannerAdProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      const showAds = await adsService.shouldShowAds(user?.uid);
      if (!mounted || !showAds) {
        setVisible(false);
        return;
      }

      const result = await adsService.loadBanner();
      if (!mounted) return;

      setVisible(result.loaded || result.showUpsell);
      setMessage(result.message ?? 'Support TradeVision — Go Premium for ad-free trading.');
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  if (!visible) return null;

  return (
    <Pressable
      onPress={() => router.push('/subscription')}
      className={cn(
        'flex-row items-center justify-between rounded-xl border border-border bg-surface px-4 py-3',
        className,
      )}
    >
      <View className="flex-1 pr-3">
        <Text variant="label" className="text-accent">
          Upgrade to Premium
        </Text>
        <Text variant="caption" className="mt-0.5" numberOfLines={2}>
          {message}
        </Text>
      </View>
      <PremiumBadge />
    </Pressable>
  );
}
