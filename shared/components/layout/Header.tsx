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
      className={cn('px-6 pb-5', !transparent && 'bg-background', className)}
      style={{ paddingTop: insets.top + 10 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="min-w-[44px] items-start">
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

        <View className="flex-1 items-center px-3">
          <Text variant="h3" numberOfLines={1} className="text-center tracking-tight">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" numberOfLines={2} className="mt-1 text-center leading-5">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="min-w-[44px] items-end">{rightAction}</View>
      </View>
    </View>
  );
}
