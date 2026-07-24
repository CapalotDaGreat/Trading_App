import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Input, type InputProps } from '@/shared/components/ui/Input';
import { useTheme } from '@/shared/hooks/useTheme';

interface AuthInputProps extends Omit<InputProps, 'rightElement'> {
  label: string;
  isPassword?: boolean;
}

export function AuthInput({ label, error, isPassword = false, ...props }: AuthInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <Input
      label={label}
      error={error}
      secureTextEntry={isPassword && !isVisible}
      autoCapitalize="none"
      autoCorrect={false}
      containerClassName="mb-4"
      rightElement={
        isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsVisible((prev) => !prev)}
            className="h-11 w-11 items-center justify-center"
          >
            <Ionicons
              name={isVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.text.secondary}
            />
          </Pressable>
        ) : undefined
      }
      {...props}
    />
  );
}
