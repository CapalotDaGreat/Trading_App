import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import { heatmapLevelColorToken } from '../services/heatmap.service';
import type { HeatmapCell, HeatmapProcessLevel } from '../types/heatmap.types';

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function levelFill(colors: ThemeColors, level: HeatmapProcessLevel): string {
  const tone = heatmapLevelColorToken(level).tone;
  if (tone === 'muted') return colors.surface.default;
  if (tone === 'info') return colors.info.primary;
  if (tone === 'accent') return colors.accent.primary;
  return colors.bullish.primary;
}

function levelBorder(colors: ThemeColors, level: HeatmapProcessLevel): string {
  const tone = heatmapLevelColorToken(level).tone;
  if (tone === 'muted') return colors.border.strong;
  if (tone === 'info') return colors.info.primary;
  if (tone === 'accent') return colors.accent.primary;
  return colors.bullish.primary;
}

interface HeatmapGridProps {
  cells: HeatmapCell[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function HeatmapGrid({ cells, selectedKey, onSelect }: HeatmapGridProps) {
  const { colors } = useTheme();
  const visible = cells.slice(-84);

  return (
    <View className="flex-row flex-wrap gap-1.5" testID="decision-heatmap-grid">
      {visible.map((cell) => {
        const selected = selectedKey === cell.key;
        return (
          <Pressable
            key={cell.key}
            accessibilityRole="button"
            accessibilityLabel={`${cell.label}. ${heatmapLevelColorToken(cell.level).label}. Process intensity ${cell.processIntensity}`}
            onPress={() => onSelect(cell.key)}
            className={cn('h-7 w-7 items-center justify-center rounded-md', selected && 'border-2')}
            style={{
              backgroundColor: levelFill(colors, cell.level),
              borderColor: selected ? levelBorder(colors, cell.level) : 'transparent',
              opacity: cell.level === 'none' ? 0.45 : 1,
            }}
          />
        );
      })}
    </View>
  );
}

export function HeatmapLegend() {
  const { colors } = useTheme();
  const levels: HeatmapProcessLevel[] = ['none', 'learning', 'good', 'excellent'];

  return (
    <View className="mt-3 flex-row flex-wrap items-center gap-3" testID="decision-heatmap-legend">
      {levels.map((level) => (
        <View key={level} className="flex-row items-center gap-1.5">
          <View
            className="h-3.5 w-3.5 rounded-sm"
            style={{
              backgroundColor: levelFill(colors, level),
              opacity: level === 'none' ? 0.45 : 1,
            }}
          />
          <Text variant="caption" className="text-text-secondary">
            {heatmapLevelColorToken(level).label}
          </Text>
        </View>
      ))}
    </View>
  );
}
