import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';

import { requireDb } from '@/firebase/config';
import { getLimit } from '@/features/subscription/services/entitlement.service';
import { hasReachedLimit, type SubscriptionTier } from '@/shared/constants/subscription';
import { getLocalUserRepository, resolveUserDataBackend } from '@/shared/services/user-data';

import type {
  CreateHoldingInput,
  Holding,
  HoldingDocument,
  HoldingPnL,
  PerformancePoint,
  PortfolioPerformance,
  PortfolioSummary,
  UpdateHoldingInput,
} from '../types/portfolio.types';

const USERS_COLLECTION = 'users';
const HOLDINGS_SUBCOLLECTION = 'holdings';

function holdingsCollection(uid: string) {
  return collection(requireDb(), USERS_COLLECTION, uid, HOLDINGS_SUBCOLLECTION);
}

function holdingDocRef(uid: string, holdingId: string) {
  return doc(requireDb(), USERS_COLLECTION, uid, HOLDINGS_SUBCOLLECTION, holdingId);
}

function serializeTimestamp(value: unknown): string {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return new Date().toISOString();
}

function toHolding(id: string, data: DocumentData): Holding {
  return {
    id,
    symbol: (data.symbol as string) ?? '',
    name: (data.name as string) ?? '',
    marketType: (data.marketType as Holding['marketType']) ?? 'stocks',
    assetClass: (data.assetClass as Holding['assetClass']) ?? 'equity',
    quantity: (data.quantity as number) ?? 0,
    averageCost: (data.averageCost as number) ?? 0,
    currentPrice: (data.currentPrice as number) ?? 0,
    currency: (data.currency as string) ?? 'USD',
    side: (data.side as Holding['side']) ?? 'long',
    notes: (data.notes as string | undefined) ?? undefined,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

export function calculateHoldingPnL(holding: Holding, previousClose?: number): HoldingPnL {
  const multiplier = holding.side === 'short' ? -1 : 1;
  const marketValue = holding.quantity * holding.currentPrice * multiplier;
  const costBasis = holding.quantity * holding.averageCost;
  const unrealizedPnL = marketValue - costBasis * multiplier;
  const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

  const dayChange =
    previousClose === undefined
      ? 0
      : holding.quantity * (holding.currentPrice - previousClose) * multiplier;
  const dayChangePercent =
    previousClose !== undefined && previousClose > 0
      ? ((holding.currentPrice - previousClose) / previousClose) * 100 * multiplier
      : 0;

  return {
    holdingId: holding.id,
    symbol: holding.symbol,
    marketValue,
    costBasis,
    unrealizedPnL,
    unrealizedPnLPercent,
    dayChange,
    dayChangePercent,
  };
}

export function calculatePortfolioSummary(holdings: Holding[]): PortfolioSummary {
  if (holdings.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      holdingsCount: 0,
      currency: 'USD',
    };
  }

  const pnls = holdings.map((h) => calculateHoldingPnL(h));
  const totalValue = pnls.reduce((sum, p) => sum + p.marketValue, 0);
  const totalCost = pnls.reduce((sum, p) => sum + p.costBasis, 0);
  const totalPnL = pnls.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const dayChange = pnls.reduce((sum, p) => sum + p.dayChange, 0);
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
    dayChange,
    dayChangePercent,
    holdingsCount: holdings.length,
    currency: holdings[0]?.currency ?? 'USD',
  };
}

export function buildPerformanceHistory(
  holdings: Holding[],
  period: PortfolioPerformance['period'] = '1M',
): PortfolioPerformance {
  const summary = calculatePortfolioSummary(holdings);
  const points: PerformancePoint[] =
    holdings.length === 0
      ? []
      : [
          {
            date: new Date().toISOString().split('T')[0] ?? '',
            value: summary.totalValue,
            pnl: summary.totalPnL,
            pnlPercent: summary.totalPnLPercent,
          },
        ];
  return { points, period };
}

export async function getHoldings(uid: string): Promise<Holding[]> {
  if (resolveUserDataBackend(uid) === 'local') {
    const holdings = await getLocalUserRepository(uid).list<Holding>('holdings');
    return holdings.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const q = query(holdingsCollection(uid), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toHolding(docSnap.id, docSnap.data()));
}

export async function createHolding(
  uid: string,
  input: CreateHoldingInput,
  tier: SubscriptionTier = 'free',
): Promise<Holding> {
  const holdings = await getHoldings(uid);
  const limit = getLimit('portfolioPositions', tier);
  if (hasReachedLimit(holdings.length, limit)) {
    throw new Error(`Portfolio position limit reached (${limit}).`);
  }
  const now = new Date().toISOString();
  const data: HoldingDocument = {
    symbol: input.symbol.toUpperCase().trim(),
    name: input.name.trim(),
    marketType: input.marketType,
    assetClass: input.assetClass,
    quantity: input.quantity,
    averageCost: input.averageCost,
    currentPrice: input.currentPrice,
    currency: input.currency ?? 'USD',
    side: input.side ?? 'long',
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  if (resolveUserDataBackend(uid) === 'local') {
    return getLocalUserRepository(uid).create<Holding>('holdings', data);
  }

  const ref = await addDoc(holdingsCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id, ...data };
}

export async function updateHolding(
  uid: string,
  holdingId: string,
  updates: UpdateHoldingInput,
): Promise<void> {
  if (resolveUserDataBackend(uid) === 'local') {
    await getLocalUserRepository(uid).update<Holding>('holdings', holdingId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  await updateDoc(holdingDocRef(uid, holdingId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHolding(uid: string, holdingId: string): Promise<void> {
  if (resolveUserDataBackend(uid) === 'local') {
    await getLocalUserRepository(uid).delete('holdings', holdingId);
    return;
  }
  await deleteDoc(holdingDocRef(uid, holdingId));
}

export async function updateHoldingPrices(
  uid: string,
  prices: Record<string, number>,
): Promise<void> {
  const holdings = await getHoldings(uid);
  const updates = holdings
    .filter((h) => prices[h.symbol] !== undefined)
    .map((h) => updateHolding(uid, h.id, { currentPrice: prices[h.symbol] }));

  await Promise.all(updates);
}
