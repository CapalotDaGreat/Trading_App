import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiWhyChanged } from '../types/ai-trust.types';

interface WhyThisChangedPanelProps {
  change: AiWhyChanged;
  defaultCollapsed?: boolean;
}

export function WhyThisChangedPanel({
  change,
  defaultCollapsed = false,
}: WhyThisChangedPanelProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(!defaultCollapsed);

  return (
    <View className="rounded-2xl border border-accent/30 bg-accent-muted/20 p-3">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-1 pr-2">
          <Text variant="caption" className="font-semibold uppercase tracking-wide text-accent">
            Why this changed
          </Text>
          <Text variant="body-sm" className="mt-1 text-text-primary">
            {change.reason}
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.accent.primary}
        />
      </Pressable>

      {open ? (
        <View className="mt-3 gap-2">
          <View className="rounded-xl bg-background/50 px-3 py-2">
            <Text variant="caption" className="text-text-tertiary">
              Previous · {formatRelativeTime(change.previousAt)}
            </Text>
            <Text variant="caption" className="mt-0.5 text-text-primary">
              {change.previousSummary}
            </Text>
          </View>
          <Text variant="caption" className="text-center text-text-tertiary">
            ↓
          </Text>
          <View className="rounded-xl bg-background/50 px-3 py-2">
            <Text variant="caption" className="text-text-tertiary">
              Current · {formatRelativeTime(change.currentAt)}
            </Text>
            <Text variant="caption" className="mt-0.5 text-text-primary">
              {change.currentSummary}
            </Text>
          </View>
          {change.drivers.map((d) => (
            <View key={`${d.driver}-${d.label}`} className="px-1">
              <Text variant="caption" className="font-medium text-text-primary">
                {d.label}
              </Text>
              <Text variant="caption" className="text-text-secondary">
                {d.detail}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
