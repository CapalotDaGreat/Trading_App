import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { SIMULATION_EDUCATION_LINKS } from '@/features/simulation/constants/simulation.constants';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';

export function SimulationEducationLinks() {
  const router = useRouter();
  return (
    <Surface tone="subtle" className="mb-4" testID="simulate-education">
      <Text variant="label">Learn while you simulate</Text>
      <Text variant="caption" className="mt-1 text-text-secondary">
        Open a lesson or drill, then come back to size the next paper position.
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {SIMULATION_EDUCATION_LINKS.map((link) => (
          <Button
            key={link.id}
            size="sm"
            variant="ghost"
            onPress={() => router.push(link.href as never)}
          >
            {link.label}
          </Button>
        ))}
      </View>
    </Surface>
  );
}
