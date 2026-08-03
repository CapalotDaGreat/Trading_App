import { Pressable, View } from 'react-native';

import { useSettings } from '@/features/settings/hooks/useSettings';
import { Text } from '@/shared/components/ui/Text';
import type { ThemeMode } from '@/shared/stores/theme.store';
import { cn } from '@/shared/utils/cn';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Light', icon: '☀️' },
  { mode: 'dark', label: 'Dark', icon: '🌙' },
  { mode: 'system', label: 'Auto', icon: '⚙️' },
];

export function ThemeToggle() {
  const { settings, updateSettings, isUpdating } = useSettings();

  return (
    <View
      className="flex-row gap-1 rounded-2xl bg-surface p-1"
      accessibilityRole="radiogroup"
      accessibilityLabel="Theme mode"
    >
      {THEME_OPTIONS.map((option) => {
        const selected = settings.theme === option.mode;

        return (
          <Pressable
            key={option.mode}
            disabled={isUpdating}
            onPress={() => void updateSettings({ theme: option.mode })}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: isUpdating }}
            accessibilityLabel={`${option.label} theme`}
            className={cn(
              'min-h-11 flex-1 items-center rounded-xl py-2.5',
              selected && 'bg-background-elevated',
            )}
          >
            <Text className="text-base" accessible={false}>
              {option.icon}
            </Text>
            <Text
              variant="caption"
              className={cn('mt-1 font-medium', selected ? 'text-accent' : 'text-text-secondary')}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
