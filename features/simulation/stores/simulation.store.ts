import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import { DEFAULT_STARTING_BALANCE } from '../constants/simulation.constants';
import { getDisplayCurrency } from '@/shared/hooks/useDisplayCurrency';
import {
  archiveSimulationAccount,
  createSimulationAccount,
  executeBuy,
  executeSell,
  markToMarket,
  previewBuy,
  previewSell,
  recordCloseReview,
  resetSimulationAccount,
} from '../services/simulation-engine.service';
import { migrateSimulationPersist } from '../services/simulation-persist.service';
import { inferScenarioFocus } from '../services/scenario-adaptation.service';
import { appendDecisionCheckpoint } from '../services/scenario-checkpoint.service';
import { applyExecutionFriction } from '../services/scenario-friction.service';
import {
  generateSimulationScenario,
  advanceScenarioClock,
  advanceToNextInformation,
  answerDecisionWindow,
} from '../services/scenario-generator.service';
import { createScenarioPriceProvider } from '../services/scenario-path.service';
import type { ScenarioDecisionOption, ScenarioStartOptions } from '../types/scenario.types';
import { syntheticSimulationPriceProvider } from '../services/synthetic-market.service';
import type {
  SimulationAccount,
  SimulationCloseReview,
  SimulationMode,
  SimulationPriceProvider,
  SimulationResult,
  SimulationTradeInput,
  SimulationTradePreview,
} from '../types/simulation.types';

const ARCHIVE_CAP = 25;

let priceProvider: SimulationPriceProvider = syntheticSimulationPriceProvider;

export function setSimulationPriceProvider(provider: SimulationPriceProvider): void {
  priceProvider = provider;
}

interface SimulationState {
  accountsByUser: Record<string, SimulationAccount>;
  archivesByUser: Record<string, SimulationAccount[]>;
  ensureAccount: (
    userId: string,
    mode?: SimulationMode,
    challengeId?: string,
    currency?: string,
    options?: ScenarioStartOptions,
  ) => SimulationAccount;
  accountFor: (userId: string) => SimulationAccount | undefined;
  archivesFor: (userId: string) => SimulationAccount[];
  previewBuy: (
    userId: string,
    input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  ) => SimulationResult<SimulationTradePreview>;
  previewSell: (
    userId: string,
    input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  ) => SimulationResult<SimulationTradePreview>;
  buy: (
    userId: string,
    input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  ) => SimulationResult<SimulationAccount>;
  sell: (
    userId: string,
    input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  ) => SimulationResult<SimulationAccount>;
  recordCloseReview: (userId: string, decisionId: string, review: SimulationCloseReview) => SimulationAccount;
  refreshPrices: (userId: string, nowMs?: number) => SimulationAccount;
  reset: (
    userId: string,
    mode?: SimulationMode,
    challengeId?: string,
    currency?: string,
    options?: ScenarioStartOptions,
  ) => SimulationAccount;
  advanceClock: (userId: string) => SimulationAccount;
  advanceToNextInformation: (userId: string) => SimulationAccount;
  answerDecision: (
    userId: string,
    windowId: string,
    option: ScenarioDecisionOption,
    reasoning?: string,
  ) => SimulationAccount;
}

function nextScenario(
  userId: string,
  mode: SimulationMode,
  prior?: SimulationAccount,
  options?: ScenarioStartOptions,
): ReturnType<typeof generateSimulationScenario> {
  return generateSimulationScenario({
    userId,
    mode,
    focus: options?.focus ?? inferScenarioFocus(prior),
    preferredEventKind: options?.preferredEventKind,
    difficulty: options?.difficulty,
  });
}

function resolveFill(
  account: SimulationAccount,
  input: Omit<SimulationTradeInput, 'price'> & { price?: number },
  side: 'buy' | 'sell',
): { price: number; fees?: number } | undefined {
  if (input.price != null) return { price: input.price, fees: input.fees };
  const provider = account.scenario ? createScenarioPriceProvider(account.scenario) : priceProvider;
  const mid = provider.getQuote(input.symbol)?.price;
  if (mid == null) return undefined;
  if (!account.scenario) return { price: mid, fees: input.fees };
  return applyExecutionFriction({
    mid,
    side,
    scenario: account.scenario,
    symbol: input.symbol.toUpperCase(),
    notional: mid * input.quantity,
  });
}

function writeLive(
  set: (partial: Partial<SimulationState> | ((state: SimulationState) => Partial<SimulationState>)) => void,
  get: () => SimulationState,
  userId: string,
  account: SimulationAccount,
): SimulationAccount {
  set({ accountsByUser: { ...get().accountsByUser, [userId]: account } });
  return account;
}

