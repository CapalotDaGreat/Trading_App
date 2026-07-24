import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { EDUCATIONAL_MODE_MISSION, EDUCATIONAL_MODE_SHEET } from '../content/educational-mode.content';

interface EducationalModeSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function EducationalModeSheet({ visible, onClose }: EducationalModeSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss educational mode sheet"
        className="flex-1 justify-end bg-black/60"
        onPress={onClose}
      >
        <Pressable
          accessibilityViewIsModal
          className="max-h-[80%] rounded-t-3xl border-t border-info/30 bg-background px-5 pb-10 pt-4"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-border" />

          <View className="mb-3 flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-info-muted">
              <Ionicons name="school-outline" size={22} color={colors.info.primary} />
            </View>
            <View className="flex-1">
              <Text variant="h3">{EDUCATIONAL_MODE_SHEET.title}</Text>
              <Text variant="caption" className="mt-0.5 text-info">
                Brand positioning · always on
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="body-sm" className="leading-relaxed text-text-secondary">
              {EDUCATIONAL_MODE_SHEET.body}
            </Text>

            <View className="mt-4 gap-2">
              {EDUCATIONAL_MODE_SHEET.bullets.map((bullet) => (
                <View key={bullet} className="flex-row items-start gap-2">
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.info.primary}
                    style={{ marginTop: 2 }}
                  />
                  <Text variant="body-sm" className="flex-1 text-text-primary">
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-5 rounded-2xl bg-info-muted px-4 py-3">
              <Text variant="caption" className="font-semibold uppercase tracking-wide text-info">
                Mission
              </Text>
              <Text variant="body-sm" className="mt-1 leading-relaxed text-text-primary">
                {EDUCATIONAL_MODE_MISSION}
              </Text>
            </View>
          </ScrollView>

          <Button className="mt-5" onPress={onClose} accessibilityLabel="Got it">
            Got it
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
