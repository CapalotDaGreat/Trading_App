import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { NavigationHubSection } from '@/features/navigation/config/navigation-ia.config';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface HubPathListProps {
  sections: readonly NavigationHubSection[];
  /** Emphasize the first section as the primary path (Start). */
  emphasizeFirst?: boolean;
}

/**
 * Calm hub list — Start / Continue / Deepen sections with generous row targets.
 * Replaces ad-hoc hub markup on Research / Review / You.
 */
export function HubPathList({ sections, emphasizeFirst = true }: HubPathListProps) {
  const { colors } = useTheme();

  return (
    <View className="gap-9">
      {sections.map((section, sectionIndex) => {
        const isPrimary = emphasizeFirst && sectionIndex === 0;
        return (
          <View key={section.title}>
            <Text
              variant="caption"
              className="mb-3 px-1 font-medium tracking-[0.06em] text-text-tertiary"
            >
              {section.title}
            </Text>

            <View
              className={cn(
                'overflow-hidden rounded-panel',
                isPrimary ? 'bg-accent-muted' : 'bg-background-elevated',
              )}
            >
              {section.items.map((item, index) => (
                <View key={item.href}>
                  {index > 0 ? (
                    <View
                      className="ml-16 bg-border"
                      style={{ height: StyleSheet.hairlineWidth }}
                    />
                  ) : null}
                  <Link href={item.href as never} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={item.accessibilityLabel}
                      testID={item.testID}
                      className="min-h-13 flex-row items-center px-4 py-4 active:opacity-70"
                    >
                      <View
                        className={cn(
                          'mr-3.5 items-center justify-center rounded-xl',
                          isPrimary ? 'h-12 w-12 bg-background-elevated' : 'h-10 w-10 bg-surface',
                        )}
                      >
                        <Ionicons
                          name={item.icon}
                          size={isPrimary ? 22 : 18}
                          color={colors.accent.primary}
                        />
                      </View>
                      <View className="min-w-0 flex-1 pr-2">
                        <Text
                          variant={isPrimary ? 'h3' : 'body'}
                          className={isPrimary ? undefined : 'font-semibold'}
                        >
                          {item.title}
                        </Text>
                        <Text variant="caption" className="mt-1 leading-5 text-text-secondary">
                          {item.description}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                    </Pressable>
                  </Link>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
