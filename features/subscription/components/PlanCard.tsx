import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import type { SubscriptionPlan } from '@/features/subscription/types/subscription.types';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface PlanCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: (planId: SubscriptionPlan['id']) => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onSelect(plan.id)}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4',
        selected ? 'border-border-strong bg-accent-muted' : 'border-border bg-surface',
      )}
    >
      {plan.isPopular ? (
        <View className="absolute right-3 top-3 rounded-full bg-accent px-2 py-0.5">
          <Text className="text-[10px] font-bold text-text-inverse">{plan.badge}</Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-8">
          <Text variant="h3">{plan.title}</Text>
          <Text variant="body-sm" className="mt-1">
            {plan.description}
          </Text>
          {plan.savingsPercent ? (
            <Text variant="caption" className="mt-2 text-accent">
              Save {plan.savingsPercent}%
            </Text>
          ) : null}
        </View>

        <View className="items-end">
          <Text variant="price">{plan.price}</Text>
          {plan.pricePerMonth ? (
            <Text variant="caption" className="mt-0.5">
              {plan.pricePerMonth}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="absolute bottom-4 left-4">
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selected ? '#00D4AA' : '#64748B'}
        />
      </View>
    </Pressable>
  );
}
