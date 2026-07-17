import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface HubItem {
  href: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface HubSection {
  title: string;
  hint: string;
  items: HubItem[];
}

const HUB_SECTIONS: HubSection[] = [
  {
    title: 'Decide',
    hint: 'What to look at before you spend time',
    items: [
      {
        href: '/decision/radar',
        title: 'Setups',
        description: 'Ranked ideas worth researching',
        icon: 'radio-outline',
      },
      {
        href: '/decision/regime',
        title: 'Market condition',
        description: 'Risk-on, chop, or high vol right now',
        icon: 'pulse-outline',
      },
      {
        href: '/decision/risk',
        title: 'Portfolio risk',
        description: 'Concentration and how names move together',
        icon: 'shield-checkmark-outline',
      },
    ],
  },
  {
    title: 'Review yourself',
    hint: 'Learn from your own trades',
    items: [
      {
        href: '/journal',
        title: 'Trade journal',
        description: 'Log trades and results',
        icon: 'book-outline',
      },
      {
        href: '/decision/coach',
        title: 'Journal coach',
        description: 'Process tips from your history',
        icon: 'fitness-outline',
      },
      {
        href: '/decision/memory',
        title: 'Your trading profile',
        description: 'Style, favorites, and weak spots',
        icon: 'person-outline',
      },
    ],
  },
  {
    title: 'Practice & learn',
    hint: 'Build skill without forcing live risk',
    items: [
      {
        href: '/decision/lab',
        title: 'Decision Lab',
        description: 'Thesis-first paper trading for process practice',
        icon: 'flask-outline',
      },
      {
        href: '/decision/decision-replay',
        title: 'Decision Replay AI',
        description: 'Review your process like game film',
        icon: 'film-outline',
      },
      {
        href: '/decision/replay',
        title: 'Chart replay',
        description: 'Step through bars without foresight',
        icon: 'play-forward-outline',
      },
      {
        href: '/analysis/backtest',
        title: 'Backtest',
        description: 'Test a simple strategy on history',
        icon: 'analytics-outline',
      },
      {
        href: '/academy',
        title: 'Academy',
        description: 'Lessons and a trading checklist',
        icon: 'school-outline',
      },
    ],
  },
  {
    title: 'Stay on top',
    hint: 'Alerts, calendar, and settings',
    items: [
      {
        href: '/alerts',
        title: 'Price alerts',
        description: 'Notify when price hits your level',
        icon: 'notifications-outline',
      },
      {
        href: '/calendar',
        title: 'Economic calendar',
        description: 'Events that can move markets',
        icon: 'calendar-outline',
      },
      {
        href: '/settings',
        title: 'Settings',
        description: 'Theme, account, and preferences',
        icon: 'settings-outline',
      },
    ],
  },
];

export default function MoreScreen() {
  const { colors } = useTheme();

  return (
    <Screen scrollable contentClassName="pb-10">
      <Header title="More" subtitle="Tools grouped by what you need" transparent />

      <View className="mt-2 gap-7">
        {HUB_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text variant="label" className="mb-1 px-1 text-text-tertiary">
              {section.title.toUpperCase()}
            </Text>
            <Text variant="caption" className="mb-2.5 px-1 text-text-secondary">
              {section.hint}
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
                      className="flex-row items-center px-4 py-3.5 active:opacity-70"
                    >
                      <View className="mr-3.5 h-9 w-9 items-center justify-center rounded-xl bg-surface">
                        <Ionicons name={item.icon} size={18} color={colors.accent.primary} />
                      </View>
                      <View className="min-w-0 flex-1 pr-2">
                        <Text variant="body" className="font-semibold text-text-primary">
                          {item.title}
                        </Text>
                        <Text
                          variant="caption"
                          className="mt-0.5 text-text-secondary"
                          numberOfLines={1}
                        >
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
