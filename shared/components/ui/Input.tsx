import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
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
    ...props
  },
  ref,
) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text variant="label" className="mb-2 text-text-secondary">
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          'flex-row items-center rounded-2xl bg-surface px-4',
          isFocused && !hasError && 'bg-accent-muted',
          hasError && 'bg-bearish-muted',
          !editable && 'opacity-50',
        )}
      >
        {leftElement}
        <TextInput
          ref={ref}
          editable={editable}
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
        <Text variant="caption" className="mt-1.5 text-bearish">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="mt-1.5 text-text-tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
