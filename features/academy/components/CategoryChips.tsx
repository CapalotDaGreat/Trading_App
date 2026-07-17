import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

import { CATEGORY_LABELS, type LessonCategory } from '../types/academy.types';

export type CategoryFilter = 'all' | 'decision' | 'classic' | LessonCategory;

interface CategoryChipsProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'decision', label: 'Decision' },
  { id: 'classic', label: 'Classic' },
  { id: 'risk_management', label: CATEGORY_LABELS.risk_management },
  { id: 'technical_analysis', label: CATEGORY_LABELS.technical_analysis },
  { id: 'psychology', label: CATEGORY_LABELS.psychology },
  { id: 'fundamental_analysis', label: CATEGORY_LABELS.fundamental_analysis },
  { id: 'basics', label: CATEGORY_LABELS.basics },
  { id: 'options', label: CATEGORY_LABELS.options },
  { id: 'crypto', label: CATEGORY_LABELS.crypto },
  { id: 'journaling', label: CATEGORY_LABELS.journaling },
];

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
      <View className="flex-row gap-2 pr-4">
        {FILTERS.map((filter) => {
          const active = value === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => onChange(filter.id)}
              className={cn(
                'rounded-full px-3 py-1.5',
                active ? 'bg-accent-muted' : 'bg-surface',
              )}
            >
              <Text
                variant="caption"
                className={cn(active ? 'font-semibold text-accent' : 'text-text-secondary')}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
