import { Pressable, View } from 'react-native';

import { useRegime } from '@/features/decision/hooks/useDecision';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { useTradingChecklist } from '../hooks/useAcademy';

interface TradingChecklistProps {
  checklistId?: string;
  compact?: boolean;
}

const REGIME_HIGHLIGHTS: Record<string, string[]> = {
  ranging: ['4', '6'],
  trending: ['4', '6'],
  risk_on: ['4', '6'],
  risk_off: ['2', '3', '5', '7'],
  high_volatility: ['2', '5', 'h1', 'h2', 'h4'],
};

export function TradingChecklist({
  checklistId = 'pre-trade-checklist',
  compact = false,
}: TradingChecklistProps) {
  const regimeQuery = useRegime();
  const highlightIds = REGIME_HIGHLIGHTS[regimeQuery.data?.regime ?? ''] ?? ['4'];
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
    <View className="rounded-2xl bg-background-elevated p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text variant="h3">{checklist.title}</Text>
          {!compact ? (
            <Text variant="body-sm" className="mt-1">
              {checklist.description}
            </Text>
          ) : null}
          {checklistId === 'pre-trade-checklist' && regimeQuery.data ? (
            <Text variant="caption" className="mt-1 text-accent">
              Highlighted for {regimeQuery.data.label} regime
            </Text>
          ) : null}
        </View>
        <Text variant="caption" className={allRequiredMet ? 'text-bullish' : 'text-text-tertiary'}>
          {checkedCount}/{totalCount}
        </Text>
      </View>

      <View className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface">
        <View className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
      </View>

      {checklist.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => {
          const checked = isItemChecked(item.id);

          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => toggleItem(item.id)}
              className={cn(
                'mb-2 flex-row items-start gap-3 rounded-xl p-2 active:bg-surface',
                highlightIds.includes(item.id) && !checked && 'bg-accent-muted/40',
              )}
            >
              <View
                className={cn(
                  'mt-0.5 h-5 w-5 items-center justify-center rounded-md',
                  checked ? 'bg-accent' : 'bg-surface',
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
                {!compact && item.hint && !checked ? (
                  <Text variant="caption" className="mt-0.5">
                    {item.hint}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}

      <Button variant="ghost" size="sm" onPress={resetChecklist}>
        Reset checklist
      </Button>

      {allRequiredMet ? (
        <Text variant="caption" className="mt-2 text-center text-bullish">
          Required items complete — process looks solid.
        </Text>
      ) : null}
    </View>
  );
}
