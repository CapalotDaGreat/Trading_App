import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

interface PremiumPreviewCardProps {
  title: string;
  teaser: string;
  /** Blurred / obscured preview body */
  preview?: ReactNode;
  ctaLabel?: string;
  testID?: string;
}

/**
 * Soft Premium teaser — never says Locked / Restricted.
 * Shows enough value to understand Premium without hard-blocking curiosity.
 */
export function PremiumPreviewCard({
  title,
  teaser,
  preview,
  ctaLabel = 'Unlock deeper insights',
  testID,
}: PremiumPreviewCardProps) {
  const router = useRouter();

  return (
    <View
      className="overflow-hidden rounded-2xl border border-border bg-background-elevated p-4"
      testID={testID ?? 'premium-preview-card'}
    >
      <Text variant="caption" className="mb-1 font-semibold text-accent">
        INCLUDED WITH PREMIUM
      </Text>
      <Text variant="h3">{title}</Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {teaser}
      </Text>
      {preview ? (
        <>
          <Text variant="caption" className="mt-3 text-text-tertiary">
            Illustrative preview — no private result has been calculated.
          </Text>
          <View className="mt-2 opacity-40" pointerEvents="none">
            {preview}
          </View>
        </>
      ) : (
        <View className="mt-3 h-16 rounded-xl bg-surface opacity-50" />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        onPress={() => router.push('/subscription' as never)}
        className="mt-4 self-start rounded-full bg-accent-muted px-3 py-2"
        testID={testID ? `${testID}-cta` : 'premium-preview-cta'}
      >
        <Text variant="caption" className="font-semibold text-accent">
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}
