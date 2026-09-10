import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { type ProductLoopStep } from '@/features/navigation/config/navigation-ia.config';
import { resolveLoopCtas } from '@/features/navigation/config/product-loop';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

export type { ProductLoopStep };

interface LoopCtaRowProps {
  current?: ProductLoopStep;
  title?: string;
  testID?: string;
  followUp?: { label: string; href: string };
  /** Review → Improve: Training Planner primary, not an empty sequential slice. */
  plannerNext?: { label: string; href: string } | null;
}

/** Next steps in the competence loop — sequential, not a random hub. */
export function LoopCtaRow({
  current,
  title = 'Continue the loop',
  testID = 'loop-cta-row',
  followUp,
  plannerNext,
}: LoopCtaRowProps) {
  const router = useRouter();
  const next = resolveLoopCtas({ current, followUp, plannerNext });

  return (
    <View className="mt-2" testID={testID}>
      <Text variant="caption" className="mb-2 text-text-tertiary">
        {title} · {BRAND.loop}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {next.map((step) => (
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
