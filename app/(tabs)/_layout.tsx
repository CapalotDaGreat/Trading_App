import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { IA_GLOSSARY } from '@/features/navigation/config/navigation-ia.config';
import { useCoachProfile } from '@/features/onboarding/hooks/useCoachProfile';
import { ErrorBoundary } from '@/shared/components/feedback/ErrorBoundary';
import { useTheme } from '@/shared/hooks/useTheme';

type TabIconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color }: { name: TabIconName; color: string }) {
  return <Ionicons name={name} size={20} color={color} />;
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { profile } = useCoachProfile();
  const hideEvents =
    !profile.experience || profile.experience === 'completely_new' || profile.experience === 'beginner';

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
            fontSize: 9,
            fontWeight: '500',
            letterSpacing: 0,
          },
          tabBarItemStyle: {
            minHeight: 44,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: IA_GLOSSARY.home,
            tabBarAccessibilityLabel: 'Home tab',
            tabBarIcon: ({ color }) => <TabIcon name="home-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: IA_GLOSSARY.learn,
            tabBarAccessibilityLabel: 'Learn tab',
            tabBarIcon: ({ color }) => <TabIcon name="school-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            title: IA_GLOSSARY.practice,
            tabBarAccessibilityLabel: 'Practice tab',
            tabBarIcon: ({ color }) => <TabIcon name="fitness-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="simulate"
          options={{
            title: IA_GLOSSARY.simulate,
            tabBarAccessibilityLabel: 'Simulate tab',
            tabBarIcon: ({ color }) => <TabIcon name="briefcase-outline" color={color} />,
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
          name="events"
          options={{
            title: IA_GLOSSARY.events,
            ...(hideEvents ? { href: null } : {}),
            tabBarAccessibilityLabel: 'Market Events tab',
            tabBarIcon: ({ color }) => <TabIcon name="calendar-outline" color={color} />,
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
        <Tabs.Screen name="ai" options={{ href: null }} />
        <Tabs.Screen name="research" options={{ href: null }} />
        <Tabs.Screen name="portfolio" options={{ href: null }} />
        <Tabs.Screen name="markets" options={{ href: null }} />
        <Tabs.Screen name="more" options={{ href: null }} />
      </Tabs>
    </ErrorBoundary>
  );
}
