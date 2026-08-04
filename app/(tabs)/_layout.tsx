import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { IA_GLOSSARY } from '@/features/navigation/config/navigation-ia.config';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { useTheme } from '@/shared/hooks/useTheme';

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <ErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.default,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            paddingTop: 10,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 0.2,
          },
          tabBarItemStyle: {
            minHeight: 44,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: IA_GLOSSARY.today,
            tabBarAccessibilityLabel: 'Today tab',
            tabBarIcon: ({ color }) => <TabIcon name="today-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="research"
          options={{
            title: IA_GLOSSARY.research,
            tabBarAccessibilityLabel: 'Research tab',
            tabBarIcon: ({ color }) => <TabIcon name="search-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: IA_GLOSSARY.review,
            tabBarAccessibilityLabel: 'Review tab',
            tabBarIcon: ({ color }) => <TabIcon name="film-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: IA_GLOSSARY.ask,
            tabBarAccessibilityLabel: 'Ask AI tab',
            tabBarIcon: ({ color }) => <TabIcon name="sparkles-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="you"
          options={{
            title: IA_GLOSSARY.you,
            tabBarAccessibilityLabel: 'You tab',
            tabBarIcon: ({ color }) => <TabIcon name="person-outline" color={color} />,
          }}
        />
        <Tabs.Screen name="markets" options={{ href: null }} />
        <Tabs.Screen name="portfolio" options={{ href: null }} />
        <Tabs.Screen
          name="more"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
