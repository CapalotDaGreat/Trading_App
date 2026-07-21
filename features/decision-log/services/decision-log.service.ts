import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';

import { isFirebaseConfigured, requireDb } from '@/firebase/config';

export type DecisionAction =
  | 'researched'
  | 'skipped'
  | 'journaled'
  | 'opened'
  | 'viewed'
  | 'ignored'
  | 'invalidated'
  | 'completed'
  | 'brief_opened'
  | 'alert_triggered'
  | 'portfolio_reviewed'
  | 'ai_opened'
  | 'replay_completed'
  | 'checklist_done'
  | 'lab_opened'
  | 'lab_closed';

export interface DecisionRecord {
  id: string;
  symbol: string;
  regime: string;
  setupScore?: number;
  bias?: string;
  invalidation?: string;
  action: DecisionAction;
  note?: string;
  createdAt: number;
  /** Optional Research Value at event time (process, not P&L). */
  researchValueScore?: number;
  /** Optional Decision Quality at event time. */
  decisionQualityScore?: number;
  risk?: 'low' | 'medium' | 'high';
  /** Stable key used to make cross-feature event writes idempotent. */
  eventKey?: string;
}

export interface DecisionTimelineEvent {
  id: string;
  symbol: string;
  action: DecisionAction;
  label: string;
  at: number;
  note?: string;
}

export interface DecisionLogSummary {
  total: number;
  researched: number;
  skipped: number;
  ignored: number;
  journaled: number;
  processScore: number;
  insight?: string;
}

const LOCAL_KEY = 'tradevision-decision-log';
const USERS = 'users';
const LOG = 'decisionLog';

function toRecord(id: string, data: DocumentData): DecisionRecord {
  const createdAt =
    data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt
      ? (data.createdAt as { toDate: () => Date }).toDate().getTime()
      : typeof data.createdAt === 'number'
        ? data.createdAt
        : Date.now();

  return {
    id,
    symbol: (data.symbol as string) ?? '',
    regime: (data.regime as string) ?? '',
    setupScore: data.setupScore as number | undefined,
    bias: data.bias as string | undefined,
    invalidation: data.invalidation as string | undefined,
    action: (data.action as DecisionAction) ?? 'opened',
    note: data.note as string | undefined,
    createdAt,
    researchValueScore: data.researchValueScore as number | undefined,
    decisionQualityScore: data.decisionQualityScore as number | undefined,
    risk: data.risk as DecisionRecord['risk'] | undefined,
    eventKey: data.eventKey as string | undefined,
  };
}

async function loadLocal(): Promise<DecisionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DecisionRecord[];
  } catch {
    return [];
  }
}

async function saveLocal(records: DecisionRecord[]): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(records.slice(0, 200)));
}

export async function appendDecisionRecord(
  uid: string | null | undefined,
  input: Omit<DecisionRecord, 'id' | 'createdAt'>,
): Promise<DecisionRecord> {
  const record: DecisionRecord = {
    ...input,
    id: `local-${Date.now()}`,
    createdAt: Date.now(),
  };

  if (uid && isFirebaseConfigured()) {
    if (input.eventKey) {
      const stableId = input.eventKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 180);
      const stableRef = doc(requireDb(), USERS, uid, LOG, stableId);
      const existing = await getDoc(stableRef);
      if (existing.exists()) return toRecord(existing.id, existing.data());
      await setDoc(stableRef, {
        ...input,
        createdAt: serverTimestamp(),
      });
      return { ...record, id: stableId };
    }
    const ref = await addDoc(collection(requireDb(), USERS, uid, LOG), {
      ...input,
      createdAt: serverTimestamp(),
    });
    return { ...record, id: ref.id };
  }

  const existing = await loadLocal();
  const duplicate = input.eventKey
    ? existing.find((item) => item.eventKey === input.eventKey)
    : undefined;
  if (duplicate) return duplicate;
  existing.unshift(record);
  await saveLocal(existing);
  return record;
}

