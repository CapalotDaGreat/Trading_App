import { forwardRef, useId, useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftElement,
    rightElement,
    containerClassName,
    inputClassName,
    editable = true,
    onFocus,
    onBlur,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    nativeID,
    ...props
  },
  ref,
) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);
  const generatedId = useId();
  const inputId = nativeID ?? `input-${generatedId}`;
  const labelId = `${inputId}-label`;
  const messageId = `${inputId}-message`;

  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text nativeID={labelId} variant="label" className="mb-2 text-text-secondary">
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          'min-h-11 flex-row items-center rounded-control border border-transparent bg-surface px-4',
          isFocused && !hasError && 'border-focus bg-accent-muted',
          hasError && 'border-bearish bg-bearish-muted',
          !editable && 'border-transparent bg-disabled',
        )}
      >
        {leftElement}
        <TextInput
          ref={ref}
          nativeID={inputId}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          accessibilityLabelledBy={label ? labelId : undefined}
          accessibilityHint={accessibilityHint ?? error ?? hint}
          accessibilityState={{ ...accessibilityState, disabled: !editable }}
          placeholderTextColor={colors.text.tertiary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            'flex-1 py-3.5 text-base text-text-primary',
            leftElement && 'pl-2',
            rightElement && 'pr-2',
            inputClassName,
          )}
          {...props}
        />
        {rightElement}
      </View>

      {error ? (
        <Text
          nativeID={messageId}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          variant="caption"
          className="mt-1.5 text-bearish"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text nativeID={messageId} variant="caption" className="mt-1.5 text-text-tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
