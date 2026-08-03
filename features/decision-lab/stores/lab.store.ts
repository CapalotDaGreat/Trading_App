import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

import type { MarketRegime, TraderMemory } from '@/features/decision/types/decision.types';
import type { Holding } from '@/features/portfolio/types/portfolio.types';

import {
  buildLabAiCritique,
  buildThesisChecklist,
  computeRiskReward,
  isThesisComplete,
  scoreClosedLabTrade,
  thesisBlockers,
  validateThesisGeometry,
} from '../services/lab-thesis.service';
import { buildLabStats, evaluateChallenges } from '../services/lab-stats.service';
import type {
  LabAccount,
  LabAccountSize,
  LabAiCritique,
  LabBias,
  LabCurrency,
  LabPosition,
  LabScenarioId,
  LabStats,
  LabThesis,
} from '../types/lab.types';
import { LAB_ACCOUNT_SIZES } from '../types/lab.types';

export interface ThesisDraft {
  symbol: string;
  bias: LabBias;
  entryLow: string;
  entryHigh: string;
  stopLoss: string;
  target: string;
  catalyst: string;
  invalidation: string;
  confidence: string;
  academyChecklistDone: boolean;
  scenarioId: LabScenarioId;
  notes: string;
  quantity: string;
}

const emptyDraft = (): ThesisDraft => ({
  symbol: 'SPY',
  bias: 'long',
  entryLow: '',
  entryHigh: '',
  stopLoss: '',
  target: '',
  catalyst: '',
  invalidation: '',
  confidence: '60',
  academyChecklistDone: false,
  scenarioId: 'freeform',
  notes: '',
  quantity: '10',
});

interface LabState {
  account: LabAccount;
  positions: LabPosition[];
  draft: ThesisDraft;
  lastCritique: LabAiCritique | null;
  pendingThesis: LabThesis | null;
  setAccountSize: (size: LabAccountSize) => void;
  setCurrency: (currency: LabCurrency) => void;
  resetAccount: () => void;
  patchDraft: (patch: Partial<ThesisDraft>) => void;
  resetDraft: (scenarioId?: LabScenarioId, symbol?: string) => void;
  buildCritique: (ctx: {
    regime?: MarketRegime;
    memory?: TraderMemory;
    holdings?: Holding[];
  }) => { ok: true; thesis: LabThesis; critique: LabAiCritique } | { ok: false; errors: string[] };
  openFromCritique: () => { ok: true; position: LabPosition } | { ok: false; error: string };
  updateMark: (positionId: string, markPrice: number) => void;
  closePosition: (
    positionId: string,
    input: { exitPrice: number; stopHonored: boolean; journaled: boolean },
  ) => { ok: true; position: LabPosition } | { ok: false; error: string };
  getOpenPositions: () => LabPosition[];
  getStats: () => LabStats;
  getChallenges: () => ReturnType<typeof evaluateChallenges>;
}

function freshAccount(size: LabAccountSize = 25_000, currency: LabCurrency = 'USD'): LabAccount {
  return {
    size,
    currency,
    cash: size,
    startingCash: size,
    updatedAt: Date.now(),
  };
}

