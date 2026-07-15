import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

export interface TabBarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
}

interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  className?: string;
}

export function TabBar({ items, activeKey, onTabPress, className }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        'flex-row border-t border-border bg-background-secondary/95 px-2 pt-2',
        className,
      )}
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabPress(item.key)}
            className="relative flex-1 items-center py-1"
          >
            <View className={cn('mb-1', isActive && 'opacity-100', !isActive && 'opacity-50')}>
              {isActive && item.activeIcon ? item.activeIcon : item.icon}
            </View>
            <Text
              variant="caption"
              className={cn(
                'font-medium',
                isActive ? 'text-accent' : 'text-text-tertiary',
              )}
            >
              {item.label}
            </Text>
            {item.badge && item.badge > 0 ? (
              <View className="absolute right-3 top-0 min-w-[16px] items-center rounded-full bg-bearish px-1">
                <Text variant="caption" className="text-[10px] font-bold text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
