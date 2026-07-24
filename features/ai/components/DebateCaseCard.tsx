import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, UIManager, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import type { DebateCase, DebateSide } from '@/features/ai/types/ai-debate.types';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SIDE_META: Record<
  DebateSide,
  {
    icon: keyof typeof Ionicons.glyphMap;
    container: string;
    accent: string;
    badge: string;
  }
> = {
  bull: {
    icon: 'trending-up',
    container: 'border-bullish/25 bg-bullish-muted/40',
    accent: 'text-bullish',
    badge: 'BULL',
  },
  bear: {
    icon: 'trending-down',
    container: 'border-bearish/25 bg-bearish-muted/40',
    accent: 'text-bearish',
    badge: 'BEAR',
  },
  neutral: {
    icon: 'remove-outline',
    container: 'border-info/25 bg-info-muted/50',
    accent: 'text-info',
    badge: 'NEUTRAL',
  },
};

interface DebateCaseCardProps {
  debateCase: DebateCase;
  defaultExpanded?: boolean;
  index?: number;
}

export function DebateCaseCard({
  debateCase,
  defaultExpanded = false,
  index = 0,
}: DebateCaseCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const meta = SIDE_META[debateCase.side];
  const iconColor =
    debateCase.side === 'bull'
      ? colors.bullish.primary
      : debateCase.side === 'bear'
        ? colors.bearish.primary
        : colors.info.primary;

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded, debateCase.side]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((value) => !value);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify()}
      layout={LinearTransition.springify()}
      className={cn('overflow-hidden rounded-2xl border', meta.container)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${debateCase.title}. ${expanded ? 'Collapse' : 'Expand'}`}
        testID={`debate-case-${debateCase.side}`}
        onPress={toggle}
        className="min-h-12 flex-row items-center px-4 py-3.5"
      >
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-background/40">
          <Ionicons name={meta.icon} size={18} color={iconColor} />
        </View>
        <View className="flex-1 pr-2">
          <View className="flex-row items-center gap-2">
            <Text variant="caption" className={cn('font-semibold tracking-wide', meta.accent)}>
              {meta.badge}
            </Text>
            <Text variant="label" className="text-text-primary">
              {debateCase.title}
            </Text>
          </View>
          <Text variant="caption" className="mt-0.5 text-text-secondary" numberOfLines={expanded ? 3 : 1}>
            {debateCase.summary}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.text.tertiary}
        />
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutUp.duration(160)}
          className="border-t border-border/60 px-4 pb-4 pt-3"
        >
          <View className="gap-2.5">
            {debateCase.points.map((item) => (
              <View key={`${item.source}-${item.text}`} className="flex-row items-start gap-2">
                <Text variant="body" className={meta.accent}>
                  •
                </Text>
                <View className="flex-1">
                  <Text variant="body-sm" className="leading-relaxed text-text-primary">
                    {item.text}
                  </Text>
                  <Text variant="caption" className="mt-0.5 capitalize text-text-tertiary">
                    {item.source}
                    {item.citation ? ` · ${item.citation}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-4 rounded-xl bg-background/35 px-3 py-3">
            <Text variant="caption" className="mb-1.5 font-semibold uppercase tracking-wide text-text-tertiary">
              What would change this case?
            </Text>
            {debateCase.whatWouldChange.map((line) => (
              <Text key={line} variant="caption" className="mb-1 leading-relaxed text-text-secondary">
                · {line}
              </Text>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
