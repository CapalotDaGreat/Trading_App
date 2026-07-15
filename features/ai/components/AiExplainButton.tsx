import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface AiExplainButtonProps {
  symbol: string;
  label?: string;
}

export function AiExplainButton({ symbol, label = 'AI Explain' }: AiExplainButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/analysis/[symbol]', params: { symbol, tab: 'ai' } } as never)
      }
      className="flex-row items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5"
    >
      <Ionicons name="sparkles" size={14} color={colors.accent.primary} />
      <Text variant="caption" className="text-accent">
        {label}
      </Text>
    </Pressable>
  );
}
