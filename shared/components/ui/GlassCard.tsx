import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { shadows } from '@/shared/constants/theme';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface GlassCardProps extends ViewProps {
  children: ReactNode;
  intensity?: number;
  /** Hairline borders are off by default — elevation + fill create hierarchy. */
  bordered?: boolean;
  glow?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  intensity = 22,
  bordered = false,
  glow = false,
  className,
  style,
  ...props
}: GlassCardProps) {
  const { isDark } = useTheme();
  // Phase A: quiet cards — fill first, soft shadow only when glow is explicit.
  const cardShadow = glow ? (isDark ? shadows.glass : shadows.glassLight) : shadows.none;
  const elevatedShadow = glow ? shadows.card : undefined;

  if (Platform.OS === 'web') {
    return (
      <View
        className={cn(
          'overflow-hidden rounded-panel bg-background-elevated',
          bordered && 'border border-border',
          className,
        )}
        style={[cardShadow, elevatedShadow, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      className={cn('overflow-hidden rounded-panel', className)}
      style={[cardShadow, elevatedShadow, style]}
      {...props}
    >
      <BlurView
        intensity={isDark ? intensity : Math.min(intensity + 8, 40)}
        tint={isDark ? 'dark' : 'light'}
        className={cn(
          'bg-background-elevated/95',
          bordered && 'border border-border',
        )}
      >
        {children}
      </BlurView>
    </View>
  );
}
