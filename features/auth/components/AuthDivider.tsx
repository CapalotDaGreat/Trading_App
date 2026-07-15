import { Text, View } from 'react-native';

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = 'or continue with' }: AuthDividerProps) {
  return (
    <View className="my-6 flex-row items-center">
      <View className="h-px flex-1 bg-slate-700/80" />
      <Text className="mx-4 text-xs font-medium uppercase tracking-widest text-slate-500">
        {label}
      </Text>
      <View className="h-px flex-1 bg-slate-700/80" />
    </View>
  );
}
