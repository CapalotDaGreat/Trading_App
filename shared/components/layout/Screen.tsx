import { type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/utils/cn';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  safeTop?: boolean;
  safeBottom?: boolean;
  padded?: boolean;
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
  className,
  contentClassName,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
  };

  if (scrollable) {
    return (
      <View className={cn('flex-1 bg-background', className)} style={style} {...props}>
        <ScrollView
          className={cn('flex-1', contentClassName)}
          contentContainerStyle={[
            paddingStyle,
            padded && { paddingHorizontal: 16 },
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
      className={cn('flex-1 bg-background', padded && 'px-4', className)}
      style={[paddingStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}
