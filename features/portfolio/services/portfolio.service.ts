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
import { proxyCreatePortfolioHolding } from '@/features/markets/services/market-proxy.service';
import type { InstrumentProvider } from '@/features/markets/types/instrument.types';
import { getLimit } from '@/features/subscription/services/entitlement.service';
import { hasReachedLimit, type SubscriptionTier } from '@/shared/constants/subscription';
import { canUseVendorProxy } from '@/shared/services/firebase/callable-proxy';
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
import { DuplicateHoldingError } from '../types/portfolio.types';

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
    instrumentId: (data.instrumentId as string | undefined) ?? undefined,
    canonicalSymbol: (data.canonicalSymbol as string | undefined) ?? undefined,
    provider: (data.provider as InstrumentProvider | undefined) ?? undefined,
    providerSymbol: (data.providerSymbol as string | undefined) ?? undefined,
    exchange: (data.exchange as string | undefined) ?? undefined,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function assertResolvedCreateInput(input: CreateHoldingInput): void {
  if (
    !input.instrumentId?.trim() ||
    !input.canonicalSymbol?.trim() ||
    !input.symbol?.trim() ||
    !input.name?.trim() ||
    !input.provider ||
    !input.providerSymbol?.trim()
  ) {
    throw new Error(
      'Holdings require a resolved market instrument. Search and select an asset first.',
    );
  }
  if (!Number.isFinite(input.currentPrice) || input.currentPrice <= 0) {
    throw new Error('A valid market price is required — prices are never invented.');
  }
}

export function findDuplicateHolding(
  holdings: Holding[],
  input: Pick<CreateHoldingInput, 'instrumentId' | 'canonicalSymbol' | 'symbol'>,
): Holding | undefined {
  const instrumentId = input.instrumentId.trim();
  const canonical = input.canonicalSymbol.trim().toUpperCase();
  const symbol = input.symbol.trim().toUpperCase();
  return holdings.find((h) => {
    if (h.instrumentId && h.instrumentId === instrumentId) return true;
    const existingCanonical = (h.canonicalSymbol ?? h.symbol).toUpperCase();
    return existingCanonical === canonical || h.symbol.toUpperCase() === symbol;
  });
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
  assertResolvedCreateInput(input);

  const holdings = await getHoldings(uid);
  const limit = getLimit('portfolioPositions', tier);
  if (hasReachedLimit(holdings.length, limit)) {
    throw new Error(`Portfolio position limit reached (${limit}).`);
  }

  const duplicate = findDuplicateHolding(holdings, input);
  if (duplicate) {
    throw new DuplicateHoldingError(duplicate);
  }

  const now = new Date().toISOString();
  const data: HoldingDocument = {
    symbol: input.symbol.trim(),
    name: input.name.trim(),
    marketType: input.marketType,
    assetClass: input.assetClass,
    quantity: input.quantity,
    averageCost: input.averageCost,
    currentPrice: input.currentPrice,
    currency: input.currency ?? 'USD',
    side: input.side ?? 'long',
    notes: input.notes,
    instrumentId: input.instrumentId.trim(),
    canonicalSymbol: input.canonicalSymbol.trim(),
    provider: input.provider,
    providerSymbol: input.providerSymbol.trim(),
    exchange: input.exchange?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  if (resolveUserDataBackend(uid) === 'local') {
    return getLocalUserRepository(uid).create<Holding>('holdings', data);
  }

  // Production Firebase path: server re-validates instrument before write.
  if (canUseVendorProxy()) {
    try {
      const result = await proxyCreatePortfolioHolding({
        instrumentId: data.instrumentId,
        symbol: data.symbol,
        canonicalSymbol: data.canonicalSymbol,
        name: data.name,
        marketType: data.marketType,
        assetClass: data.assetClass,
        currency: data.currency,
        exchange: data.exchange,
        provider: data.provider,
        providerSymbol: data.providerSymbol,
        quantity: data.quantity,
        averageCost: data.averageCost,
        currentPrice: data.currentPrice,
        side: data.side,
        notes: data.notes,
      });
      return toHolding(result.holding.id, result.holding);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create holding.';
      if (/already have this asset|already-exists/i.test(message)) {
        const again = findDuplicateHolding(await getHoldings(uid), input);
        if (again) throw new DuplicateHoldingError(again);
      }
      throw error instanceof Error ? error : new Error(message);
    }
  }

  // Signed-in Firestore without callable proxy: still require resolved shape.
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
