import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useId, useState } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface CollapsibleSectionProps extends ViewProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultExpanded = false,
  className,
  ...props
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { colors } = useTheme();
  const contentId = useId();

  return (
    <View
      className={cn('overflow-hidden rounded-panel bg-background-elevated', className)}
      {...props}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={expanded ? 'Collapses this section' : 'Expands this section'}
        accessibilityState={{ expanded }}
        aria-controls={contentId}
        onPress={() => setExpanded((value) => !value)}
        className="min-h-13 flex-row items-center px-4 py-3.5"
      >
        <View className="flex-1 pr-3">
          <Text variant="label" className="text-text-primary">
            {title}
          </Text>
          {description && !expanded ? (
            <Text variant="caption" className="mt-1 leading-5">
              {description}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.tertiary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </Pressable>
      {expanded ? (
        <View nativeID={contentId} className="gap-4 border-t border-border px-4 py-4">
          {children}
        </View>
      ) : null}
    </View>
  );
}
