import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';

interface HubItem {
  href: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const HUB_ITEMS: HubItem[] = [
  {
    href: '/decision/radar',
    title: 'Setup Radar',
    description: 'Ranked setups that deserve research time',
    icon: 'radio-outline',
  },
  {
    href: '/decision/regime',
    title: 'Market Regime',
    description: 'Live risk-on / risk-off classification',
    icon: 'pulse-outline',
  },
  {
    href: '/decision/risk',
    title: 'Risk Center',
    description: 'Concentration, beta, sector exposure',
    icon: 'shield-checkmark-outline',
  },
  {
    href: '/decision/coach',
    title: 'Journal Coach',
    description: 'Process score, edges, and mistakes',
    icon: 'fitness-outline',
  },
  {
    href: '/decision/memory',
    title: 'AI Memory',
    description: 'Your style, favorites, and weak setups',
    icon: 'hardware-chip-outline',
  },
  {
    href: '/decision/replay',
    title: 'Chart Replay',
    description: 'Bar-by-bar historical practice',
    icon: 'play-forward-outline',
  },
  {
    href: '/journal',
    title: 'Trade Journal',
    description: 'Log trades, track performance, export data',
    icon: 'book-outline',
  },
  {
    href: '/alerts',
    title: 'Price Alerts',
    description: 'Set alerts for price targets',
    icon: 'notifications-outline',
  },
  {
    href: '/academy',
    title: 'Trading Academy',
    description: 'Lessons, checklists, and education',
    icon: 'school-outline',
  },
  {
    href: '/calendar',
    title: 'Economic Calendar',
    description: 'Upcoming market-moving events',
    icon: 'calendar-outline',
  },
  {
    href: '/analysis/backtest',
    title: 'Strategy Backtest',
    description: 'Test strategies on historical data',
    icon: 'analytics-outline',
  },
  {
    href: '/settings',
    title: 'Settings',
    description: 'App preferences and account',
    icon: 'settings-outline',
  },
];

export default function MoreScreen() {
  const { colors } = useTheme();

  return (
    <Screen scrollable contentClassName="pb-8">
      <Header title="More" subtitle="Decision tools & resources" transparent />

      <View className="mt-4 gap-3">
        {HUB_ITEMS.map((item) => (
          <Link key={item.href} href={item.href as never} asChild>
            <Pressable accessibilityRole="link">
              <GlassCard className="flex-row items-center p-4">
                <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-surface">
                  <Ionicons name={item.icon} size={22} color={colors.accent.primary} />
                </View>
                <View className="flex-1">
                  <Text variant="h3">{item.title}</Text>
                  <Text variant="body-sm" className="mt-0.5">
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </GlassCard>
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}
