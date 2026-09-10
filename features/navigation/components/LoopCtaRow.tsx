import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { PRODUCT_LOOP_STEPS, type ProductLoopStep } from '@/features/navigation/config/navigation-ia.config';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

export type { ProductLoopStep };

interface LoopCtaRowProps {
  current?: ProductLoopStep;
  title?: string;
  testID?: string;
  followUp?: { label: string; href: string };
}

/** Next steps in the competence loop — sequential, not a random hub. */
export function LoopCtaRow({
  current,
  title = 'Continue the loop',
  testID = 'loop-cta-row',
  followUp,
}: LoopCtaRowProps) {
  const router = useRouter();
  const index = current ? PRODUCT_LOOP_STEPS.findIndex((step) => step.id === current) : -1;
  const sequential =
    index >= 0 ? PRODUCT_LOOP_STEPS.slice(index + 1, index + 4) : PRODUCT_LOOP_STEPS.slice(0, 3);
  const next = followUp
    ? [{ id: 'follow' as const, href: followUp.href, label: followUp.label }, ...sequential]
    : sequential;

  return (
    <View className="mt-2" testID={testID}>
      <Text variant="caption" className="mb-2 text-text-tertiary">
        {title} · {BRAND.loop}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {next.slice(0, 3).map((step) => (
          <Button
            key={`${step.id}-${step.href}`}
            size="sm"
            variant="outline"
            onPress={() => router.push(step.href as never)}
            accessibilityLabel={`Go to ${step.label}`}
          >
            {step.label}
          </Button>
        ))}
      </View>
    </View>
  );
}
