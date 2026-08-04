import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { EducationalInsightFooter } from '@/features/educational/components/EducationalInsightFooter';
import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiMessage } from '../types/ai.types';
import { AiTrustCenter } from './AiTrustCenter';

interface AiChatBubbleProps {
  message: AiMessage;
}

export function AiChatBubble({ message }: AiChatBubbleProps) {
  const isUser = message.role === 'user';
  const { colors } = useTheme();
  const trust = message.metadata?.trust;

  return (
    <View className={cn('mb-4 flex-row', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <View className="mr-2 mt-1 h-8 w-8 items-center justify-center rounded-full bg-accent-muted">
          <Ionicons name="library-outline" size={15} color={colors.accent.primary} />
        </View>
      ) : null}

      <View
        className={cn(
          isUser ? 'max-w-[80%]' : 'max-w-[94%]',
          'rounded-2xl px-4 py-3.5',
          isUser
            ? 'rounded-br-sm bg-accent'
            : 'rounded-bl-sm border border-border bg-background-elevated',
        )}
      >
        <Text
          variant="body-sm"
          className={cn('leading-6', isUser ? 'text-text-on-accent' : 'text-text-primary')}
        >
          {message.content}
        </Text>

        {!isUser && message.metadata?.source ? (
          <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
            <Badge label="Research engine" variant="default" size="sm" />
            {message.metadata.confidence != null || trust?.confidence.overall != null ? (
              <Text variant="caption" className="text-text-tertiary">
                {trust?.confidence.overall ?? message.metadata.confidence}% evidence quality
              </Text>
            ) : null}
            <Text variant="caption" className="text-text-tertiary">
              {formatRelativeTime(message.timestamp)}
            </Text>
          </View>
        ) : null}

        {/* Phase B: trust chrome is default-visible on every assistant answer with a payload */}
        {!isUser && trust ? (
          <AiTrustCenter trust={trust} compact showTitle />
        ) : null}

        {!isUser && !trust && message.metadata?.citations?.length ? (
          <View className="mt-2 gap-0.5">
            {message.metadata.citations.slice(0, 3).map((c) => (
              <Text key={`${c.label}-${c.value}`} variant="caption" className="text-text-tertiary">
                {c.label}: {c.value}
              </Text>
            ))}
          </View>
        ) : null}

        {!isUser ? <EducationalInsightFooter compact /> : null}

        {isUser ? (
          <Text variant="caption" className="mt-1.5 text-text-on-accent">
            {formatRelativeTime(message.timestamp)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
