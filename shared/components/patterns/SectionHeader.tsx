import { Pressable, View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export interface SectionHeaderProps extends ViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <View className={cn('mb-1 flex-row items-start justify-between', className)} {...props}>
      <View className="mr-4 flex-1">
        <Text variant="h3" className="tracking-tight">
          {title}
        </Text>
        {description ? (
          <Text variant="body-sm" className="mt-1.5 leading-6">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          className="min-h-13 justify-center rounded-pill px-3 active:bg-surface"
        >
          <Text variant="label" className="text-accent">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
