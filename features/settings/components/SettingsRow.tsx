import { Ionicons } from '@expo/vector-icons';
import { Pressable, Switch, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface SettingsRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SettingsRow({
  icon,
  label,
  description,
  value,
  showChevron = false,
  destructive = false,
  toggle = false,
  toggleValue = false,
  onToggle,
  onPress,
  disabled = false,
  className,
}: SettingsRowProps) {
  const { colors, isDark } = useTheme();

  const content = (
    <View
      className={cn(
        'flex-row items-center border-b border-border px-4 py-3.5',
        disabled && 'opacity-50',
        className,
      )}
    >
      {icon ? (
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-surface">
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? colors.bearish.primary : colors.accent.primary}
          />
        </View>
      ) : null}

      <View className="flex-1">
        <Text variant="body" className={cn(destructive && 'text-bearish')}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </View>

      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{
            false: isDark ? '#334155' : '#CBD5E1',
            true: colors.accent.primary,
          }}
          thumbColor={isDark ? '#F8FAFC' : '#FFFFFF'}
        />
      ) : value ? (
        <Text variant="body-sm" className="mr-2">
          {value}
        </Text>
      ) : null}

      {showChevron && !toggle ? (
        <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
      ) : null}
    </View>
  );

  if (onPress && !toggle) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}>
        {content}
      </Pressable>
    );
  }

  return content;
}
