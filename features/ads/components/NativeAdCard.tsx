import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { adsService } from '@/features/ads/services/ads.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface NativeAdCardProps {
  title?: string;
  className?: string;
}

export function NativeAdCard({ title = 'Sponsored', className }: NativeAdCardProps) {
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

      const result = await adsService.loadNative();
      if (!mounted) return;

      setVisible(result.loaded || result.showUpsell);
      setMessage(
        result.message ?? 'Unlock advanced AI market analysis with TradeVision Premium.',
      );
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  if (!visible) return null;

  return (
    <Pressable onPress={() => router.push('/subscription')}>
      <GlassCard className={cn('p-4', className)} bordered>
        <View className="mb-2 flex-row items-center justify-between">
          <Text variant="caption" className="uppercase tracking-wider">
            {title}
          </Text>
          <View className="rounded bg-surface px-2 py-0.5">
            <Text variant="caption">Ad</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-accent-muted">
            <Ionicons name="trending-up" size={24} color="#00D4AA" />
          </View>
          <View className="flex-1">
            <Text variant="h3">TradeVision Premium</Text>
            <Text variant="body-sm" className="mt-1" numberOfLines={2}>
              {message}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </View>
      </GlassCard>
    </Pressable>
  );
}
