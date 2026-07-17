import AsyncStorage from '@react-native-async-storage/async-storage';

import { secureStorageService, SecureStorageKeys } from '@/shared/services/storage/secure-storage.service';
import {
  aiRateLimiter,
  waitForRateLimit,
} from '@/shared/services/rate-limit/rate-limiter';
import {
  getTierLimits,
  hasReachedLimit,
  isNearAiDailyLimit,
  type SubscriptionTier,
} from '@/shared/constants/subscription';

import type {
  AiAnalysisResult,
  AiAnalysisType,
  AiChatRequest,
  AiChatResponse,
  AiMessage,
  AiRequestContext,
  AiServiceError,
  AiUsageStats,
} from '../types/ai.types';
import { enrichRequestContext } from './ai-context.service';
import { generateEngineAnalysis, generateEngineChatResponse } from './ai-engine.service';
import { fetchCloudAiBrief } from './cloud-ai.service';

const AI_API_URL =
  process.env.EXPO_PUBLIC_AI_API_URL ??
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_URL ??
  'https://us-central1-tradevision-ai.cloudfunctions.net/ai';

const AI_USAGE_KEY = 'tradevision-ai-usage';

interface StoredUsage {
  date: string;
  count: number;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function nextResetTimestamp(): number {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.getTime();
}

async function getStoredUsage(): Promise<StoredUsage> {
  try {
    const raw = await AsyncStorage.getItem(AI_USAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as StoredUsage;
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

async function incrementUsage(): Promise<number> {
  const usage = await getStoredUsage();
  const updated = { date: todayKey(), count: usage.count + 1 };
  await AsyncStorage.setItem(AI_USAGE_KEY, JSON.stringify(updated));
  return updated.count;
}

export async function getAiUsage(tier: SubscriptionTier): Promise<AiUsageStats> {
  const usage = await getStoredUsage();
  const limit = getTierLimits(tier).aiAnalysisPerDay;
  const usedToday = usage.count;
  return {
    usedToday,
    limit,
    resetsAt: nextResetTimestamp(),
    isNearLimit: isNearAiDailyLimit(usedToday, limit),
    isAtLimit: hasReachedLimit(usedToday, limit),
  };
}

function createAiError(
  code: AiServiceError['code'],
  message: string,
  retryAfterMs?: number,
): AiServiceError {
  return { code, message, retryAfterMs };
}

export function checkAiAccess(
  tier: SubscriptionTier,
  usedToday: number,
  requiresPremium = false,
): AiServiceError | null {
  const limits = getTierLimits(tier);

  if (requiresPremium && tier === 'free') {
    return createAiError(
      'SUBSCRIPTION_REQUIRED',
      'This AI feature requires a Premium subscription.',
    );
  }

  if (hasReachedLimit(usedToday, limits.aiAnalysisPerDay)) {
    const message =
      tier === 'premium'
        ? `Daily fair-use AI limit reached (${limits.aiAnalysisPerDay}/day). Resets at midnight UTC.`
        : `Daily AI limit reached (${limits.aiAnalysisPerDay}/day). Upgrade to Premium for a much higher fair-use allowance.`;
    return createAiError('DAILY_LIMIT_REACHED', message);
  }

  return null;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await secureStorageService.getItem(SecureStorageKeys.AUTH_TOKEN);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function isAiConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_AI_API_URL ?? process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_URL);
}

async function aiFetch<T>(
  endpoint: string,
  body: unknown,
  tier: SubscriptionTier,
  options?: { requiresPremium?: boolean; skipUsageIncrement?: boolean },
): Promise<T> {
  const usage = await getStoredUsage();
  const accessError = checkAiAccess(tier, usage.count, options?.requiresPremium);
  if (accessError) throw accessError;

  const rateLimit = aiRateLimiter.check(`ai-${endpoint}`);
  if (!rateLimit.allowed) {
    await waitForRateLimit(rateLimit.retryAfterMs);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${AI_API_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) * 1000 || 5000;
    throw createAiError('RATE_LIMITED', 'AI service rate limit reached. Please wait.', retryAfter);
  }

  if (!response.ok) {
    let message = `AI request failed (${response.status})`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) message = errorBody.message;
    } catch {
      // use default message
    }
    throw createAiError('API_ERROR', message);
  }

  if (!options?.skipUsageIncrement) {
    await incrementUsage();
  }

  const result = (await response.json()) as T;
  return result;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isAiServiceError(error: unknown): error is AiServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

function tagCloudResult(result: AiAnalysisResult): AiAnalysisResult {
  return {
    ...result,
    metadata: {
      ...result.metadata,
      source: 'cloud',
      confidence: result.metadata?.confidence ?? 85,
      dataAsOf: result.metadata?.dataAsOf ?? Date.now(),
      citations: result.metadata?.citations ?? [],
      modelVersion: result.metadata?.modelVersion ?? 'cloud',
    },
  };
}

async function requestAnalysis(
  type: AiAnalysisType,
  context: AiRequestContext,
  tier: SubscriptionTier,
  requiresPremium = false,
): Promise<AiAnalysisResult> {
  const enrichedContext = await enrichRequestContext(context);

  if (isAiConfigured()) {
    try {
      const cloudResult = await aiFetch<AiAnalysisResult>(
        '/analyze',
        { type, context: enrichedContext },
        tier,
        { requiresPremium },
      );
      return tagCloudResult(cloudResult);
    } catch (error) {
      if (isAiServiceError(error) && error.code !== 'API_ERROR') throw error;
    }
  }

  if (
    process.env.EXPO_PUBLIC_AI_API_URL &&
    type === 'trade_suggestion' &&
    enrichedContext.enriched
  ) {
    const cloudBrief = await fetchCloudAiBrief(enrichedContext.enriched, 'trade_suggestion');
    await incrementUsage();
    return cloudBrief;
  }

  const engineResult = await generateEngineAnalysis(type, enrichedContext);
  await incrementUsage();
  return engineResult;
}

export const aiService = {
  getUsage: getAiUsage,

  checkAccess: checkAiAccess,

  isServiceError: isAiServiceError,

  getDailySummary: (tier: SubscriptionTier) =>
    requestAnalysis('daily_summary', {}, tier),

  getTradeSuggestions: (symbol: string, tier: SubscriptionTier, timeframe?: string) =>
    requestAnalysis('trade_suggestion', { symbol, timeframe }, tier, true),

  getRiskAnalysis: (symbol: string, tier: SubscriptionTier) =>
    requestAnalysis('risk_analysis', { symbol }, tier),

  explainPattern: (symbol: string, pattern: string, tier: SubscriptionTier) =>
    requestAnalysis('pattern_explanation', { symbol, pattern }, tier, true),

  explainIndicator: (symbol: string, indicator: string, tier: SubscriptionTier) =>
    requestAnalysis('indicator_explanation', { symbol, indicator }, tier),

  getMarketRecap: (tier: SubscriptionTier, period: 'daily' | 'weekly' = 'daily') =>
    requestAnalysis('market_recap', { timeframe: period }, tier),

  getPsychologyCoach: (topic: string, tier: SubscriptionTier) =>
    requestAnalysis('psychology_coach', { customPrompt: topic }, tier),

  getPortfolioReview: (
    portfolio: AiRequestContext['portfolio'],
    tier: SubscriptionTier,
  ) => requestAnalysis('portfolio_review', { portfolio }, tier, true),

  getNewsSummary: (newsIds: string[], tier: SubscriptionTier, symbol?: string) =>
    requestAnalysis('news_summary', { newsIds, symbol }, tier),

  analyze: (type: AiAnalysisType, context: AiRequestContext, tier: SubscriptionTier) =>
    requestAnalysis(type, context, tier),

  chat: async (request: AiChatRequest, tier: SubscriptionTier): Promise<AiChatResponse> => {
    const enrichedContext = await enrichRequestContext(request.context ?? {});

    if (isAiConfigured()) {
      try {
        return await aiFetch<AiChatResponse>(
          '/chat',
          { ...request, context: enrichedContext },
          tier,
        );
      } catch (error) {
        if (isAiServiceError(error) && error.code !== 'API_ERROR') throw error;
      }
    }

    const engineResponse = generateEngineChatResponse(request.message, enrichedContext);
    const message: AiMessage = {
      id: generateId(),
      role: 'assistant',
      content: engineResponse.content,
      timestamp: Date.now(),
      metadata: {
        symbol: enrichedContext.symbol,
        source: 'engine',
        confidence: engineResponse.metadata.confidence,
        citations: engineResponse.metadata.citations,
      },
    };

    await incrementUsage();

    return {
      message,
      sessionId: request.sessionId ?? generateId(),
    };
  },
};

export type { AiServiceError };
