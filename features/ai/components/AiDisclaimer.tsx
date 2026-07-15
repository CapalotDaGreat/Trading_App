import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface AiDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export function AiDisclaimer({ compact = false, className }: AiDisclaimerProps) {
  const { colors } = useTheme();

  return (
    <View
      className={cn(
        'flex-row rounded-xl border border-border bg-surface',
        compact ? 'p-2.5' : 'p-4',
        className,
      )}
    >
      <Ionicons
        name="information-circle"
        size={compact ? 16 : 20}
        color={colors.accent.primary}
        style={{ marginRight: 8, marginTop: 2 }}
      />
      <View className="flex-1">
        <Text variant={compact ? 'caption' : 'label'} className="mb-0.5 text-accent">
          AI Analysis Disclaimer
        </Text>
        <Text variant="caption" className="leading-relaxed text-text-secondary">
          TradeVision AI provides market analysis and educational insights based on available data.
          It does not predict future prices or guarantee outcomes. This is not financial advice.
          Always conduct your own research and consult a licensed professional before making
          investment decisions.
        </Text>
      </View>
    </View>
  );
}
