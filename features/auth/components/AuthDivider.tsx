import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = 'or continue with' }: AuthDividerProps) {
  return (
    <View className="my-6 flex-row items-center">
      <View className="h-px flex-1 bg-border-strong" />
      <Text variant="caption" className="mx-4 font-medium uppercase tracking-widest">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border-strong" />
    </View>
  );
}