function pushArchive(get: () => SimulationState, userId: string, archived: SimulationAccount): Record<string, SimulationAccount[]> {
  const next = [...(get().archivesByUser[userId] ?? []), archived].slice(-ARCHIVE_CAP);
  return { ...get().archivesByUser, [userId]: next };
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      accountsByUser: {},
      archivesByUser: {},
      ensureAccount: (userId, mode = 'standard', challengeId, currency, options) => {
        const existing = get().accountsByUser[userId];
        if (existing && existing.status !== 'archived') {
          if (!existing.scenario) {
            return writeLive(set, get, userId, {
              ...existing,
              scenario: nextScenario(userId, existing.mode, existing, options),
            });
          }
          return existing;
        }
        if (existing?.status === 'archived') {
          set({ archivesByUser: pushArchive(get, userId, existing) });
        }
        const created = createSimulationAccount({
          userId,
          mode,
          startingBalance: DEFAULT_STARTING_BALANCE,
          challengeId,
          currency: currency ?? getDisplayCurrency(),
          scenario: nextScenario(userId, mode, get().archivesByUser[userId]?.at(-1), options),
        });
        return writeLive(set, get, userId, created);
      },
      accountFor: (userId) => get().accountsByUser[userId],
      archivesFor: (userId) => get().archivesByUser[userId] ?? [],
      previewBuy: (userId, input) => {
        const account = get().ensureAccount(userId);
        const fill = resolveFill(account, input, 'buy');
        if (fill == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        return previewBuy(account, { ...input, price: fill.price, fees: fill.fees ?? input.fees });
      },
      previewSell: (userId, input) => {
        const account = get().ensureAccount(userId);
        const fill = resolveFill(account, input, 'sell');
        if (fill == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        return previewSell(account, { ...input, price: fill.price, fees: fill.fees ?? input.fees });
      },
      buy: (userId, input) => {
        const account = get().ensureAccount(userId);
        const fill = resolveFill(account, input, 'buy');
        if (fill == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        const result = executeBuy(account, { ...input, price: fill.price, fees: fill.fees ?? input.fees });
        if (result.ok) writeLive(set, get, userId, result.value);
        return result;
      },
      sell: (userId, input) => {
        const account = get().ensureAccount(userId);
        const fill = resolveFill(account, input, 'sell');
        if (fill == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        const result = executeSell(account, { ...input, price: fill.price, fees: fill.fees ?? input.fees });
        if (result.ok) writeLive(set, get, userId, result.value);
        return result;
      },
      recordCloseReview: (userId, decisionId, review) => {
        const account = get().ensureAccount(userId);
        return writeLive(set, get, userId, recordCloseReview(account, decisionId, review));
      },
      refreshPrices: (userId, nowMs = Date.now()) => {
        const account = get().ensureAccount(userId);
        const provider = account.scenario ? createScenarioPriceProvider(account.scenario) : priceProvider;
        const prices: Record<string, number> = {};
        for (const position of account.positions) {
          const quote = provider.getQuote(position.symbol, nowMs);
          if (quote) prices[position.symbol] = quote.price;
        }
        return writeLive(set, get, userId, markToMarket(account, prices, new Date(nowMs).toISOString()));
      },
      advanceClock: (userId) => {
        const account = get().ensureAccount(userId);
        if (!account.scenario) return account;
        const scenario = advanceScenarioClock(account.scenario, 1);
        const provider = createScenarioPriceProvider(scenario);
        const prices: Record<string, number> = {};
        for (const position of account.positions) {
          const quote = provider.getQuote(position.symbol);
          if (quote) prices[position.symbol] = quote.price;
        }
        return writeLive(
          set,
          get,
          userId,
          markToMarket({ ...account, scenario }, prices),
        );
      },
      advanceToNextInformation: (userId) => {
        const account = get().ensureAccount(userId);
        if (!account.scenario) return account;
        const scenario = advanceToNextInformation(account.scenario);
        const provider = createScenarioPriceProvider(scenario);
        const prices: Record<string, number> = {};
        for (const position of account.positions) {
          const quote = provider.getQuote(position.symbol);
          if (quote) prices[position.symbol] = quote.price;
        }
        return writeLive(set, get, userId, markToMarket({ ...account, scenario }, prices));
      },
      answerDecision: (userId, windowId, option, reasoning) => {
        const account = get().ensureAccount(userId);
        if (!account.scenario) return account;
        const next = {
          ...account,
          scenario: answerDecisionWindow(account.scenario, windowId, option, reasoning),
        };
        return writeLive(
          set,
          get,
          userId,
          appendDecisionCheckpoint(next, {
            kind: 'window',
            windowId,
            decision: option,
            thesis: reasoning,
          }),
        );
      },
      reset: (userId, mode, challengeId, currency, options) => {
        const account = get().ensureAccount(userId, mode, challengeId, currency, options);
        const nextMode = mode ?? account.mode;
        const { archived, next } = resetSimulationAccount(account, {
          mode: nextMode,
          challengeId: challengeId ?? account.challengeId,
          currency: currency ?? getDisplayCurrency(),
          scenario: nextScenario(userId, nextMode, account, options),
        });
        const alreadyArchived = archived.status === 'archived' ? archived : archiveSimulationAccount(archived);
        set({
          accountsByUser: { ...get().accountsByUser, [userId]: next },
          archivesByUser: pushArchive(get, userId, alreadyArchived),
        });
        return next;
      },
    }),
    {
      name: 'tradevision-simulation-v1',
      storage: createPersistedStorage(),
      version: 3,
      partialize: (state) => ({
        accountsByUser: state.accountsByUser,
        archivesByUser: state.archivesByUser,
      }),
      migrate: (persisted) => migrateSimulationPersist(persisted),
    },
  ),
);
