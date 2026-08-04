import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useFeatureFlag } from '@/features/ops-config/hooks/useOpsConfig';
import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { IconButton } from '@/shared/components/ui/IconButton';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { AiChatBubble } from '../components/AiChatBubble';
import { AiDisclaimer } from '../components/AiDisclaimer';
import { AiMemoryInsightCard } from '../components/AiMemoryInsightCard';
import { AiUsageBanner } from '../components/AiUsageBanner';
import { DEFAULT_CHAT_PROMPTS, PromptSuggestions } from '../components/PromptSuggestions';
import { useAiChat } from '../hooks/useAiChat';
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import { useAiLearningMemory } from '../hooks/useAiLearningMemory';
import { aiService } from '../services/ai.service';
import type { AiMessage } from '../types/ai.types';

interface AiChatScreenProps {
  symbol?: string;
}

export function AiChatScreen({ symbol }: AiChatScreenProps) {
  const aiChatEnabled = useFeatureFlag('aiChatEnabled');
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<AiMessage>>(null);
  const { colors } = useTheme();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const { usage } = useAiAnalysis();
  const memoryQuery = useAiLearningMemory();
  const { messages, sendMessage, clearChat, isSending, error } = useAiChat(
    symbol ? { symbol } : undefined,
  );

  if (!aiChatEnabled) {
    return (
      <EmptyState
        title="Ask AI temporarily unavailable"
        description="This surface is disabled by a remote kill switch or feature flag. Today, research, and journal still work."
        iconName="cloud-offline-outline"
        testID="ai-chat-flag-disabled"
      />
    );
  }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, sendMessage]);

  const errorMessage = error && aiService.isServiceError(error) ? error.message : error?.message;

  return (
    <Screen safeTop={false} safeBottom={false} padded={false} className="flex-1">
      <Header
        title="Ask"
        subtitle={
          symbol
            ? `Educational research context for ${symbol}`
            : 'Research opportunities & explainability — not trade signals'
        }
        rightAction={
          <IconButton
            onPress={clearChat}
            accessibilityLabel="Clear conversation"
            icon={<Ionicons name="refresh" size={20} color={colors.text.secondary} />}
            variant="ghost"
            size="sm"
          />
        }
      />
      <View className="px-4 pb-2">
        <EducationalModeBadge />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AiChatBubble message={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <View className="mb-4 gap-3">
              <AiDisclaimer />
              {memoryQuery.data ? <AiMemoryInsightCard memory={memoryQuery.data} /> : null}
            </View>
          }
        />

        {errorMessage ? (
          <View
            className="mx-4 mb-2 rounded-lg bg-bearish-muted px-3 py-2"
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text variant="caption" className="text-bearish">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View className="border-t border-border bg-background-secondary/80 px-4 pb-4 pt-2">
          <AiUsageBanner usage={usage} isPremium={isPremium} className="mb-2" />

          <PromptSuggestions
            suggestions={DEFAULT_CHAT_PROMPTS}
            onSelect={(prompt) => {
              void sendMessage(prompt);
            }}
            disabled={isSending}
            className="mb-2"
          />

          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <Input
                accessibilityLabel="Ask TradeVision"
                value={input}
                onChangeText={setInput}
                placeholder="Ask about evidence, risk, or your process"
                multiline
                maxLength={1000}
                editable={!isSending}
              />
            </View>
            <Pressable
              onPress={() => void handleSend()}
              disabled={isSending || !input.trim()}
              accessibilityRole="button"
              accessibilityLabel={isSending ? 'Sending question' : 'Send question'}
              accessibilityState={{ disabled: isSending || !input.trim(), busy: isSending }}
              className="mb-1 h-11 w-11 items-center justify-center rounded-xl bg-accent disabled:opacity-50"
            >
              {isSending ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <Ionicons name="send" size={18} color={colors.text.inverse} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
