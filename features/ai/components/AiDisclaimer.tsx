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
          Educational purposes only · Not financial advice · Research context only · Explanations
          describe process and evidence, not price predictions. TradeInsight does not provide
          buy/sell signals. You are solely responsible for any trading decisions. Always verify
          independently and consult a licensed professional when needed.
        </Text>
      </View>
    </View>
  );
}
