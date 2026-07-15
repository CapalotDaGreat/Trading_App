import { ActivityIndicator, Modal, View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/40">
        <GlassCard className="min-w-[160px] items-center px-8 py-6">
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text variant="body-sm" className="mt-4 text-center">
            {message}
          </Text>
        </GlassCard>
      </View>
    </Modal>
  );
}
