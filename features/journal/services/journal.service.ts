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
import { getLocalUserRepository, resolveUserDataBackend } from '@/shared/services/user-data';

import type {
  CreateJournalEntryInput,
  JournalEntry,
  JournalEntryDocument,
  JournalExportRow,
  JournalStats,
  UpdateJournalEntryInput,
} from '../types/journal.types';

const USERS_COLLECTION = 'users';
const JOURNAL_SUBCOLLECTION = 'journal';

function journalCollection(uid: string) {
  return collection(requireDb(), USERS_COLLECTION, uid, JOURNAL_SUBCOLLECTION);
}

function journalDocRef(uid: string, entryId: string) {
  return doc(requireDb(), USERS_COLLECTION, uid, JOURNAL_SUBCOLLECTION, entryId);
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

function calculatePnL(
  direction: JournalEntry['direction'],
  entryPrice: number,
  exitPrice: number,
  quantity: number,
): { pnl: number; pnlPercent: number } {
  const multiplier = direction === 'long' ? 1 : -1;
  const pnl = (exitPrice - entryPrice) * quantity * multiplier;
  const pnlPercent =
    entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 * multiplier : 0;
  return { pnl, pnlPercent };
}

function deriveOutcome(pnl: number): JournalEntry['outcome'] {
  if (pnl > 0) return 'win';
  if (pnl < 0) return 'loss';
  return 'breakeven';
}

function toJournalEntry(id: string, data: DocumentData): JournalEntry {
  return {
    id,
    symbol: (data.symbol as string) ?? '',
    direction: (data.direction as JournalEntry['direction']) ?? 'long',
    entryPrice: (data.entryPrice as number) ?? 0,
    exitPrice: (data.exitPrice as number | undefined) ?? undefined,
    quantity: (data.quantity as number) ?? 0,
    stopLoss: (data.stopLoss as number | undefined) ?? undefined,
    takeProfit: (data.takeProfit as number | undefined) ?? undefined,
    outcome: (data.outcome as JournalEntry['outcome']) ?? 'open',
    pnl: (data.pnl as number | undefined) ?? undefined,
    pnlPercent: (data.pnlPercent as number | undefined) ?? undefined,
    strategy: (data.strategy as string | undefined) ?? undefined,
    tags: (data.tags as string[]) ?? [],
    emotion: (data.emotion as JournalEntry['emotion']) ?? undefined,
    notes: (data.notes as string) ?? '',
    lessonsLearned: (data.lessonsLearned as string | undefined) ?? undefined,
    screenshotUrls: (data.screenshotUrls as string[] | undefined) ?? undefined,
    tradedAt: serializeTimestamp(data.tradedAt),
    closedAt: data.closedAt ? serializeTimestamp(data.closedAt) : undefined,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function toLocalJournalEntry(data: Partial<JournalEntry> & { id: string }): JournalEntry {
  const createdAt =
    typeof data.createdAt === 'number'
      ? new Date(data.createdAt).toISOString()
      : (data.createdAt ?? new Date().toISOString());
  return {
    id: data.id,
    symbol: data.symbol ?? '',
    direction: data.direction ?? 'long',
    entryPrice: data.entryPrice ?? 0,
    exitPrice: data.exitPrice,
    quantity: data.quantity ?? 1,
    stopLoss: data.stopLoss,
    takeProfit: data.takeProfit,
    outcome: data.outcome ?? 'open',
    pnl: data.pnl,
    pnlPercent: data.pnlPercent,
    strategy: data.strategy,
    tags: data.tags ?? [],
    emotion: data.emotion,
    notes: data.notes ?? '',
    lessonsLearned: data.lessonsLearned,
    screenshotUrls: data.screenshotUrls,
    tradedAt: data.tradedAt ?? createdAt,
    closedAt: data.closedAt,
    createdAt,
    updatedAt: data.updatedAt ?? createdAt,
  };
}

export function calculateJournalStats(entries: JournalEntry[]): JournalStats {
  const closed = entries.filter((e) => e.outcome !== 'open' && e.pnl !== undefined);
  const wins = closed.filter((e) => e.outcome === 'win');
  const losses = closed.filter((e) => e.outcome === 'loss');

  const totalPnL = closed.reduce((sum, e) => sum + (e.pnl ?? 0), 0);
  const avgWin = wins.length > 0 ? wins.reduce((sum, e) => sum + (e.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((sum, e) => sum + (e.pnl ?? 0), 0) / losses.length)
      : 0;

  const grossProfit = wins.reduce((sum, e) => sum + (e.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((sum, e) => sum + (e.pnl ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return {
    totalTrades: closed.length,
    winRate: closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    totalPnL,
    avgWin,
    avgLoss,
    profitFactor,
  };
}

export async function getJournalEntries(uid: string): Promise<JournalEntry[]> {
  if (resolveUserDataBackend(uid) === 'local') {
    const entries = await getLocalUserRepository(uid).list<JournalEntry>('journal');
    return entries.map(toLocalJournalEntry).sort((a, b) => b.tradedAt.localeCompare(a.tradedAt));
  }
  const q = query(journalCollection(uid), orderBy('tradedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toJournalEntry(docSnap.id, docSnap.data()));
}

export async function createJournalEntry(
  uid: string,
  input: CreateJournalEntryInput,
): Promise<JournalEntry> {
  const now = new Date().toISOString();
  const tradedAt = input.tradedAt ?? now;

  let pnl: number | undefined;
  let pnlPercent: number | undefined;
  let outcome = input.outcome ?? 'open';

  if (input.exitPrice !== undefined) {
    const calculated = calculatePnL(
      input.direction,
      input.entryPrice,
      input.exitPrice,
      input.quantity,
    );
    pnl = calculated.pnl;
    pnlPercent = calculated.pnlPercent;
    outcome = input.outcome ?? deriveOutcome(pnl);
  }

  const data: JournalEntryDocument = {
    symbol: input.symbol.toUpperCase().trim(),
    direction: input.direction,
    entryPrice: input.entryPrice,
    exitPrice: input.exitPrice,
    quantity: input.quantity,
    stopLoss: input.stopLoss,
    takeProfit: input.takeProfit,
    outcome,
    pnl,
    pnlPercent,
    strategy: input.strategy,
    tags: input.tags ?? [],
    emotion: input.emotion,
    notes: input.notes,
    lessonsLearned: input.lessonsLearned,
    tradedAt,
    closedAt: input.closedAt ?? (input.exitPrice ? now : undefined),
    createdAt: now,
    updatedAt: now,
  };

  if (resolveUserDataBackend(uid) === 'local') {
    return getLocalUserRepository(uid).create<JournalEntry>('journal', data);
  }

  const ref = await addDoc(journalCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    tradedAt: tradedAt,
  });

  return { id: ref.id, ...data };
}

export async function updateJournalEntry(
  uid: string,
  entryId: string,
  updates: UpdateJournalEntryInput,
): Promise<void> {
  if (resolveUserDataBackend(uid) === 'local') {
    await getLocalUserRepository(uid).update<JournalEntry>('journal', entryId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  await updateDoc(journalDocRef(uid, entryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteJournalEntry(uid: string, entryId: string): Promise<void> {
  if (resolveUserDataBackend(uid) === 'local') {
    await getLocalUserRepository(uid).delete('journal', entryId);
    return;
  }
  await deleteDoc(journalDocRef(uid, entryId));
}

export function entriesToExportRows(entries: JournalEntry[]): JournalExportRow[] {
  return entries.map((entry) => ({
    id: entry.id,
    symbol: entry.symbol,
    direction: entry.direction,
    entryPrice: entry.entryPrice,
    exitPrice: entry.exitPrice ?? null,
    quantity: entry.quantity,
    outcome: entry.outcome,
    pnl: entry.pnl ?? null,
    pnlPercent: entry.pnlPercent ?? null,
    strategy: entry.strategy ?? null,
    tags: entry.tags.join('; '),
    notes: entry.notes,
    tradedAt: entry.tradedAt,
    closedAt: entry.closedAt ?? null,
  }));
}

export function exportJournalToCsv(entries: JournalEntry[]): string {
  const rows = entriesToExportRows(entries);
  const headers = [
    'id',
    'symbol',
    'direction',
    'entryPrice',
    'exitPrice',
    'quantity',
    'outcome',
    'pnl',
    'pnlPercent',
    'strategy',
    'tags',
    'notes',
    'tradedAt',
    'closedAt',
  ];

  const escape = (value: string | number | null): string => {
    const str = value === null ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => escape(row[h as keyof JournalExportRow] as string | number | null))
        .join(','),
    ),
  ];

  return lines.join('\n');
}

export function exportJournalToJson(entries: JournalEntry[]): string {
  return JSON.stringify(entriesToExportRows(entries), null, 2);
}
