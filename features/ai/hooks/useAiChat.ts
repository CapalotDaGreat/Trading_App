import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { aiService } from '../services/ai.service';
import type { AiChatRequest, AiMessage, AiRequestContext } from '../types/ai.types';
import { AI_USAGE_QUERY_KEY } from './useAiAnalysis';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const WELCOME_MESSAGE: AiMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your TradeVision AI assistant. Ask me about markets, technical analysis, risk management, or trading psychology. I provide educational research context and explainability — not financial advice, price predictions, or buy/sell signals.",
  timestamp: Date.now(),
};

export function useAiChat(initialContext?: AiRequestContext) {
  const tier = useSubscriptionStore((s) => s.tier);
  const queryClient = useQueryClient();
  const sessionIdRef = useRef(generateId());
  const contextRef = useRef(initialContext);

  const [messages, setMessages] = useState<AiMessage[]>([WELCOME_MESSAGE]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const userMsg: AiMessage = {
        id: generateId(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
        metadata: { symbol: contextRef.current?.symbol },
      };

      setMessages((prev) => [...prev, userMsg]);

      const request: AiChatRequest = {
        message: userMessage,
        sessionId: sessionIdRef.current,
        context: contextRef.current,
        history: messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content })),
      };

      return aiService.chat(request, tier);
    },
    onSuccess: (response) => {
      sessionIdRef.current = response.sessionId;
      setMessages((prev) => [...prev, response.message]);
      void queryClient.invalidateQueries({ queryKey: AI_USAGE_QUERY_KEY });
    },
  });

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || chatMutation.isPending) return;
      await chatMutation.mutateAsync(trimmed);
    },
    [chatMutation],
  );

  const setContext = useCallback((context: AiRequestContext) => {
    contextRef.current = context;
  }, []);

  const clearChat = useCallback(() => {
    sessionIdRef.current = generateId();
    setMessages([WELCOME_MESSAGE]);
    chatMutation.reset();
  }, [chatMutation]);

  return {
    messages,
    sendMessage,
    setContext,
    clearChat,
    isSending: chatMutation.isPending,
    error: chatMutation.error,
    sessionId: sessionIdRef.current,
  };
}
