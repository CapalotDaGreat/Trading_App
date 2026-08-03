import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getTierLimits,
  hasReachedLimit,
  isNearAiDailyLimit,
  type SubscriptionTier,
} from '@/shared/constants/subscription';
import {
  callProxy,
  canUseVendorProxy,
  ProxyError,
} from '@/shared/services/firebase/callable-proxy';
import { aiRateLimiter } from '@/shared/services/rate-limit/rate-limiter';

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
  if (canUseVendorProxy()) {
    try {
      const remote = await callProxy<
        Record<string, never>,
        { usedToday: number; limit: number; remaining: number; resetsAt: number }
      >('getAiQuota', {});
      return {
        usedToday: remote.usedToday,
        limit: remote.limit,
        resetsAt: remote.resetsAt,
        isNearLimit: isNearAiDailyLimit(remote.usedToday, remote.limit),
        isAtLimit: hasReachedLimit(remote.usedToday, remote.limit),
      };
    } catch {
      // Fall back to local counter for offline / App Check soft failures.
    }
  }

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

async function recordServerAiUsage(): Promise<void> {
  if (!canUseVendorProxy()) return;
  try {
    await callProxy('recordAiUsage', {});
  } catch (error) {
    if (error instanceof ProxyError && error.isQuota) {
      throw createAiError('DAILY_LIMIT_REACHED', error.message);
    }
    // Local engine still works offline — local counter remains source for demo.
  }
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

function assertAiBurstLimit(bucket: string): void {
  const result = aiRateLimiter.check(bucket);
  if (!result.allowed) {
    throw createAiError(
      'RATE_LIMITED',
      'AI requests are temporarily rate-limited. Wait a moment and try again.',
      result.retryAfterMs,
    );
  }
}

async function requestAnalysis(
  type: AiAnalysisType,
  context: AiRequestContext,
  tier: SubscriptionTier,
  requiresPremium = false,
): Promise<AiAnalysisResult> {
  assertAiBurstLimit(`analysis:${tier}`);
  const enrichedContext = await enrichRequestContext(context);
  const usageStats = await getAiUsage(tier);
  const accessError = checkAiAccess(tier, usageStats.usedToday, requiresPremium);
  if (accessError) throw accessError;

  const engineResult = await generateEngineAnalysis(type, enrichedContext);
  await recordServerAiUsage();
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
    assertAiBurstLimit(`chat:${tier}`);
    const prompt = request.message?.trim() ?? '';
    if (prompt.length < 1 || prompt.length > 4000) {
      throw createAiError('API_ERROR', 'Message must be between 1 and 4000 characters.');
    }

    const enrichedContext = await enrichRequestContext(request.context ?? {});
    const usageStats = await getAiUsage(tier);
    const accessError = checkAiAccess(tier, usageStats.usedToday);
    if (accessError) throw accessError;

    const engineResponse = generateEngineChatResponse(prompt, enrichedContext);
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

    await recordServerAiUsage();
    await incrementUsage();

    return {
      message,
      sessionId: request.sessionId ?? generateId(),
    };
  },
};

export type { AiServiceError };
