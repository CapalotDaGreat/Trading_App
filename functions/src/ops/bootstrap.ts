import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';

import { requireAppCheck, requireAuth } from '../security';
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
      base[key] = { ...base[key], ...(patch as object) };
    }
  }
  return base;
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
  const remote = {
    ...SERVER_DEFAULT_REMOTE,
    ...(remoteSnap.data() ?? {}),
  };

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
  const adminSnap = await admin.firestore().collection('opsAdmins').doc(uid).get();
  if (!adminSnap.exists && request.auth?.token?.opsAdmin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Ops admin required.');
  }

  const kind = request.data?.kind;
  const payload = request.data?.payload;
  if ((kind !== 'flags' && kind !== 'remote') || !payload || typeof payload !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'kind and payload required.');
  }

  await admin
    .firestore()
    .collection('ops')
    .doc('config')
    .collection('docs')
    .doc(kind)
    .set(
      {
        ...payload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    );

  return { ok: true };
});
