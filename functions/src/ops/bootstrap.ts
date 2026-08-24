import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

import { clampAiDailyLimit } from '../quota';
import { requireAppCheck, requireAuth, requireOpsAdmin } from '../security';
import { SERVER_DEFAULT_FLAGS, SERVER_DEFAULT_REMOTE } from './defaults';

const callableOpts = {
  enforceAppCheck: false,
  timeoutSeconds: 15,
  memory: '256MiB' as const,
};

function deepMergeFlags(remote: Record<string, unknown> | undefined) {
  const base = JSON.parse(JSON.stringify(SERVER_DEFAULT_FLAGS)) as typeof SERVER_DEFAULT_FLAGS;
  if (!remote) return base;
  for (const key of Object.keys(base) as (keyof typeof base)[]) {
    const patch = remote[key];
    if (patch && typeof patch === 'object') {
      const p = patch as Record<string, unknown>;
      const next = { ...base[key] };
      if (typeof p.enabled === 'boolean') next.enabled = p.enabled;
      if (typeof p.percentage === 'number' && Number.isFinite(p.percentage)) {
        next.percentage = Math.max(0, Math.min(100, Math.round(p.percentage)));
      }
      base[key] = next;
    }
  }
  return base;
}

export function sanitizeFlagsPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(SERVER_DEFAULT_FLAGS) as (keyof typeof SERVER_DEFAULT_FLAGS)[]) {
    const patch = payload[key];
    if (!patch || typeof patch !== 'object') continue;
    const p = patch as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    if (typeof p.enabled === 'boolean') next.enabled = p.enabled;
    if (typeof p.percentage === 'number' && Number.isFinite(p.percentage)) {
      next.percentage = Math.max(0, Math.min(100, Math.round(p.percentage)));
    }
    if (Object.keys(next).length) out[key] = next;
  }
  return out;
}

function clampRemoteNumber(key: keyof typeof SERVER_DEFAULT_REMOTE, val: number): number {
  const def = SERVER_DEFAULT_REMOTE[key];
  if (typeof def !== 'number') return val;
  if (key === 'aiDailyLimitFree' || key === 'aiDailyLimitPremium') {
    return clampAiDailyLimit(val, def);
  }
  if (key === 'schemaVersion') {
    return Math.max(1, Math.min(10, Math.round(val)));
  }
  if (String(key).endsWith('Ms')) {
    return Math.max(5_000, Math.min(3_600_000, Math.round(val)));
  }
  if (String(key).includes('SampleRate') || key === 'analyticsSampleRate' || key === 'perfSampleRate') {
    return Math.max(0, Math.min(1, val));
  }
  return Math.max(0, Math.min(100_000, val));
}

export function sanitizeRemotePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(SERVER_DEFAULT_REMOTE) as (keyof typeof SERVER_DEFAULT_REMOTE)[]) {
    if (!(key in payload)) continue;
    const def = SERVER_DEFAULT_REMOTE[key];
    const val = payload[key];
    if (typeof def === 'number') {
      if (typeof val === 'number' && Number.isFinite(val)) {
        out[key] = clampRemoteNumber(key, val);
      }
    } else if (typeof def === 'boolean') {
      if (typeof val === 'boolean') out[key] = val;
    } else if (typeof def === 'string') {
      if (typeof val === 'string') out[key] = val.slice(0, 500);
    }
  }
  return out;
}

export function mergeRemoteConfig(data: Record<string, unknown> | undefined) {
  return {
    ...SERVER_DEFAULT_REMOTE,
    ...sanitizeRemotePayload(data ?? {}),
  };
}

export const getOpsBootstrap = onCall(callableOpts, async (request) => {
  requireAppCheck(request);
  requireAuth(request);

  const db = admin.firestore();
  const [flagsSnap, remoteSnap] = await Promise.all([
    db.collection('ops').doc('config').collection('docs').doc('flags').get(),
    db.collection('ops').doc('config').collection('docs').doc('remote').get(),
  ]);

  const flags = deepMergeFlags(flagsSnap.data() as Record<string, unknown> | undefined);
  const remote = mergeRemoteConfig(remoteSnap.data() as Record<string, unknown> | undefined);

  const updatedAt = Math.max(
    flagsSnap.updateTime?.toMillis() ?? 0,
    remoteSnap.updateTime?.toMillis() ?? 0,
    Date.now(),
  );
  const etag = `${flagsSnap.updateTime?.toMillis() ?? 0}-${remoteSnap.updateTime?.toMillis() ?? 0}`;

  return {
    schemaVersion: remote.schemaVersion ?? 1,
    etag,
    updatedAt,
    flags,
    remote,
    source: 'remote' as const,
  };
});

/** Admin-only write helpers used by ops/admin via privileged callables. */
export const upsertOpsConfig = onCall(callableOpts, async (request) => {
  requireAppCheck(request);
  const uid = requireAuth(request);
  await requireOpsAdmin(uid, request.auth?.token as Record<string, unknown> | undefined);

  const kind = request.data?.kind;
  const payload = request.data?.payload;
  if ((kind !== 'flags' && kind !== 'remote') || !payload || typeof payload !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'kind and payload required.');
  }

  const sanitized =
    kind === 'flags'
      ? sanitizeFlagsPayload(payload as Record<string, unknown>)
      : sanitizeRemotePayload(payload as Record<string, unknown>);

  if (Object.keys(sanitized).length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No valid config keys in payload.');
  }

  await admin
    .firestore()
    .collection('ops')
    .doc('config')
    .collection('docs')
    .doc(kind)
    .set(
      {
        ...sanitized,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    );

  return { ok: true };
});
