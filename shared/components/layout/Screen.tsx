import { type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsiveLayout } from '@/shared/hooks/useResponsiveLayout';
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
  className,
  contentClassName,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();

  const paddingStyle = {
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
  };

  const widthConstraint =
    constrainWidth && layout.isTablet
      ? {
          width: '100%' as const,
          maxWidth: layout.contentMaxWidth,
          alignSelf: 'center' as const,
        }
      : undefined;

  if (scrollable) {
    return (
      <View className={cn('flex-1 bg-background-secondary', className)} style={style} {...props}>
        <ScrollView
          className={cn('flex-1', contentClassName)}
          contentContainerStyle={[
            paddingStyle,
            padded && { paddingHorizontal: layout.gutter },
            widthConstraint,
            scrollViewProps?.contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      className={cn('flex-1 bg-background-secondary', padded && 'px-5', className)}
      style={[paddingStyle, widthConstraint, style]}
      {...props}
    >
      {children}
    </View>
  );
}
