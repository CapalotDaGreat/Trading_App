import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { EducationalModeBadge } from '@/features/educational/components/EducationalModeBadge';
import { useFeatureFlag } from '@/features/ops-config/hooks/useOpsConfig';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { Screen } from '@/shared/components/layout/Screen';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Header } from '@/shared/components/layout/Header';
import { IconButton } from '@/shared/components/ui/IconButton';
import { Input } from '@/shared/components/ui/Input';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Text } from '@/shared/components/ui/Text';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { AiChatBubble } from '../components/AiChatBubble';
import { AiUsageBanner } from '../components/AiUsageBanner';
import { DEFAULT_CHAT_PROMPTS, PromptSuggestions } from '../components/PromptSuggestions';
import { useAiAnalysis } from '../hooks/useAiAnalysis';
import { useAiChat } from '../hooks/useAiChat';
import { useAiLearningMemory } from '../hooks/useAiLearningMemory';
import { aiService } from '../services/ai.service';
import type { AiMessage } from '../types/ai.types';
import { AiAnalysisScreen } from './AiAnalysisScreen';

type AskMode = 'chat' | 'tools';

interface AiChatScreenProps {
  symbol?: string;
}

export function AiChatScreen({ symbol }: AiChatScreenProps) {
  const params = useLocalSearchParams<{ mode?: string; source?: string }>();
  const aiChatEnabled = useFeatureFlag('aiChatEnabled');
  const [mode, setMode] = useState<AskMode>(params.mode === 'tools' ? 'tools' : 'chat');
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<AiMessage>>(null);
  const { colors } = useTheme();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const { usage } = useAiAnalysis();
  const memoryQuery = useAiLearningMemory();
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

  const errorMessage = error && aiService.isServiceError(error) ? error.message : error?.message;
  const contextUsed = useMemo(() => {
    const parts = [
      symbol ? `Symbol ${symbol.toUpperCase()}` : null,
      params.source ? `Opened from ${params.source}` : null,
      memoryQuery.data ? 'Learning memory' : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Session prompts and available local market context';
  }, [memoryQuery.data, params.source, symbol]);

  if (!aiChatEnabled) {
    return (
      <StatusState
        status="empty"
        title="Ask AI temporarily unavailable"
        description="This surface is disabled by a remote kill switch or feature flag. Today, research, and journal still work."
        iconName="cloud-offline-outline"
        testID="ai-chat-flag-disabled"
      />
    );
  }

  return (
    <Screen safeTop={false} safeBottom={false} padded={false} className="flex-1">
      <Header
        title="Ask"
        subtitle={
          symbol
            ? `Evidence coach for ${symbol} — not signals.`
            : 'Evidence coach for research decisions — not signals.'
        }
        rightAction={
          mode === 'chat' ? (
            <IconButton
              onPress={clearChat}
              accessibilityLabel="Clear conversation"
              icon={<Ionicons name="refresh" size={20} color={colors.text.secondary} />}
              variant="ghost"
              size="sm"
            />
          ) : null
        }
      />
      <View className="gap-3 px-4 pb-2">
        <EducationalModeBadge />
        <SegmentedControl
          options={[
            { value: 'chat', label: 'Chat' },
            { value: 'tools', label: 'Tools' },
          ]}
          value={mode}
          onChange={setMode}
          testID="ask-mode-control"
        />
      </View>

      {mode === 'tools' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <AiAnalysisScreen symbol={symbol ?? 'SPY'} embedded />
        </ScrollView>
      ) : (
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
            ListEmptyComponent={
              <View className="gap-4">
                <Surface padding="sm" tone="subtle" testID="ask-trust-sentence">
                  <Text variant="body-sm" className="text-text-secondary">
                    Answers stay local and evidence-first. Every reply should separate bottom line,
                    why, evidence, what could change, unknowns, and the next research step.
                  </Text>
                </Surface>
                <PromptSuggestions
                  suggestions={DEFAULT_CHAT_PROMPTS}
                  onSelect={(prompt) => {
                    void sendMessage(prompt);
                  }}
                  disabled={isSending}
                />
              </View>
            }
            ListHeaderComponent={
              messages.length ? (
                <CollapsibleSection
                  title="Context used"
                  description={contextUsed}
                  className="mb-4"
                  testID="ask-context-used"
                >
                  {memoryQuery.data ? (
                    <Text variant="body-sm" className="text-text-secondary">
                      {memoryQuery.data.psychologyReminder || memoryQuery.data.learningStyleHint}
                    </Text>
                  ) : (
                    <Text variant="body-sm" className="text-text-secondary">
                      No durable learning memory attached yet. Recent decisions and journal notes
                      improve context over time.
                    </Text>
                  )}
                </CollapsibleSection>
              ) : null
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
            {messages.length > 0 ? (
              <PromptSuggestions
                suggestions={DEFAULT_CHAT_PROMPTS}
                onSelect={(prompt) => {
                  void sendMessage(prompt);
                }}
                disabled={isSending}
                className="mb-2"
              />
            ) : null}
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
      )}
    </Screen>
  );
}
