import { Pressable, Switch, View } from 'react-native';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import type { PriceAlert } from '@/shared/types/market';
import { formatPrice } from '@/shared/utils/format';
import { formatRelativeTime } from '@/shared/utils/date';

interface AlertCardProps {
  alert: PriceAlert & { note?: string };
  onToggle?: (alertId: string, isActive: boolean) => void;
  onDelete?: (alertId: string) => void;
  onPress?: (alert: PriceAlert) => void;
}

export function AlertCard({ alert, onToggle, onDelete, onPress }: AlertCardProps) {
  const { colors } = useTheme();
  const conditionLabel = alert.condition === 'above' ? '≥' : '≤';
  const isTriggered = Boolean(alert.triggeredAt);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(alert)}>
      <GlassCard className="mb-2 p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text variant="h3">{alert.symbol}</Text>
              {isTriggered ? (
                <Text variant="caption" className="text-bullish">
                  Triggered
                </Text>
              ) : null}
            </View>
            <Text variant="body-sm">
              Alert when price {conditionLabel} {formatPrice(alert.targetPrice)}
            </Text>
            {alert.note ? (
              <Text variant="caption" className="mt-1" numberOfLines={2}>
                {alert.note}
              </Text>
            ) : null}
            <Text variant="caption" className="mt-1 text-text-tertiary">
              Created {formatRelativeTime(alert.createdAt)}
            </Text>
          </View>

          <View className="items-end gap-2">
            <Switch
              accessibilityLabel={`${alert.symbol} price alert`}
              value={alert.isActive}
              onValueChange={(value) => onToggle?.(alert.id, value)}
              trackColor={{ false: colors.background.tertiary, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
            />
            {onDelete ? (
              <Pressable accessibilityRole="button" onPress={() => onDelete(alert.id)}>
                <Text variant="caption" className="text-bearish">
                  Delete
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}
