import { Pressable, View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { formatDate } from '@/shared/utils/date';
import { formatChange, formatPercent, formatPrice, getPriceColorClass } from '@/shared/utils/format';

import type { JournalEntry } from '../types/journal.types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress?: (entry: JournalEntry) => void;
  onDelete?: (entryId: string) => void;
}

const outcomeVariant: Record<
  JournalEntry['outcome'],
  'success' | 'danger' | 'warning' | 'outline'
> = {
  win: 'success',
  loss: 'danger',
  breakeven: 'warning',
  open: 'outline',
};

export function JournalEntryCard({ entry, onPress, onDelete }: JournalEntryCardProps) {
  const pnlColor = getPriceColorClass(entry.pnl ?? 0);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(entry)}>
      <GlassCard className="mb-2 p-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text variant="h3">{entry.symbol}</Text>
              <Badge label={entry.direction} variant="outline" size="sm" />
              <Badge label={entry.outcome} variant={outcomeVariant[entry.outcome]} size="sm" />
            </View>

            <Text variant="body-sm" className="mt-1">
              {entry.quantity} @ {formatPrice(entry.entryPrice)}
              {entry.exitPrice ? ` → ${formatPrice(entry.exitPrice)}` : ' (open)'}
            </Text>

            {entry.strategy ? (
              <Text variant="caption" className="mt-1 text-accent">
                {entry.strategy}
              </Text>
            ) : null}

            {entry.notes ? (
              <Text variant="caption" numberOfLines={2} className="mt-1">
                {entry.notes}
              </Text>
            ) : null}

            <Text variant="caption" className="mt-1 text-text-tertiary">
              {formatDate(Date.parse(entry.tradedAt))}
            </Text>
          </View>

          <View className="items-end">
            {entry.pnl !== undefined ? (
              <>
                <Text variant="price" className={pnlColor}>
                  {formatChange(entry.pnl)}
                </Text>
                {entry.pnlPercent !== undefined ? (
                  <Text variant="caption" className={pnlColor}>
                    {formatPercent(entry.pnlPercent)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text variant="caption" className="text-text-tertiary">
                Open
              </Text>
            )}
            {onDelete ? (
              <Pressable
                accessibilityRole="button"
                className="mt-2"
                onPress={() => onDelete(entry.id)}
              >
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
