import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/shared/components/ui/IconButton';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
  className?: string;
}

export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  onBack,
  transparent = false,
  className,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        'border-b border-border px-4 pb-3',
        !transparent && 'bg-background',
        className,
      )}
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="min-w-[40px] items-start">
          {leftAction ??
            (onBack ? (
              <IconButton
                icon={<Text className="text-lg text-text-primary">←</Text>}
                variant="ghost"
                onPress={onBack}
                accessibilityLabel="Go back"
              />
            ) : null)}
        </View>

        <View className="flex-1 items-center px-2">
          <Text variant="h3" numberOfLines={1} className="text-center">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" numberOfLines={1} className="mt-0.5 text-center">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="min-w-[40px] items-end">{rightAction}</View>
      </View>
    </View>
  );
}
