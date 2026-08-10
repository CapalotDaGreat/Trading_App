import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import { EducationalModeSheet } from './EducationalModeSheet';

interface EducationalModeBadgeProps extends Pick<ViewProps, 'className' | 'testID'> {
  /** Compact inline pill (default) vs slightly larger header placement. */
  size?: 'sm' | 'md';
}

/**
 * Permanent Educational Mode brand badge. Opens an explainer sheet on press.
 * Not a dismissible disclaimer — a recognizable product element.
 */
export function EducationalModeBadge({
  className,
  testID = 'educational-mode-badge',
  size = 'sm',
}: EducationalModeBadgeProps) {
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Educational Mode. Opens explanation."
        accessibilityHint="Explains that TradeVision is educational research, not brokerage or advice"
        testID={testID}
        onPress={() => setSheetOpen(true)}
        className={cn(
          'min-h-9 flex-row items-center self-start rounded-pill border px-3',
          'border-info/25 bg-info-muted',
          size === 'md' && 'min-h-10 px-3.5',
          className,
        )}
      >
        <View className="mr-1.5 h-5 w-5 items-center justify-center rounded-full bg-info/15">
          <Ionicons name="school" size={iconSize} color={colors.info.primary} />
        </View>
        <Text
          variant="caption"
          className={cn('font-semibold tracking-wide text-info', size === 'md' && 'text-[13px]')}
        >
          Educational Mode
        </Text>
      </Pressable>

      <EducationalModeSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
