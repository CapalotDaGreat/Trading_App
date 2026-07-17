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

import { requireDb, isFirebaseConfigured } from '@/firebase/config';
import type { PriceAlert } from '@/shared/types/market';

const USERS_COLLECTION = 'users';
const ALERTS_SUBCOLLECTION = 'alerts';

export interface CreateAlertInput {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  note?: string;
}

export interface UpdateAlertInput {
  targetPrice?: number;
  condition?: 'above' | 'below';
  isActive?: boolean;
  note?: string;
}

function alertsCollection(uid: string) {
  return collection(requireDb(), USERS_COLLECTION, uid, ALERTS_SUBCOLLECTION);
}

function alertDocRef(uid: string, alertId: string) {
  return doc(requireDb(), USERS_COLLECTION, uid, ALERTS_SUBCOLLECTION, alertId);
}

function serializeTimestamp(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value);
  return Date.now();
}

function toAlert(id: string, data: DocumentData): PriceAlert & { note?: string } {
  return {
    id,
    symbol: (data.symbol as string) ?? '',
    targetPrice: (data.targetPrice as number) ?? 0,
    condition: (data.condition as PriceAlert['condition']) ?? 'above',
    isActive: (data.isActive as boolean) ?? true,
    createdAt: serializeTimestamp(data.createdAt),
    triggeredAt: data.triggeredAt ? serializeTimestamp(data.triggeredAt) : undefined,
    note: (data.note as string | undefined) ?? undefined,
  };
}

export async function getAlerts(uid: string): Promise<(PriceAlert & { note?: string })[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }
  const q = query(alertsCollection(uid), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => toAlert(docSnap.id, docSnap.data()));
}

export async function createAlert(
  uid: string,
  input: CreateAlertInput,
): Promise<PriceAlert & { note?: string }> {
  const data = {
    symbol: input.symbol.toUpperCase().trim(),
    targetPrice: input.targetPrice,
    condition: input.condition,
    note: input.note ?? '',
    isActive: true,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(alertsCollection(uid), data);

  return {
    id: ref.id,
    symbol: data.symbol,
    targetPrice: data.targetPrice,
    condition: data.condition,
    isActive: true,
    createdAt: Date.now(),
    note: data.note,
  };
}

export async function updateAlert(
  uid: string,
  alertId: string,
  updates: UpdateAlertInput,
): Promise<void> {
  await updateDoc(alertDocRef(uid, alertId), {
    ...updates,
  } as Record<string, unknown>);
}

export async function deleteAlert(uid: string, alertId: string): Promise<void> {
  await deleteDoc(alertDocRef(uid, alertId));
}

export async function toggleAlert(
  uid: string,
  alertId: string,
  isActive: boolean,
): Promise<void> {
  await updateAlert(uid, alertId, { isActive });
}

export async function markAlertTriggered(uid: string, alertId: string): Promise<void> {
  await updateDoc(alertDocRef(uid, alertId), {
    triggeredAt: serverTimestamp(),
    isActive: false,
  });
}
