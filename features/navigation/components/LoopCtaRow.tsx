import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

export type ProductLoopStep = 'learn' | 'practice' | 'replay' | 'simulate' | 'journal' | 'review' | 'ask';

const LOOP_STEPS: { id: ProductLoopStep; href: string; label: string }[] = [
  { id: 'learn', href: '/learn', label: 'Learn' },
  { id: 'practice', href: '/practice', label: 'Practice' },
  { id: 'replay', href: '/decision/replay-tv', label: 'Replay' },
  { id: 'simulate', href: '/simulate', label: 'Simulate' },
  { id: 'journal', href: '/journal', label: 'Journal' },
  { id: 'review', href: '/review', label: 'Review' },
];

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
  const index = current ? LOOP_STEPS.findIndex((step) => step.id === current) : -1;
  const sequential =
    index >= 0 ? LOOP_STEPS.slice(index + 1, index + 4) : LOOP_STEPS.slice(0, 3);
  const next = followUp ? [{ id: 'follow' as const, href: followUp.href, label: followUp.label }, ...sequential] : sequential;

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
