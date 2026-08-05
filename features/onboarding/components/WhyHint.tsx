import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

export function WhyHint({ text }: { text: string }) {
  return (
    <View className="mt-3 rounded-2xl bg-accent-muted/40 px-4 py-3">
      <Text variant="caption" className="mb-1 font-semibold text-accent">
        Why we ask
      </Text>
      <Text variant="body-sm" className="text-text-secondary">
        {text}
      </Text>
    </View>
  );
}
