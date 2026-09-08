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
  reset: (userId: string, mode?: SimulationMode, challengeId?: string, currency?: string) => SimulationAccount;
}

function resolvePrice(input: Omit<SimulationTradeInput, 'price'> & { price?: number }): number | undefined {
  if (input.price != null) return input.price;
  return priceProvider.getQuote(input.symbol)?.price;
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
      ensureAccount: (userId, mode = 'standard', challengeId, currency) => {
        const existing = get().accountsByUser[userId];
        if (existing && existing.status !== 'archived') return existing;
        if (existing?.status === 'archived') {
          set({ archivesByUser: pushArchive(get, userId, existing) });
        }
        const created = createSimulationAccount({
          userId,
          mode,
          startingBalance: DEFAULT_STARTING_BALANCE,
          challengeId,
          currency: currency ?? getDisplayCurrency(),
        });
        return writeLive(set, get, userId, created);
      },
      accountFor: (userId) => get().accountsByUser[userId],
      archivesFor: (userId) => get().archivesByUser[userId] ?? [],
      previewBuy: (userId, input) => {
        const account = get().ensureAccount(userId);
        const price = resolvePrice(input);
        if (price == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        return previewBuy(account, { ...input, price });
      },
      previewSell: (userId, input) => {
        const account = get().ensureAccount(userId);
        const price = resolvePrice(input);
        if (price == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        return previewSell(account, { ...input, price });
      },
      buy: (userId, input) => {
        const account = get().ensureAccount(userId);
        const price = resolvePrice(input);
        if (price == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        const result = executeBuy(account, { ...input, price });
        if (result.ok) writeLive(set, get, userId, result.value);
        return result;
      },
      sell: (userId, input) => {
        const account = get().ensureAccount(userId);
        const price = resolvePrice(input);
        if (price == null) {
          return { ok: false, code: 'invalid_symbol', message: 'Choose a listed simulated instrument.' };
        }
        const result = executeSell(account, { ...input, price });
        if (result.ok) writeLive(set, get, userId, result.value);
        return result;
      },
      recordCloseReview: (userId, decisionId, review) => {
        const account = get().ensureAccount(userId);
        return writeLive(set, get, userId, recordCloseReview(account, decisionId, review));
      },
      refreshPrices: (userId, nowMs = Date.now()) => {
        const account = get().ensureAccount(userId);
        const prices: Record<string, number> = {};
        for (const position of account.positions) {
          const quote = priceProvider.getQuote(position.symbol, nowMs);
          if (quote) prices[position.symbol] = quote.price;
        }
        return writeLive(set, get, userId, markToMarket(account, prices, new Date(nowMs).toISOString()));
      },
      reset: (userId, mode, challengeId, currency) => {
        const account = get().ensureAccount(userId, mode, challengeId, currency);
        const { archived, next } = resetSimulationAccount(account, {
          mode: mode ?? account.mode,
          challengeId: challengeId ?? account.challengeId,
          currency: currency ?? getDisplayCurrency(),
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
      version: 2,
      partialize: (state) => ({
        accountsByUser: state.accountsByUser,
        archivesByUser: state.archivesByUser,
      }),
      migrate: (persisted) => migrateSimulationPersist(persisted),
    },
  ),
);
