import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import type { AiCounterfactual } from '../types/ai-trust.types';

interface CounterfactualsPanelProps {
  items: AiCounterfactual[];
  defaultCollapsed?: boolean;
}

export function CounterfactualsPanel({
  items,
  defaultCollapsed = true,
}: CounterfactualsPanelProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(!defaultCollapsed);
  if (!items.length) return null;

  return (
    <View className="rounded-2xl border border-border/60 bg-surface/30 p-3">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-1 pr-2">
          <Text variant="caption" className="font-semibold uppercase tracking-wide text-text-tertiary">
            What would change this?
          </Text>
          <Text variant="caption" className="mt-1 text-text-secondary">
            Critical-thinking prompts — not trade triggers
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.tertiary}
        />
      </Pressable>
      {open ? (
        <View className="mt-3 gap-2">
          {items.map((item) => (
            <View key={item.label} className="rounded-xl bg-background/40 px-3 py-2">
              <Text variant="caption" className="font-medium text-text-primary">
                {item.label}
              </Text>
              <Text variant="caption" className="mt-0.5 leading-relaxed text-text-secondary">
                {item.detail}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
