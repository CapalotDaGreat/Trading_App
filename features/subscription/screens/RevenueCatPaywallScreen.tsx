import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import { loadRevenueCatPaywallView } from '@/features/subscription/services/revenuecat-ui';
import { Header } from '@/shared/components/layout/Header';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { legalPath, type LegalRouteId } from '@/shared/legal';

const LEGAL_LINKS: { id: LegalRouteId; label: string }[] = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'risk', label: 'Risk Disclaimer' },
];

interface RevenueCatPaywallScreenProps {
  onFallback: () => void;
}

export function RevenueCatPaywallScreen({ onFallback }: RevenueCatPaywallScreenProps) {
  const router = useRouter();
  const { refresh } = useSubscription();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const Paywall = useMemo(() => loadRevenueCatPaywallView(), []);

  useEffect(() => {
    if (!Paywall) onFallback();
  }, [Paywall, onFallback]);

  if (!Paywall) return null;

  return (
    <View className="flex-1 bg-background">
      <Header title="Aithera Pro" onBack={() => router.back()} />
      <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 pb-3">
        {LEGAL_LINKS.map((link) => (
          <Pressable
            key={link.id}
            accessibilityRole="link"
            accessibilityLabel={link.label}
            onPress={() => router.push(legalPath(link.id))}
          >
            <Text variant="caption" className="text-accent">
              {link.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Paywall
        style={{ flex: 1 }}
        options={{ displayCloseButton: false }}
        onPurchaseCompleted={() => {
          void refresh().then(() => router.back());
        }}
        onRestoreCompleted={() => {
          void refresh();
        }}
        onPurchaseError={({ error }) => {
          setActionMessage(error.message ?? 'Purchase could not be completed.');
        }}
        onDismiss={() => router.back()}
      />
      {actionMessage ? (
        <View className="px-6 pb-6">
          <Text
            accessibilityRole="alert"
            variant="body-sm"
            className="mb-3 text-center text-text-secondary"
          >
            {actionMessage}
          </Text>
          <Button variant="outline" fullWidth onPress={onFallback}>
            Choose a plan in the app
          </Button>
        </View>
      ) : null}
    </View>
  );
}
