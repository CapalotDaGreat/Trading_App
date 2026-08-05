import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

interface MentorSetupInviteCardProps {
  onLater: () => void;
}

export function MentorSetupInviteCard({ onLater }: MentorSetupInviteCardProps) {
  const router = useRouter();

  return (
    <View
      className="mb-4 rounded-2xl border border-border bg-background-elevated p-4"
      testID="mentor-setup-invite-card"
    >
      <Text variant="h3">Personalise your AI Mentor</Text>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        Help us tailor your research, coaching and learning experience.
      </Text>
      <Text variant="caption" className="mt-2 text-text-tertiary">
        Takes about 2 minutes
      </Text>
      <View className="mt-4 flex-row gap-2">
        <Button
          className="flex-1"
          onPress={() => router.push('/onboarding' as never)}
          testID="mentor-setup-invite-start"
        >
          Start now
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onPress={onLater}
          testID="mentor-setup-invite-later"
        >
          Later
        </Button>
      </View>
    </View>
  );
}
