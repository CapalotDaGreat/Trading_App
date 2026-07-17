import { Badge } from '@/shared/components/ui/Badge';

import {
  DATA_SOURCE_LABEL,
  type DataSourceKind,
} from '../constants/data-source';

interface DataSourceBadgeProps {
  kind: DataSourceKind;
  size?: 'sm' | 'md';
  className?: string;
}

const VARIANT: Record<
  DataSourceKind,
  'success' | 'warning' | 'danger' | 'default' | 'outline'
> = {
  live: 'success',
  delayed: 'warning',
  approximate: 'warning',
  sample: 'outline',
  mock: 'outline',
};

export function DataSourceBadge({ kind, size = 'sm', className }: DataSourceBadgeProps) {
  return (
    <Badge
      label={DATA_SOURCE_LABEL[kind]}
      variant={VARIANT[kind]}
      size={size}
      className={className}
    />
  );
}
