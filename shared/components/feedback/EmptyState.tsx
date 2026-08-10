import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';

import { StatusState } from '@/shared/components/feedback/StatusState';
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
  return (
    <StatusState
      status="empty"
      title={title}
      description={description}
      icon={icon}
      iconName={iconName}
      actionLabel={actionLabel}
      onAction={onAction}
      testID={testID}
      className={cn('flex-1 justify-center px-10 py-16', className)}
    />
  );
}
