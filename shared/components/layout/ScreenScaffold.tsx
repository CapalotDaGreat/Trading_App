import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, View, type ScrollViewProps } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/shared/components/layout/Screen';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { semanticSpacing } from '@/shared/constants/theme';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  showOfflineBanner?: boolean;
  constrainWidth?: boolean;
  scrollViewProps?: ScrollViewProps;
  className?: string;
  contentClassName?: string;
  testID?: string;
  /** When true, shows a Back control that calls router.back(). */
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * Migration target for screens: safe areas, offline placement, readable width,
 * keyboard avoidance and exactly one explicit level-one heading.
 */
export function ScreenScaffold({
  title,
  subtitle,
  eyebrow,
  headerAction,
  children,
  scrollable = true,
  keyboardAvoiding = true,
  showOfflineBanner = true,
  constrainWidth = true,
  scrollViewProps,
  className,
  contentClassName,
  testID,
  showBack = false,
  onBack,
}: ScreenScaffoldProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());

  const content = (
    <Screen
      scrollable={scrollable}
      accessibilityTitle={title}
      showOfflineBanner={showOfflineBanner}
      constrainWidth={constrainWidth}
      scrollViewProps={scrollViewProps}
      className={className}
      contentClassName={contentClassName}
      testID={testID}
    >
      {showBack ? (
        <View className="mb-2">
          <Button size="sm" variant="ghost" onPress={handleBack} accessibilityLabel="Go back">
            Back
          </Button>
        </View>
      ) : null}
      <View
        className="flex-row items-start justify-between"
        style={{ marginBottom: semanticSpacing.section }}
      >
        <View className="min-w-0 flex-1">
          {eyebrow ? (
            <Text variant="label" className="mb-1 text-accent">
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="h1" headingLevel={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body-sm" className="mt-2 max-w-2xl">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerAction ? <View className="ml-4 min-h-11 justify-center">{headerAction}</View> : null}
      </View>
      {children}
    </Screen>
  );

  if (!keyboardAvoiding) return content;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  );
}
