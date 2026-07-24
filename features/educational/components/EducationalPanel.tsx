import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

export type EducationalPanelVariant = 'tip' | 'risk' | 'why' | 'practice';

const VARIANT_META: Record<
  EducationalPanelVariant,
  { title: string; icon: keyof typeof Ionicons.glyphMap; container: string; iconColor: 'info' | 'warning' | 'accent' | 'bullish' }
> = {
  tip: {
    title: 'Learning Tip',
    icon: 'bulb-outline',
    container: 'border-info/20 bg-info-muted',
    iconColor: 'info',
  },
  risk: {
    title: 'Risk Reminder',
    icon: 'shield-outline',
    container: 'border-warning/25 bg-warning-muted',
    iconColor: 'warning',
  },
  why: {
    title: 'Why This Matters',
    icon: 'help-circle-outline',
    container: 'border-accent/20 bg-accent-muted',
    iconColor: 'accent',
  },
  practice: {
    title: 'Professional Practice',
    icon: 'ribbon-outline',
    container: 'border-bullish/20 bg-bullish-muted',
    iconColor: 'bullish',
  },
};

interface EducationalPanelProps extends Pick<ViewProps, 'className' | 'testID'> {
  variant: EducationalPanelVariant;
  /** Override default variant title. */
  title?: string;
  body: string;
  learnMoreHref?: string;
  learnMoreLabel?: string;
}

export function EducationalPanel({
  variant,
  title,
  body,
  learnMoreHref,
  learnMoreLabel = 'Learn more',
  className,
  testID,
}: EducationalPanelProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const meta = VARIANT_META[variant];
  const iconColor =
    meta.iconColor === 'info'
      ? colors.info.primary
      : meta.iconColor === 'warning'
        ? colors.warning.primary
        : meta.iconColor === 'bullish'
          ? colors.bullish.primary
          : colors.accent.primary;

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      className={cn('rounded-2xl border px-4 py-3.5', meta.container, className)}
    >
      <View className="mb-1.5 flex-row items-center">
        <Ionicons name={meta.icon} size={16} color={iconColor} style={{ marginRight: 8 }} />
        <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
          {title ?? meta.title}
        </Text>
      </View>
      <Text variant="body-sm" className="leading-relaxed text-text-secondary">
        {body}
      </Text>
      {learnMoreHref ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={learnMoreLabel}
          className="mt-2 min-h-10 justify-center self-start"
          onPress={() => router.push(learnMoreHref as never)}
        >
          <Text variant="label" className="text-info">
            {learnMoreLabel} →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
