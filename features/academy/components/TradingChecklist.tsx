import { Pressable, View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { useTradingChecklist } from '../hooks/useAcademy';

interface TradingChecklistProps {
  checklistId?: string;
}

export function TradingChecklist({ checklistId = 'pre-trade-checklist' }: TradingChecklistProps) {
  const {
    checklist,
    checkedCount,
    totalCount,
    toggleItem,
    resetChecklist,
    isItemChecked,
    isLoading,
  } = useTradingChecklist(checklistId);

  if (isLoading || !checklist) {
    return null;
  }

  const requiredItems = checklist.items.filter((i) => i.isRequired);
  const requiredChecked = requiredItems.filter((i) => isItemChecked(i.id)).length;
  const allRequiredMet = requiredChecked === requiredItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <GlassCard className="p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text variant="h3">{checklist.title}</Text>
          <Text variant="body-sm" className="mt-1">
            {checklist.description}
          </Text>
        </View>
        <Text variant="caption" className={allRequiredMet ? 'text-bullish' : 'text-text-tertiary'}>
          {checkedCount}/{totalCount}
        </Text>
      </View>

      <View className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface">
        <View
          className="h-full rounded-full bg-accent"
          style={{ width: `${progress}%` }}
        />
      </View>

      {checklist.items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => {
          const checked = isItemChecked(item.id);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => toggleItem(item.id)}
              className="mb-2 flex-row items-start gap-3 rounded-xl p-2 active:bg-surface"
            >
              <View
                className={cn(
                  'mt-0.5 h-5 w-5 items-center justify-center rounded-md border',
                  checked ? 'border-border-strong bg-accent' : 'border-border bg-surface',
                )}
              >
                {checked ? (
                  <Text variant="caption" className="font-bold text-text-inverse">
                    ✓
                  </Text>
                ) : null}
              </View>
              <View className="flex-1">
                <Text
                  variant="body-sm"
                  className={cn(checked && 'text-text-tertiary line-through')}
                >
                  {item.text}
                </Text>
                {item.isRequired ? (
                  <Text variant="caption" className="text-accent">
                    Required
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

      <Button variant="ghost" size="sm" onPress={resetChecklist}>
        Reset Checklist
      </Button>

      {allRequiredMet ? (
        <Text variant="caption" className="mt-2 text-center text-bullish">
          All required items complete — ready to trade!
        </Text>
      ) : null}
    </GlassCard>
  );
}
