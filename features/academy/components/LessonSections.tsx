import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';

import type { CalloutType, LessonSection } from '../types/academy.types';

const calloutStyles: Record<
  CalloutType,
  { icon: keyof typeof Ionicons.glyphMap; wrap: string; title: string }
> = {
  tip: { icon: 'bulb-outline', wrap: 'bg-accent-muted', title: 'Tip' },
  warning: { icon: 'warning-outline', wrap: 'bg-warning-muted', title: 'Watch out' },
  practice: { icon: 'fitness-outline', wrap: 'bg-bullish-muted', title: 'Practice' },
};

interface LessonSectionsProps {
  sections: LessonSection[];
}

export function LessonSections({ sections }: LessonSectionsProps) {
  const { colors } = useTheme();

  return (
    <View className="gap-5">
      {sections.map((section) => {
        const callout = section.callout ? calloutStyles[section.callout.type] : null;
        return (
          <View key={section.heading}>
            <Text variant="h3" className="mb-2">
              {section.heading}
            </Text>
            {section.body.split('\n\n').map((para, paraIndex) => (
              <Text key={`${section.heading}-${paraIndex}`} variant="body" className="mb-2 text-text-secondary">
                {para}
              </Text>
            ))}
            {section.callout && callout ? (
              <View className={cn('mt-2 flex-row gap-3 rounded-2xl p-3', callout.wrap)}>
                <Ionicons name={callout.icon} size={18} color={colors.accent.primary} />
                <View className="flex-1">
                  <Text variant="label" className="mb-0.5 text-text-primary">
                    {callout.title}
                  </Text>
                  <Text variant="body-sm">{section.callout.text}</Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
