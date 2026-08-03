import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { EducationalInsightFooter } from '@/features/educational/components/EducationalInsightFooter';
import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiMessage } from '../types/ai.types';
import { AiTrustPanel } from './AiTrustPanel';

interface AiChatBubbleProps {
  message: AiMessage;
}

export function AiChatBubble({ message }: AiChatBubbleProps) {
  const isUser = message.role === 'user';
  const { colors } = useTheme();
  const [showTrust, setShowTrust] = useState(false);
  const trust = message.metadata?.trust;

  return (
    <View className={cn('mb-3 flex-row', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <View className="mr-2 mt-1 h-7 w-7 items-center justify-center rounded-full bg-accent-muted">
          <Ionicons name="sparkles" size={14} color={colors.accent.primary} />
        </View>
      ) : null}

      <View
        className={cn(
          isUser ? 'max-w-[80%]' : 'max-w-[92%]',
          'rounded-2xl px-4 py-3',
          isUser
            ? 'rounded-br-sm bg-accent'
            : 'rounded-bl-sm border border-border bg-surface-glass',
        )}
      >
        <Text
          variant="body-sm"
          className={cn('leading-relaxed', isUser ? 'text-text-on-accent' : 'text-text-primary')}
        >
          {message.content}
        </Text>

        {!isUser && message.metadata?.source ? (
          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            <Badge label="Local rules engine" variant="default" size="sm" />
            {message.metadata.confidence ? (
              <Text variant="caption">
                {message.metadata.confidence}% evidence quality
              </Text>
            ) : null}
            {trust ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showTrust ? 'Hide trust details' : 'Show trust details'}
                onPress={() => setShowTrust((v) => !v)}
              >
                <Text variant="caption" className="text-accent">
                  {showTrust ? 'Hide why' : 'Why / evidence'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!isUser && showTrust && trust ? <AiTrustPanel trust={trust} compact /> : null}

        {!isUser && !showTrust && message.metadata?.citations?.length ? (
          <View className="mt-2 gap-0.5">
            {message.metadata.citations.slice(0, 3).map((c) => (
              <Text key={`${c.label}-${c.value}`} variant="caption" className="text-text-tertiary">
                {c.label}: {c.value}
              </Text>
            ))}
          </View>
        ) : null}

        {!isUser ? <EducationalInsightFooter compact /> : null}

        <Text
          variant="caption"
          className={cn('mt-1.5', isUser ? 'text-text-on-accent' : 'text-text-tertiary')}
        >
          {formatRelativeTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}
