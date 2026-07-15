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

import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';
import { getTierLimits } from '@/shared/constants/subscription';

import { AiChatBubble } from '../components/AiChatBubble';
import { AiDisclaimer } from '../components/AiDisclaimer';
import { DEFAULT_CHAT_PROMPTS, PromptSuggestions } from '../components/PromptSuggestions';
import { useAiChat } from '../hooks/useAiChat';
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import { aiService } from '../services/ai.service';
import type { AiMessage } from '../types/ai.types';

interface AiChatScreenProps {
  symbol?: string;
}

export function AiChatScreen({ symbol }: AiChatScreenProps) {
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<AiMessage>>(null);
  const tier = useSubscriptionStore((s) => s.tier);
  const { usage } = useAiAnalysis();
  const { messages, sendMessage, clearChat, isSending, error } = useAiChat(
    symbol ? { symbol } : undefined,
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage(text);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, sendMessage]);

  const errorMessage =
    error && aiService.isServiceError(error) ? error.message : error?.message;

  const limit = usage?.limit ?? getTierLimits(tier).aiAnalysisPerDay;
  const used = usage?.usedToday ?? 0;

  return (
    <Screen safeBottom={false} padded={false} className="flex-1">
      <Header
        title="AI Assistant"
        subtitle={symbol ? `Analyzing ${symbol}` : 'Market intelligence'}
        rightAction={
          <Pressable onPress={clearChat} className="p-2">
            <Ionicons name="refresh" size={20} color="#94A3B8" />
          </Pressable>
        }
      />

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
          ListHeaderComponent={<AiDisclaimer className="mb-4" />}
        />

        {errorMessage ? (
          <View className="mx-4 mb-2 rounded-lg bg-bearish-muted px-3 py-2">
            <Text variant="caption" className="text-bearish">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <View className="border-t border-border bg-background-secondary/80 px-4 pb-4 pt-2">
          <Text variant="caption" className="mb-2 text-center text-text-tertiary">
            {limit === -1 ? `${used} analyses today` : `${used}/${limit} analyses today`}
          </Text>

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
                value={input}
                onChangeText={setInput}
                placeholder="Ask about markets, indicators, risk..."
                multiline
                maxLength={1000}
                editable={!isSending}
              />
            </View>
            <Pressable
              onPress={() => void handleSend()}
              disabled={isSending || !input.trim()}
              className="mb-1 h-11 w-11 items-center justify-center rounded-xl bg-accent disabled:opacity-50"
            >
              {isSending ? (
                <ActivityIndicator color="#0A0E17" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#0A0E17" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
