import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/shared/components/ui/Badge';
import { Chip } from '@/shared/components/ui/Chip';
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
  const router = useRouter();
  const pnlColor = getPriceColorClass(entry.pnl ?? 0);
  const isProcessNote = entry.quantity === 0 && entry.outcome === 'open';

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(entry)}>
      <GlassCard className="mb-2 p-3" testID={`journal-entry-${entry.id}`}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text variant="h3">{entry.symbol}</Text>
              <Badge label={entry.direction} variant="outline" size="sm" />
              <Badge
                label={isProcessNote ? 'process' : entry.outcome}
                variant={isProcessNote ? 'outline' : outcomeVariant[entry.outcome]}
                size="sm"
              />
              {entry.emotion ? <Badge label={entry.emotion} variant="outline" size="sm" /> : null}
            </View>

            {!isProcessNote ? (
              <Text variant="body-sm" className="mt-1">
                {entry.quantity} @ {formatPrice(entry.entryPrice)}
                {entry.exitPrice ? ` → ${formatPrice(entry.exitPrice)}` : ' (open)'}
              </Text>
            ) : (
              <Text variant="body-sm" className="mt-1 text-text-secondary">
                Decision note — no execution
              </Text>
            )}

            {entry.strategy ? (
              <Text variant="caption" className="mt-1 text-accent">
                {entry.strategy}
              </Text>
            ) : null}

            {entry.tags.length > 0 ? (
              <View className="mt-2 flex-row flex-wrap gap-1">
                {entry.tags.slice(0, 4).map((tag) => (
                  <Chip key={tag} label={tag} disabled />
                ))}
              </View>
            ) : null}

            {entry.notes ? (
              <Text variant="caption" numberOfLines={2} className="mt-1">
                {entry.notes}
              </Text>
            ) : null}

            {entry.lessonsLearned ? (
              <Text variant="caption" numberOfLines={2} className="mt-1 text-text-secondary">
                Lesson: {entry.lessonsLearned}
              </Text>
            ) : null}

            {typeof entry.planAdhered === 'boolean' ? (
              <Text variant="caption" className="mt-1 text-text-tertiary">
                Plan {entry.planAdhered ? 'adhered' : 'drifted'}
                {entry.mistakeCategory ? ` · ${entry.mistakeCategory.replace('_', ' ')}` : ''}
              </Text>
            ) : null}

            {entry.linkedReplayHref ? (
              <Pressable
                className="mt-1"
                onPress={() => router.push(entry.linkedReplayHref as never)}
              >
                <Text variant="caption" className="text-accent">
                  Open linked replay
                </Text>
              </Pressable>
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
                {isProcessNote ? 'Note' : 'Open'}
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
