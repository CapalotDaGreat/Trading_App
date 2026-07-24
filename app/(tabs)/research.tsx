import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  IA_GLOSSARY,
  RESEARCH_HUB_SECTIONS,
} from '@/features/navigation/config/navigation-ia.config';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

export default function ResearchScreen() {
  const { colors } = useTheme();

  return (
    <Screen scrollable safeTop={false} contentClassName="pb-10">
      <Header
        title={IA_GLOSSARY.research}
        subtitle="Choose what deserves your attention"
        transparent
      />

      <View className="mt-2 gap-7">
        {RESEARCH_HUB_SECTIONS.map((section, sectionIndex) => (
          <View key={section.title}>
            <Text variant="label" className="mb-2.5 px-1 text-text-tertiary">
              {section.title.toUpperCase()}
            </Text>

            <View
              className={
                sectionIndex === 0
                  ? 'overflow-hidden rounded-2xl bg-accent-muted'
                  : 'overflow-hidden rounded-2xl bg-background-elevated'
              }
            >
              {section.items.map((item, index) => (
                <View key={item.href}>
                  {index > 0 ? (
                    <View
                      className="ml-[64px] bg-border"
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
                      <View
                        className={`mr-3.5 items-center justify-center rounded-xl ${
                          sectionIndex === 0
                            ? 'h-11 w-11 bg-background-elevated'
                            : 'h-9 w-9 bg-surface'
                        }`}
                      >
                        <Ionicons name={item.icon} size={20} color={colors.accent.primary} />
                      </View>
                      <View className="min-w-0 flex-1 pr-2">
                        <Text
                          variant={sectionIndex === 0 ? 'h3' : 'body'}
                          className={sectionIndex === 0 ? 'text-text-primary' : 'font-semibold'}
                        >
                          {item.title}
                        </Text>
                        <Text variant="caption" className="mt-0.5 text-text-secondary">
                          {item.description}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color={colors.text.tertiary} />
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
