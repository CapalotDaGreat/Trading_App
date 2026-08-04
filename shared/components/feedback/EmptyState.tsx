import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  iconName?: ComponentProps<typeof Ionicons>['name'];
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  iconName = 'file-tray-outline',
  actionLabel,
  onAction,
  className,
  testID,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
      testID={testID}
      className={cn('flex-1 items-center justify-center px-10 py-16', className)}
    >
      {icon ? (
        <View className="mb-6 opacity-50">{icon}</View>
      ) : (
        <View className="mb-6 h-14 w-14 items-center justify-center rounded-panel bg-surface">
          <Ionicons name={iconName} size={26} color={colors.text.tertiary} />
        </View>
      )}
      <Text variant="h3" className="mb-3 text-center tracking-tight">
        {title}
      </Text>
      {description ? (
        <Text variant="body-sm" className="mb-8 max-w-sm text-center leading-6 text-text-secondary">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction} accessibilityHint={actionLabel}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
