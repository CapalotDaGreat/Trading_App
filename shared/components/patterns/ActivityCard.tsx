import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export type ActivityStatus = 'in_progress' | 'completed' | 'available';

interface ActivityStatusBadgeProps {
  status: ActivityStatus;
}

export function ActivityStatusBadge({ status }: ActivityStatusBadgeProps) {
  const copy: Record<ActivityStatus, { label: string; variant: 'accent' | 'success' | 'outline' }> = {
    in_progress: { label: 'In progress', variant: 'accent' },
    completed: { label: 'Complete', variant: 'success' },
    available: { label: 'Available', variant: 'outline' },
  };
  const value = copy[status];
  return <Badge label={value.label} variant={value.variant} size="sm" />;
}

interface ActivityCardProps {
  title: string;
  description: string;
  status?: ActivityStatus;
  progress?: number;
  progressLabel?: string;
  actionLabel: string;
  onAction: () => void;
  eyebrow?: string;
  children?: ReactNode;
  className?: string;
  testID?: string;
}

export function ActivityCard({
  title,
  description,
  status = 'available',
  progress,
  progressLabel,
  actionLabel,
  onAction,
  eyebrow,
  children,
  className,
  testID,
}: ActivityCardProps) {
  const boundedProgress = progress == null ? undefined : Math.min(1, Math.max(0, progress));
  return (
    <Surface
      className={cn(status === 'in_progress' && 'border border-accent', className)}
      testID={testID}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          {eyebrow ? (
            <Text variant="caption" className="mb-1 text-text-tertiary">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="h3" headingLevel={3}>
            {title}
          </Text>
        </View>
        <ActivityStatusBadge status={status} />
      </View>
      <Text variant="body-sm" className="mt-2 text-text-secondary">
        {description}
      </Text>
      {boundedProgress != null ? (
        <View className="mt-3" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(boundedProgress * 100) }}>
          <View className="h-2 overflow-hidden rounded-full bg-surface-active">
            <View className="h-full rounded-full bg-accent" style={{ width: `${boundedProgress * 100}%` }} />
          </View>
          {progressLabel ? (
            <Text variant="caption" className="mt-1 text-text-tertiary">
              {progressLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
      <Button className="mt-4 self-start" size="sm" onPress={onAction}>
        {actionLabel}
      </Button>
    </Surface>
  );
}

export function ProgressHeader({
  label,
  title,
  detail,
}: {
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <Surface tone="accent" emphasis="outlined" className="mb-4" testID="activity-progress-header">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="label" className="text-accent">
          {label}
        </Text>
        <ActivityStatusBadge status="in_progress" />
      </View>
      <Text variant="h2" headingLevel={2} className="mt-2">
        {title}
      </Text>
      <Text variant="body-sm" className="mt-1 text-text-secondary">
        {detail}
      </Text>
    </Surface>
  );
}
