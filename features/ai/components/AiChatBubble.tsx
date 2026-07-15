import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/shared/components/ui/Badge';
import { Text } from '@/shared/components/ui/Text';
import { cn } from '@/shared/utils/cn';
import { formatRelativeTime } from '@/shared/utils/date';

import type { AiMessage } from '../types/ai.types';

interface AiChatBubbleProps {
  message: AiMessage;
}

export function AiChatBubble({ message }: AiChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={cn('mb-3 flex-row', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <View className="mr-2 mt-1 h-7 w-7 items-center justify-center rounded-full bg-accent-muted">
          <Ionicons name="sparkles" size={14} color="#00D4AA" />
        </View>
      ) : null}

      <View
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'rounded-br-sm bg-accent'
            : 'rounded-bl-sm border border-border bg-surface-glass',
        )}
      >
        <Text
          variant="body-sm"
          className={cn('leading-relaxed', isUser ? 'text-text-inverse' : 'text-text-primary')}
        >
          {message.content}
        </Text>

        {!isUser && message.metadata?.source ? (
          <View className="mt-2 flex-row items-center gap-2">
            <Badge
              label={message.metadata.source === 'cloud' ? 'Cloud AI' : 'Engine'}
              variant="default"
              size="sm"
            />
            {message.metadata.confidence ? (
              <Text variant="caption">{message.metadata.confidence}% confidence</Text>
            ) : null}
          </View>
        ) : null}

        <Text
          variant="caption"
          className={cn('mt-1.5', isUser ? 'text-text-inverse/70' : 'text-text-tertiary')}
        >
          {formatRelativeTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}
