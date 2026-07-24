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
  explainLabel?: string;
  /** Evidence/process quality only; never probability of a price move. */
  confidence?: number;
  scoreLabel?: 'DQS' | 'RVS' | 'Evidence';
  className?: string;
}

export function EmbeddedAiInsight({
  title,
  body,
  onExplain,
  explainLabel = 'Details',
  confidence,
  scoreLabel = 'Evidence',
  className,
}: EmbeddedAiInsightProps) {
  const { colors } = useTheme();

  return (
    <View
      className={cn(
        'flex-row items-start gap-2.5 rounded-2xl bg-accent-muted/60 px-3.5 py-3',
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
            <Badge
              label={`${scoreLabel} ${Math.round(confidence)}/100`}
              variant="accent"
              size="sm"
            />
          ) : null}
        </View>
        <Text variant="caption" className="leading-relaxed text-text-secondary" numberOfLines={3}>
          {body}
        </Text>
      </View>

      {onExplain ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={explainLabel}
          onPress={onExplain}
          className="min-h-11 justify-center rounded-full bg-surface px-3 active:bg-surface-active"
        >
          <Text variant="caption" className="font-semibold text-accent">
            {explainLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
