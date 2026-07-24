import { Ionicons } from '@expo/vector-icons';
import { View, type ViewProps } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface ErrorStateProps extends ViewProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title,
  description,
  actionLabel = 'Try again',
  onAction,
  className,
  ...props
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      className={cn('items-center rounded-card bg-bearish-muted p-5', className)}
      {...props}
    >
      <Ionicons name="alert-circle-outline" size={24} color={colors.bearish.primary} />
      <Text variant="h3" className="mt-3 text-center">
        {title}
      </Text>
      <Text variant="body-sm" className="mt-2 text-center">
        {description}
      </Text>
      {onAction ? (
        <Button variant="outline" size="sm" className="mt-4" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
