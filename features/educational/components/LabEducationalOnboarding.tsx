import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import { LAB_ONBOARDING } from '../content/educational-mode.content';
import { useEducationalStore } from '../stores/educational.store';
import { EducationalModeBadge } from './EducationalModeBadge';

/** First-visit Decision Lab card — dismissible permanently. */
export function LabEducationalOnboarding() {
  const { colors } = useTheme();
  const dismissed = useEducationalStore((s) => s.labOnboardingDismissed);
  const dismiss = useEducationalStore((s) => s.dismissLabOnboarding);

  if (dismissed) return null;

  return (
    <GlassCard className="p-4" bordered testID="lab-educational-onboarding">
      <EducationalModeBadge className="mb-3" />
      <Text variant="h3">{LAB_ONBOARDING.title}</Text>
      <Text variant="body-sm" className="mt-2 leading-relaxed text-text-secondary">
        {LAB_ONBOARDING.body}
      </Text>

      <View className="mt-4 gap-2.5">
        {LAB_ONBOARDING.points.map((point) => (
          <View key={point.label} className="flex-row items-start gap-2.5">
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.info.primary}
              style={{ marginTop: 1 }}
            />
            <View className="flex-1">
              <Text variant="label" className="text-text-primary">
                {point.label}
              </Text>
              <Text variant="caption" className="text-text-secondary">
                {point.detail}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Button
        className="mt-5"
        variant="secondary"
        onPress={dismiss}
        accessibilityLabel="Dismiss Decision Lab educational onboarding"
      >
        Start practicing
      </Button>
    </GlassCard>
  );
}
