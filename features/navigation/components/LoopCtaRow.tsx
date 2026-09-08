import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { BRAND } from '@/shared/constants/brand';

import { IA_GLOSSARY } from '../config/navigation-ia.config';

export type ProductLoopStep = 'learn' | 'practice' | 'simulate' | 'review' | 'ask';

const LOOP_STEPS: { id: ProductLoopStep; href: string; label: string }[] = [
  { id: 'learn', href: '/learn', label: IA_GLOSSARY.learn },
  { id: 'practice', href: '/practice', label: IA_GLOSSARY.practice },
  { id: 'simulate', href: '/simulate', label: IA_GLOSSARY.simulate },
  { id: 'review', href: '/review', label: IA_GLOSSARY.review },
  { id: 'ask', href: '/ai', label: IA_GLOSSARY.ask },
];

interface LoopCtaRowProps {
  current?: ProductLoopStep;
  title?: string;
  testID?: string;
}

/** Connects any surface back to the product loop without extra nested cards. */
export function LoopCtaRow({
  current,
  title = 'Continue the loop',
  testID = 'loop-cta-row',
}: LoopCtaRowProps) {
  const router = useRouter();
  const next = LOOP_STEPS.filter((step) => step.id !== current).slice(0, 3);

  return (
    <View className="mt-2" testID={testID}>
      <Text variant="caption" className="mb-2 text-text-tertiary">
        {title} · {BRAND.loop}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {next.map((step) => (
          <Button
            key={step.id}
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
