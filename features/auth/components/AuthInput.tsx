import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function AuthInput({ label, error, isPassword = false, ...props }: AuthInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>
      <View
        className={`flex-row items-center rounded-2xl border bg-slate-900/80 px-4 ${
          error ? 'border-red-500/70' : 'border-slate-700/80'
        }`}
      >
        <TextInput
          className="h-14 flex-1 text-base text-white"
          placeholderTextColor="#64748B"
          secureTextEntry={isPassword && !isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {isPassword ? (
          <Ionicons
            name={isVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#94A3B8"
            onPress={() => setIsVisible((prev) => !prev)}
          />
        ) : null}
      </View>
      {error ? <Text className="mt-1.5 text-sm text-red-400">{error}</Text> : null}
    </View>
  );
}
