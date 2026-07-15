import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { Platform, View, type ViewProps } from 'react-native';

import { shadows } from '@/shared/constants/theme';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

interface GlassCardProps extends ViewProps {
  children: ReactNode;
  intensity?: number;
  bordered?: boolean;
  glow?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  intensity = 28,
  bordered = true,
  glow = false,
  className,
  style,
  ...props
}: GlassCardProps) {
  const { isDark } = useTheme();
  const cardShadow = isDark ? shadows.glass : shadows.glassLight;
  const elevatedShadow = glow ? shadows.card : undefined;

  if (Platform.OS === 'web') {
    return (
      <View
        className={cn(
          'overflow-hidden rounded-2xl bg-surface-glass',
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
      className={cn('overflow-hidden rounded-2xl', className)}
      style={[cardShadow, elevatedShadow, style]}
      {...props}
    >
      <BlurView
        intensity={isDark ? intensity : Math.min(intensity + 12, 48)}
        tint={isDark ? 'dark' : 'light'}
        className={cn(
          'bg-surface-glass',
          bordered && 'border border-border',
        )}
      >
        {children}
      </BlurView>
    </View>
  );
}
