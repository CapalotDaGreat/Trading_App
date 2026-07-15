import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface EmbeddedAiInsightProps {
  title: string;
  body: string;
  onExplain?: () => void;
  confidence?: number;
  className?: string;
}

export function EmbeddedAiInsight({
  title,
  body,
  onExplain,
  confidence,
  className,
}: EmbeddedAiInsightProps) {
  const { colors } = useTheme();

  return (
    <View
      className={cn(
        'flex-row items-start gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5',
        className,
      )}
    >
      <View className="mt-0.5">
        <Ionicons name="sparkles" size={16} color={colors.accent.primary} />
      </View>

      <View className="min-w-0 flex-1">
        <View className="mb-0.5 flex-row flex-wrap items-center gap-2">
          <Text variant="caption" className="font-semibold text-accent">
            {title}
          </Text>
          {confidence !== undefined ? (
            <Badge label={`${Math.round(confidence)}%`} variant="accent" size="sm" />
          ) : null}
        </View>
        <Text variant="caption" className="leading-relaxed text-text-secondary" numberOfLines={3}>
          {body}
        </Text>
      </View>

      {onExplain ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explain AI insight"
          onPress={onExplain}
          className="rounded-lg border border-border bg-background-elevated px-2 py-1 active:bg-surface-active"
        >
          <Text variant="caption" className="font-semibold text-accent">
            Explain
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
