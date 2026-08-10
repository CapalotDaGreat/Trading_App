import { type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { Tag, type TagTone, tagToneStyles } from '@/shared/components/ui/Tag';
import { Text } from '@/shared/components/ui/Text';
import { useInteractivePress } from '@/shared/hooks/useInteractivePress';
import { getMinTouchTargetSize } from '@/shared/utils/accessibility';
import { cn } from '@/shared/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected?: boolean;
  tone?: TagTone;
  leading?: ReactNode;
  haptic?: boolean;
  className?: string;
  textClassName?: string;
}

export function Chip({
  label,
  selected = false,
  tone = 'neutral',
  leading,
  haptic = true,
  disabled,
  className,
  textClassName,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...props
}: ChipProps) {
  const styles = tagToneStyles[tone];
  const interaction = useInteractivePress({
    disabled: Boolean(disabled),
    haptic: haptic ? 'selection' : 'none',
    pressedScale: 0.96,
    onPress,
    onPressIn,
    onPressOut,
  });

  // Compatibility path: historical Chip call sites were often static metadata.
  // They now receive correct non-button semantics while migrating to Tag explicitly.
  if (!onPress) {
    return (
      <Tag
        label={label}
        selected={selected}
        tone={tone}
        leading={leading}
        className={className}
        textClassName={cn(disabled && 'text-disabled-foreground', textClassName)}
        accessibilityLabel={accessibilityLabel}
        testID={props.testID}
      />
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled), selected }}
      disabled={disabled}
      onPress={interaction.handlePress}
      onPressIn={interaction.handlePressIn}
      onPressOut={interaction.handlePressOut}
      className={cn(
        'flex-row items-center justify-center rounded-pill border border-transparent px-4',
        styles.container,
        selected && 'border-focus',
        disabled && 'bg-disabled',
        className,
      )}
      style={[
        interaction.animatedStyle,
        { minHeight: getMinTouchTargetSize(), minWidth: getMinTouchTargetSize() },
        style,
      ]}
      {...props}
    >
      {leading}
      <Text
        variant="label"
        className={cn(
          styles.text,
          leading && 'ml-2',
          disabled && 'text-disabled-foreground',
          textClassName,
        )}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
