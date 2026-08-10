import { Pressable, View, type ViewProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export interface SegmentedControlProps<T extends string> extends Omit<ViewProps, 'children'> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      className={cn('min-h-11 flex-row rounded-control bg-surface p-1', className)}
      {...props}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const isDisabled = disabled || option.disabled;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ selected, disabled: isDisabled }}
            disabled={isDisabled}
            onPress={() => onChange(option.value)}
            className={cn(
              'min-h-11 flex-1 items-center justify-center rounded-control px-3',
              selected && 'bg-accent',
              isDisabled && 'bg-disabled',
            )}
          >
            <Text
              variant="label"
              className={cn(
                selected ? 'text-text-on-accent' : 'text-text-secondary',
                isDisabled && 'text-disabled-foreground',
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
