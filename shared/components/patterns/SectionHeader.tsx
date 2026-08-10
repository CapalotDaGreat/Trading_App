import { View, type ViewProps } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Text, type HeadingLevel } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export interface SectionHeaderProps extends ViewProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  headingLevel?: HeadingLevel;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
  headingLevel = 2,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <View className={cn('mb-1 flex-row items-start justify-between', className)} {...props}>
      <View className="mr-4 flex-1">
        <Text variant="h3" headingLevel={headingLevel} className="tracking-tight">
          {title}
        </Text>
        {description ? (
          <Text variant="body-sm" className="mt-1.5 leading-6">
            {description}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button variant="ghost" size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
