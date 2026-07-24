import { Ionicons } from '@expo/vector-icons';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import { EDUCATIONAL_INSIGHT_FOOTER } from '../content/educational-mode.content';

interface EducationalInsightFooterProps extends Pick<ViewProps, 'className' | 'testID'> {
  compact?: boolean;
}

/** Compact educational footer for AI chat bubbles and analysis cards. */
export function EducationalInsightFooter({
  compact = false,
  className,
  testID = 'educational-insight-footer',
}: EducationalInsightFooterProps) {
  const { colors } = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel="Educational insight footer"
      className={cn(
        'border-t border-info/20',
        compact ? 'mt-2.5 pt-2.5' : 'mt-3 pt-3',
        className,
      )}
    >
      <View className="mb-1 flex-row items-center">
        <Ionicons name="school" size={compact ? 12 : 14} color={colors.info.primary} />
        <Text
          variant="caption"
          className={cn('ml-1.5 font-semibold text-info', !compact && 'text-[13px]')}
        >
          {EDUCATIONAL_INSIGHT_FOOTER.title}
        </Text>
      </View>
      {EDUCATIONAL_INSIGHT_FOOTER.lines.map((line) => (
        <Text
          key={line}
          variant="caption"
          className={cn('leading-relaxed text-text-tertiary', compact ? 'text-[11px]' : undefined)}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}
