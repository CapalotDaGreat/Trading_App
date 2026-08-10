import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, View, type ViewProps } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Surface, type SurfaceTone } from '@/shared/components/ui/Surface';
import { Text, type HeadingLevel } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

export type StatusStateKind = 'loading' | 'empty' | 'error' | 'stale';

export interface StatusStateProps extends ViewProps {
  status: StatusStateKind;
  title: string;
  description?: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  headingLevel?: HeadingLevel;
  iconName?: ComponentProps<typeof Ionicons>['name'];
  icon?: ReactNode;
}

const statusConfig: Record<
  StatusStateKind,
  {
    icon: ComponentProps<typeof Ionicons>['name'];
    tone: SurfaceTone;
    color: 'accent' | 'text' | 'bearish' | 'warning';
  }
> = {
  loading: { icon: 'hourglass-outline', tone: 'subtle', color: 'accent' },
  empty: { icon: 'file-tray-outline', tone: 'subtle', color: 'text' },
  error: { icon: 'alert-circle-outline', tone: 'danger', color: 'bearish' },
  stale: { icon: 'time-outline', tone: 'warning', color: 'warning' },
};

/**
 * Shared loading, empty, recoverable-error and stale presentation.
 * The announcement region intentionally excludes the retry/action control.
 */
export function StatusState({
  status,
  title,
  description,
  detail,
  actionLabel,
  onAction,
  headingLevel = 2,
  iconName,
  icon,
  className,
  ...props
}: StatusStateProps) {
  const { colors } = useTheme();
  const config = statusConfig[status];
  const iconColor =
    config.color === 'accent'
      ? colors.accent.primary
      : config.color === 'bearish'
        ? colors.bearish.primary
        : config.color === 'warning'
          ? colors.warning.primary
          : colors.text.tertiary;

  return (
    <Surface
      tone={config.tone}
      emphasis={status === 'error' || status === 'stale' ? 'outlined' : 'quiet'}
      className={cn('items-center', className)}
      {...props}
    >
      <View
        accessible
        accessibilityRole={status === 'error' ? 'alert' : 'summary'}
        accessibilityLiveRegion={status === 'error' ? 'assertive' : 'polite'}
        accessibilityLabel={[title, description, detail].filter(Boolean).join('. ')}
        className="items-center"
      >
        {icon ? (
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {icon}
          </View>
        ) : status === 'loading' ? (
          <ActivityIndicator
            color={iconColor}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          <Ionicons
            name={iconName ?? config.icon}
            size={26}
            color={iconColor}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
        <Text variant="h3" headingLevel={headingLevel} className="mt-3 text-center">
          {title}
        </Text>
        {description ? (
          <Text variant="body-sm" className="mt-2 max-w-sm text-center">
            {description}
          </Text>
        ) : null}
        {detail ? (
          <Text variant="caption" className="mt-2 max-w-sm text-center">
            {detail}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button variant="outline" size="sm" className="mt-4" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Surface>
  );
}

export function LoadingState(props: Omit<StatusStateProps, 'status'>) {
  return <StatusState status="loading" {...props} />;
}

export function StaleState(props: Omit<StatusStateProps, 'status'>) {
  return <StatusState status="stale" {...props} />;
}
