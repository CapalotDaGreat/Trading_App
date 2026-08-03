import { Ionicons } from '@expo/vector-icons';
import { View, type ViewProps } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface ErrorStateProps extends ViewProps {
  title: string;
  description: string;
  /** Optional explicit “why” line for WCAG clarity. */
  why?: string;
  /** Optional explicit recovery instruction. */
  recovery?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  title,
  description,
  why,
  recovery,
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
      accessibilityLabel={`${title}. ${why ?? description}. ${recovery ?? ''}`}
      className={cn('items-center rounded-card bg-bearish-muted p-5', className)}
      {...props}
    >
      <Ionicons name="alert-circle-outline" size={24} color={colors.bearish.primary} />
      <Text variant="h3" className="mt-3 text-center">
        {title}
      </Text>
      <Text variant="body-sm" className="mt-2 text-center text-text-secondary">
        {description}
      </Text>
      {why ? (
        <Text variant="caption" className="mt-2 text-center text-text-tertiary">
          Why: {why}
        </Text>
      ) : null}
      {recovery ? (
        <Text variant="caption" className="mt-1 text-center text-text-secondary">
          Recover: {recovery}
        </Text>
      ) : null}
      {onAction ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onPress={onAction}
          accessibilityHint="Retries the failed action"
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
