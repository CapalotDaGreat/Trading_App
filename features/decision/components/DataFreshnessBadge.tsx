import {
  freshnessLabel,
  getDataFreshness,
  type DataFreshnessLevel,
} from '@/features/markets/constants/freshness';
import { Badge } from '@/shared/components/ui/Badge';

interface DataFreshnessBadgeProps {
  fetchedAt?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const FRESHNESS_VARIANT: Record<DataFreshnessLevel, 'success' | 'warning' | 'danger' | 'default'> = {
  live: 'success',
  recent: 'warning',
  stale: 'danger',
  unknown: 'default',
};

const BADGE_LABEL: Record<DataFreshnessLevel, string> = {
  live: 'Live',
  recent: 'Updated',
  stale: 'Stale',
  unknown: freshnessLabel('unknown'),
};

export function DataFreshnessBadge({
  fetchedAt,
  size = 'sm',
  className,
}: DataFreshnessBadgeProps) {
  const level = getDataFreshness(fetchedAt);

  return (
    <Badge
      label={BADGE_LABEL[level]}
      variant={FRESHNESS_VARIANT[level]}
      size={size}
      className={className}
    />
  );
}
