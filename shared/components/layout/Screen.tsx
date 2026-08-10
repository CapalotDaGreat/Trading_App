import { type ReactNode, useEffect } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/shared/components/feedback/OfflineBanner';
import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
import { announceForAccessibility } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  safeTop?: boolean;
  safeBottom?: boolean;
  padded?: boolean;
  /** Constrain readable content width on tablet / landscape. Defaults to true. */
  constrainWidth?: boolean;
  /** Announced once when the screen mounts (VoiceOver / TalkBack). */
  accessibilityTitle?: string;
  /** Show global offline chip above content. */
  showOfflineBanner?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Screen({
  children,
  scrollable = false,
  scrollViewProps,
  safeTop = true,
  safeBottom = true,
  padded = true,
  constrainWidth = true,
  accessibilityTitle,
  showOfflineBanner = true,
  className,
  contentClassName,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();

  useEffect(() => {
    if (accessibilityTitle) {
      announceForAccessibility(accessibilityTitle);
    }
  }, [accessibilityTitle]);

  const topPad = safeTop ? insets.top : 0;
  const bottomPad = safeBottom ? insets.bottom : 0;

  const widthConstraint =
    constrainWidth && layout.isTablet
      ? {
          width: '100%' as const,
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center' as const,
        }
      : undefined;

  const banner = showOfflineBanner ? (
    <View style={{ paddingTop: topPad }}>
      <OfflineBanner />
    </View>
  ) : null;

  if (scrollable) {
    return (
      <View
        accessibilityLabel={accessibilityTitle}
        className={cn('flex-1 bg-background', className)}
        style={style}
        {...props}
      >
        {banner}
        <ScrollView
          {...scrollViewProps}
          className={cn('flex-1', contentClassName)}
          contentContainerStyle={[
            {
              paddingTop: showOfflineBanner ? 0 : topPad,
              paddingBottom: bottomPad,
            },
            padded && { paddingHorizontal: layout.gutter },
            widthConstraint,
            scrollViewProps?.contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityTitle}
      className={cn('flex-1 bg-background', className)}
      style={[
        {
          paddingTop: showOfflineBanner ? 0 : topPad,
          paddingBottom: bottomPad,
          paddingHorizontal: padded ? layout.gutter : 0,
        },
        widthConstraint,
        style,
      ]}
      {...props}
    >
      {banner}
      {children}
    </View>
  );
}
