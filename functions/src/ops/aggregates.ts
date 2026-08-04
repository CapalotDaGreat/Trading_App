import * as admin from 'firebase-admin';

const db = () => admin.firestore();

function dayKey(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export async function recordDailyCounter(
  kind: 'daily' | 'ai' | 'subs' | 'security' | 'perf',
  fields: Record<string, number>,
  atMs = Date.now(),
): Promise<void> {
  const day = dayKey(atMs);
  const docRef = db().collection('ops').doc('aggregates').collection(kind).doc(day);
  const updates: Record<string, admin.firestore.FieldValue | string> = {
    day,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  for (const [key, value] of Object.entries(fields)) {
    updates[key] = admin.firestore.FieldValue.increment(value);
  }
  await docRef.set(updates, { merge: true });
}
