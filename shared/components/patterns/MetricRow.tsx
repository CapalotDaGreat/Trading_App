import { View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface MetricRowProps extends ViewProps {
  label: string;
  value: string;
  detail?: string;
  valueClassName?: string;
}

export function MetricRow({
  label,
  value,
  detail,
  valueClassName,
  className,
  ...props
}: MetricRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${detail ? `. ${detail}` : ''}`}
      className={cn('min-h-11 flex-row items-center justify-between gap-4 py-2', className)}
      {...props}
    >
      <View className="min-w-0 flex-1">
        <Text variant="body-sm" className="text-text-secondary">
          {label}
        </Text>
        {detail ? <Text variant="caption">{detail}</Text> : null}
      </View>
      <Text variant="mono" className={cn('text-right', valueClassName)}>
        {value}
      </Text>
    </View>
  );
}
