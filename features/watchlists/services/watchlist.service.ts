import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';

import { requireDb } from '@/firebase/config';
import {
  getTierLimits,
  hasReachedLimit,
  type SubscriptionTier,
} from '@/shared/constants/subscription';
import { getLocalUserRepository, resolveUserDataBackend } from '@/shared/services/user-data';
import type { WatchlistItem } from '@/shared/types/market';

const USERS_COLLECTION = 'users';
const WATCHLISTS_COLLECTION = 'watchlists';

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWatchlistInput {
  name: string;
  symbols?: string[];
}

export interface UpdateWatchlistInput {
  name?: string;
  symbols?: string[];
}

function watchlistsCollection(uid: string) {
  return collection(requireDb(), USERS_COLLECTION, uid, WATCHLISTS_COLLECTION);
}

function watchlistDocRef(uid: string, watchlistId: string) {
  return doc(requireDb(), USERS_COLLECTION, uid, WATCHLISTS_COLLECTION, watchlistId);
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
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

function symbolsToItems(symbols: string[]): WatchlistItem[] {
  const now = Date.now();
  return symbols.map((symbol, index) => ({
    assetId: symbol,
    symbol,
    addedAt: now,
    sortOrder: index,
  }));
}

function toWatchlist(id: string, data: DocumentData): Watchlist {
  const symbols = (data.symbols as string[]) ?? [];
  return {
    id,
    name: (data.name as string) ?? 'Watchlist',
    symbols,
    items: symbolsToItems(symbols),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function assertWatchlistLimit(currentCount: number, tier: SubscriptionTier): void {
  const limits = getTierLimits(tier);
  if (hasReachedLimit(currentCount, limits.watchlistMax)) {
    throw new Error(
      `Watchlist limit reached (${limits.watchlistMax}). Upgrade your plan to add more.`,
    );
  }
}

function assertSymbolLimit(symbolCount: number, tier: SubscriptionTier): void {
  const limits = getTierLimits(tier);
  if (hasReachedLimit(symbolCount, limits.watchlistMax)) {
    throw new Error(
      `Symbol limit reached (${limits.watchlistMax}). Upgrade your plan to add more symbols.`,
    );
  }
}

export async function getWatchlists(uid: string): Promise<Watchlist[]> {
  if (resolveUserDataBackend(uid) === 'local') {
    const watchlists = await getLocalUserRepository(uid).list<Watchlist>('watchlists');
    return watchlists
      .map((watchlist) => {
        const timestamp = new Date().toISOString();
        return {
          ...watchlist,
          name: watchlist.name ?? 'Watchlist',
          symbols: watchlist.symbols ?? [],
          items: symbolsToItems(watchlist.symbols ?? []),
          createdAt: watchlist.createdAt ?? timestamp,
          updatedAt: watchlist.updatedAt ?? watchlist.createdAt ?? timestamp,
        };
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const q = query(watchlistsCollection(uid), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toWatchlist(d.id, d.data()));
}

export async function getWatchlist(uid: string, watchlistId: string): Promise<Watchlist | null> {
  if (resolveUserDataBackend(uid) === 'local') {
    const watchlist = await getLocalUserRepository(uid).get<Watchlist>('watchlists', watchlistId);
    if (!watchlist) return null;
    const timestamp = new Date().toISOString();
    return {
      ...watchlist,
      name: watchlist.name ?? 'Watchlist',
      symbols: watchlist.symbols ?? [],
      items: symbolsToItems(watchlist.symbols ?? []),
      createdAt: watchlist.createdAt ?? timestamp,
      updatedAt: watchlist.updatedAt ?? watchlist.createdAt ?? timestamp,
    };
  }
  const snapshot = await getDoc(watchlistDocRef(uid, watchlistId));
  if (!snapshot.exists()) return null;
  return toWatchlist(snapshot.id, snapshot.data());
}

export async function createWatchlist(
  uid: string,
  input: CreateWatchlistInput,
  tier: SubscriptionTier = 'free',
): Promise<Watchlist> {
  const existing = await getWatchlists(uid);
  assertWatchlistLimit(existing.length, tier);

  const symbols = input.symbols ?? [];
  assertSymbolLimit(symbols.length, tier);

  const name = input.name.trim();

  if (!name) {
    throw new Error('Watchlist name is required.');
  }

  if (resolveUserDataBackend(uid) === 'local') {
    const now = new Date().toISOString();
    return getLocalUserRepository(uid).create<Watchlist>('watchlists', {
      name,
      symbols,
      items: symbolsToItems(symbols),
      createdAt: now,
      updatedAt: now,
    });
  }

  const ref = doc(watchlistsCollection(uid));
  await setDoc(ref, {
    name,
    symbols,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const created = await getDoc(ref);
  return toWatchlist(created.id, created.data()!);
}

export async function updateWatchlist(
  uid: string,
  watchlistId: string,
  updates: UpdateWatchlistInput,
  tier: SubscriptionTier = 'free',
): Promise<Watchlist> {
  if (updates.symbols) {
    assertSymbolLimit(updates.symbols.length, tier);
  }

  if (resolveUserDataBackend(uid) === 'local') {
    const current = await getWatchlist(uid, watchlistId);
    if (!current) throw new Error('Watchlist not found.');
    const symbols = updates.symbols ?? current.symbols;
    const localUpdates: Partial<Watchlist> = {
      symbols,
      items: symbolsToItems(symbols),
      updatedAt: new Date().toISOString(),
    };
    if (updates.name !== undefined) localUpdates.name = updates.name.trim();
    return getLocalUserRepository(uid).update<Watchlist>('watchlists', watchlistId, {
      ...localUpdates,
    });
  }

  const ref = watchlistDocRef(uid, watchlistId);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error('Watchlist not found.');
  }

  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.symbols !== undefined) payload.symbols = updates.symbols;

  await updateDoc(ref, payload);

  const updated = await getDoc(ref);
  return toWatchlist(updated.id, updated.data()!);
}

export async function deleteWatchlist(uid: string, watchlistId: string): Promise<void> {
  if (resolveUserDataBackend(uid) === 'local') {
    await getLocalUserRepository(uid).delete('watchlists', watchlistId);
    return;
  }
  await deleteDoc(watchlistDocRef(uid, watchlistId));
}

export async function addSymbolToWatchlist(
  uid: string,
  watchlistId: string,
  symbol: string,
  tier: SubscriptionTier = 'free',
): Promise<Watchlist> {
  const watchlist = await getWatchlist(uid, watchlistId);
  if (!watchlist) throw new Error('Watchlist not found.');

  const normalized = symbol.toUpperCase();
  if (watchlist.symbols.includes(normalized)) {
    return watchlist;
  }

  const newSymbols = [...watchlist.symbols, normalized];
  return updateWatchlist(uid, watchlistId, { symbols: newSymbols }, tier);
}

export async function removeSymbolFromWatchlist(
  uid: string,
  watchlistId: string,
  symbol: string,
): Promise<Watchlist> {
  const watchlist = await getWatchlist(uid, watchlistId);
  if (!watchlist) throw new Error('Watchlist not found.');

  const normalized = symbol.toUpperCase();
  const newSymbols = watchlist.symbols.filter((s) => s !== normalized);
  return updateWatchlist(uid, watchlistId, { symbols: newSymbols });
}
