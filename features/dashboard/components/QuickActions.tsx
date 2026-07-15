import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/shared/components/ui/GlassCard';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const ACTIONS: QuickAction[] = [
  { id: 'ai-chat', label: 'AI Chat', icon: 'chatbubbles', route: '/ai', color: '#00D4AA' },
  { id: 'analysis', label: 'Analysis', icon: 'analytics', route: '/analysis/SPY', color: '#60A5FA' },
  { id: 'markets', label: 'Markets', icon: 'trending-up', route: '/markets', color: '#A78BFA' },
  { id: 'alerts', label: 'Alerts', icon: 'notifications', route: '/alerts', color: '#FFB020' },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <View>
      <Text variant="h3" className="mb-3">
        Quick Actions
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => router.push(action.route as never)}
            className="min-w-[46%] flex-1"
          >
            <GlassCard className="flex-1">
              <View className="items-center p-4">
                <View
                  className={cn('mb-2 h-11 w-11 items-center justify-center rounded-xl')}
                  style={{ backgroundColor: `${action.color}20` }}
                >
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text variant="label" className="text-text-primary">
                  {action.label}
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