export async function getDecisionRecords(
  uid: string | null | undefined,
  max = 50,
): Promise<DecisionRecord[]> {
  if (uid && isFirebaseConfigured()) {
    const q = query(
      collection(requireDb(), USERS, uid, LOG),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toRecord(d.id, d.data()));
  }

  const local = await loadLocal();
  return local.slice(0, max);
}

export function summarizeDecisionLog(records: DecisionRecord[]): DecisionLogSummary {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const seenEventKeys = new Set<string>();
  const recent = records.filter((record) => {
    if (record.createdAt < weekAgo) return false;
    if (!record.eventKey) return true;
    if (seenEventKeys.has(record.eventKey)) return false;
    seenEventKeys.add(record.eventKey);
    return true;
  });

  const researched = recent.filter((r) => r.action === 'researched').length;
  const skipped = recent.filter((r) => r.action === 'skipped').length;
  const ignored = recent.filter((r) => r.action === 'ignored').length;
  const journaled = recent.filter((r) => r.action === 'journaled').length;
  const total = recent.length;

  const discipline = total > 0 ? Math.round(((skipped + ignored) / total) * 30) : 0;
  const followThrough = total > 0 ? Math.round((journaled / total) * 40) : 0;
  const engagement = total > 0 ? Math.round((researched / total) * 30) : 0;
  const processScore = Math.min(
    100,
    discipline + followThrough + engagement + (total > 3 ? 10 : 0),
  );

  let insight: string | undefined;
  if (skipped + ignored >= 3 && total >= 5) {
    insight = `You passed on ${skipped + ignored} low-conviction ideas this week — good discipline.`;
  } else if (journaled >= 2) {
    insight = `${journaled} journaled decisions — process score trending up.`;
  } else if (total === 0) {
    insight = 'Log decisions as you research setups to build your process score.';
  }

  return { total, researched, skipped, ignored, journaled, processScore, insight };
}

/** Counts explicit attention outcomes, excluding passive opened/viewed telemetry. */
export function countExplicitDecisionOutcomes(records: DecisionRecord[], since: number): number {
  const seenEventKeys = new Set<string>();
  return records.filter((record) => {
    if (record.createdAt < since) return false;
    if (!['researched', 'skipped', 'ignored'].includes(record.action)) return false;
    if (!record.eventKey) return true;
    if (seenEventKeys.has(record.eventKey)) return false;
    seenEventKeys.add(record.eventKey);
    return true;
  }).length;
}

const ACTION_LABELS: Record<DecisionAction, string> = {
  viewed: 'Viewed setup',
  opened: 'Opened setup',
  researched: 'Researched',
  ignored: 'Ignored',
  skipped: 'Skipped',
  journaled: 'Journal written',
  invalidated: 'Invalidated',
  completed: 'Completed',
  brief_opened: "Opened Today's Brief",
  alert_triggered: 'Alert triggered',
  portfolio_reviewed: 'Portfolio reviewed',
  ai_opened: 'AI recommendation opened',
  replay_completed: 'Replay completed',
  checklist_done: 'Checklist completed',
  lab_opened: 'Decision Lab opened',
  lab_closed: 'Decision Lab closed',
};

export function decisionActionLabel(action: DecisionAction): string {
  return ACTION_LABELS[action] ?? action;
}

/** Chronological timeline for a symbol (or all symbols if omitted). */
export function buildDecisionTimeline(
  records: DecisionRecord[],
  symbol?: string,
): DecisionTimelineEvent[] {
  const filtered = symbol
    ? records.filter((r) => r.symbol.toUpperCase() === symbol.toUpperCase())
    : records;

  return [...filtered]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r) => ({
      id: r.id,
      symbol: r.symbol,
      action: r.action,
      label: ACTION_LABELS[r.action] ?? r.action,
      at: r.createdAt,
      note: r.note,
    }));
}

export function filterRecordsByRange(
  records: DecisionRecord[],
  fromMs: number,
  toMs: number,
): DecisionRecord[] {
  return records.filter((r) => r.createdAt >= fromMs && r.createdAt <= toMs);
}
