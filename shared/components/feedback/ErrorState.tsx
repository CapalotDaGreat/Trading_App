import { type ViewProps } from 'react-native';

import { StatusState } from '@/shared/components/feedback/StatusState';

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
  return (
    <StatusState
      status="error"
      title={title}
      description={description}
      detail={[why ? `Why: ${why}` : undefined, recovery ? `Recover: ${recovery}` : undefined]
        .filter(Boolean)
        .join('. ')}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      className={className}
      {...props}
    />
  );
}
