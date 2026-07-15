import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center px-8 py-12', className)}>
      {icon ? <View className="mb-4 opacity-60">{icon}</View> : null}
      <Text variant="h3" className="mb-2 text-center">
        {title}
      </Text>
      {description ? (
        <Text variant="body-sm" className="mb-6 max-w-xs text-center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
