import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

import type { EvidencePack } from '../types/ai-trust.types';

interface EvidencePanelProps {
  evidence: EvidencePack;
  defaultCollapsed?: boolean;
}

export function EvidencePanel({ evidence, defaultCollapsed = true }: EvidencePanelProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [open, setOpen] = useState(!defaultCollapsed);
  const present = evidence.items.filter((i) => i.present);
  const missing = evidence.items.filter((i) => !i.present);

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
            Observation & evidence
          </Text>
          <Text variant="body-sm" className="mt-1 leading-relaxed text-text-primary">
            {evidence.observation}
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
          <Text variant="caption" className="font-semibold text-bullish">
            Supporting modules
          </Text>
          {present.map((item) => (
            <Pressable
              key={item.id}
              disabled={!item.href}
              accessibilityRole={item.href ? 'link' : 'text'}
              onPress={() => {
                if (item.href) router.push(item.href as never);
              }}
              className="flex-row items-start gap-2 rounded-xl bg-background/40 px-3 py-2"
            >
              <Text variant="caption" className="mt-0.5 font-bold text-bullish">
                ✓
              </Text>
              <View className="flex-1">
                <Text variant="caption" className="font-medium text-text-primary">
                  {item.label}
                  {item.href ? ' →' : ''}
                </Text>
                <Text variant="caption" className="leading-relaxed text-text-secondary">
                  {item.detail}
                </Text>
              </View>
            </Pressable>
          ))}
          {missing.length > 0 ? (
            <>
              <Text variant="caption" className="mt-1 font-semibold text-text-tertiary">
                Not in this context
              </Text>
              {missing.slice(0, 4).map((item) => (
                <Text key={item.id} variant="caption" className="text-text-tertiary">
                  · {item.label}: {item.detail}
                </Text>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
