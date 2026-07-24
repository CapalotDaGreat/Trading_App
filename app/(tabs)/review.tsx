import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  IA_GLOSSARY,
  REVIEW_HUB_SECTIONS,
} from '@/features/navigation/config/navigation-ia.config';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function ReviewScreen() {
  const { colors } = useTheme();

  return (
    <Screen scrollable safeTop={false} contentClassName="pb-10">
      <Header
        title={IA_GLOSSARY.review}
        subtitle="Turn recorded decisions into better process"
        transparent
      />

      <View className="mt-2 gap-7">
        {REVIEW_HUB_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text variant="label" className="mb-2.5 px-1 text-text-tertiary">
              {section.title.toUpperCase()}
            </Text>

            <View className="overflow-hidden rounded-2xl bg-background-elevated">
              {section.items.map((item, index) => (
                <View key={item.href}>
                  {index > 0 ? (
                    <View
                      className="ml-[60px] bg-border"
                      style={{ height: StyleSheet.hairlineWidth }}
                    />
                  ) : null}
                  <Link href={item.href as never} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={item.accessibilityLabel}
                      testID={item.testID}
                      className="min-h-11 flex-row items-center px-4 py-3.5 active:opacity-70"
                    >
                      <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-xl bg-surface">
                        <Ionicons name={item.icon} size={18} color={colors.accent.primary} />
                      </View>
                      <View className="min-w-0 flex-1 pr-2">
                        <Text variant="body" className="font-semibold text-text-primary">
                          {item.title}
                        </Text>
                        <Text variant="caption" className="mt-0.5 text-text-secondary">
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
        ))}
      </View>
    </Screen>
  );
}