function parseNum(v: string): number | undefined {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

export const useDecisionLabStore = create<LabState>()(
  persist(
    (set, get) => ({
      account: freshAccount(),
      positions: [],
      draft: emptyDraft(),
      lastCritique: null,
      pendingThesis: null,

      setAccountSize: (size) => {
        if (!LAB_ACCOUNT_SIZES.includes(size)) return;
        set({
          account: {
            size,
            currency: get().account.currency,
            cash: size,
            startingCash: size,
            updatedAt: Date.now(),
          },
          positions: [],
          lastCritique: null,
          pendingThesis: null,
        });
      },

      setCurrency: (currency) => {
        set((s) => ({
          account: { ...s.account, currency, updatedAt: Date.now() },
        }));
      },

      resetAccount: () => {
        const { account } = get();
        set({
          account: freshAccount(account.size, account.currency),
          positions: [],
          lastCritique: null,
          pendingThesis: null,
          draft: emptyDraft(),
        });
      },

      patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      resetDraft: (scenarioId, symbol) =>
        set({
          draft: {
            ...emptyDraft(),
            scenarioId: scenarioId ?? 'freeform',
            symbol: symbol ?? 'SPY',
          },
          lastCritique: null,
          pendingThesis: null,
        }),

      buildCritique: (ctx) => {
        const d = get().draft;
        const entryLow = parseNum(d.entryLow);
        const entryHigh = parseNum(d.entryHigh);
        const stopLoss = parseNum(d.stopLoss);
        const target = parseNum(d.target);
        const confidence = parseNum(d.confidence);
        const mid =
          entryLow != null && entryHigh != null ? (entryLow + entryHigh) / 2 : undefined;
        const rr =
          mid != null && stopLoss != null && target != null
            ? computeRiskReward(d.bias, mid, stopLoss, target)
            : 0;

        const checklist = buildThesisChecklist({
          bias: d.bias,
          entryLow,
          entryHigh,
          stopLoss,
          target,
          riskReward: rr,
          catalyst: d.catalyst,
          invalidation: d.invalidation,
          confidence,
          academyChecklistDone: d.academyChecklistDone,
        });

        const blockers = thesisBlockers(checklist);
        if (blockers.length) {
          return { ok: false, errors: blockers };
        }

        const thesis: LabThesis = {
          id: `thesis-${Date.now()}`,
          symbol: d.symbol.trim().toUpperCase() || 'SPY',
          bias: d.bias,
          entryLow: entryLow!,
          entryHigh: entryHigh!,
          stopLoss: stopLoss!,
          target: target!,
          riskReward: rr,
          catalyst: d.catalyst.trim(),
          invalidation: d.invalidation.trim(),
          confidence: confidence!,
          checklist,
          scenarioId: d.scenarioId,
          notes: d.notes.trim(),
          createdAt: Date.now(),
        };

        const geometry = validateThesisGeometry(thesis);
        if (geometry) {
          return { ok: false, errors: [geometry] };
        }

        const critique = buildLabAiCritique({
          thesis,
          regime: ctx.regime,
          memory: ctx.memory,
          holdings: ctx.holdings,
        });

        set({ lastCritique: critique, pendingThesis: thesis });
        return { ok: true, thesis, critique };
      },

      openFromCritique: () => {
        const state = get();
        const thesis = state.pendingThesis;
        const critique = state.lastCritique;
        if (!thesis || !critique) {
          return { ok: false, error: 'Run AI critique before opening a Lab position.' };
        }
        if (!isThesisComplete(thesis.checklist)) {
          return { ok: false, error: 'Incomplete thesis — cannot open.' };
        }
        if (critique.overall === 'block') {
          return { ok: false, error: 'AI critique blocked this open — fix the thesis.' };
        }

        const qty = parseNum(state.draft.quantity) ?? 0;
        if (qty <= 0) return { ok: false, error: 'Quantity must be positive.' };

        const entryPrice = (thesis.entryLow + thesis.entryHigh) / 2;
        const notional = entryPrice * qty;
        if (notional > state.account.cash) {
          return {
            ok: false,
            error: `Insufficient virtual cash (${state.account.currency} ${state.account.cash.toFixed(0)}).`,
          };
        }

        const position: LabPosition = {
          id: `lab-${Date.now()}`,
          thesisId: thesis.id,
          thesis,
          status: 'open',
          quantity: qty,
          entryPrice,
          markPrice: entryPrice,
          openedAt: Date.now(),
          critique,
          accountCurrency: state.account.currency,
        };

        set((s) => ({
          positions: [position, ...s.positions],
          account: {
            ...s.account,
            cash: Math.round((s.account.cash - notional) * 100) / 100,
            updatedAt: Date.now(),
          },
          lastCritique: null,
          pendingThesis: null,
          draft: emptyDraft(),
        }));

        return { ok: true, position };
      },

      updateMark: (positionId, markPrice) => {
        set((s) => ({
          positions: s.positions.map((p) =>
            p.id === positionId && p.status === 'open' ? { ...p, markPrice } : p,
          ),
        }));
      },

      closePosition: (positionId, input) => {
        const pos = get().positions.find((p) => p.id === positionId);
        if (!pos || pos.status !== 'open') {
          return { ok: false, error: 'Position not found or already closed.' };
        }

        const scores = scoreClosedLabTrade({
          position: pos,
          stopHonored: input.stopHonored,
          journaled: input.journaled,
        });

        const proceeds = input.exitPrice * pos.quantity;
        const closed: LabPosition = {
          ...pos,
          status: 'closed',
          exitPrice: input.exitPrice,
          markPrice: input.exitPrice,
          closedAt: Date.now(),
          stopHonored: input.stopHonored,
          scores,
        };

        set((s) => ({
          positions: s.positions.map((p) => (p.id === positionId ? closed : p)),
          account: {
            ...s.account,
            cash: Math.round((s.account.cash + proceeds) * 100) / 100,
            updatedAt: Date.now(),
          },
        }));

        useDecisionPassportStore.getState().recordLabResult({
          symbol: closed.thesis.symbol,
          processScore: scores.processScore,
          stopHonored: input.stopHonored,
          journaled: input.journaled,
        });

        return { ok: true, position: closed };
      },

      getOpenPositions: () => get().positions.filter((p) => p.status === 'open'),
      getStats: () => buildLabStats(get().positions),
      getChallenges: () => evaluateChallenges(get().positions),
    }),
    {
      name: 'tradevision-decision-lab-v1',
      storage: createPersistedStorage(),
      partialize: (s) => ({
        account: s.account,
        positions: s.positions,
        draft: s.draft,
      }),
    },
  ),
);
