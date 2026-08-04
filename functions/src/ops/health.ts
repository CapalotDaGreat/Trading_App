import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { requireAppCheck, requireAuth } from '../security';
import { recordDailyCounter } from './aggregates';
import { SERVER_DEFAULT_REMOTE } from './defaults';

const db = () => admin.firestore();

async function maybeAlertSpike(count: number, threshold: number): Promise<void> {
  const webhook = process.env.OPS_ALERT_WEBHOOK_URL?.trim();
  if (!webhook || count < threshold) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `TradeVision ops spike: ${count} security events in the last hour (threshold ${threshold}).`,
      }),
    });
  } catch (error) {
    functions.logger.warn('ops.alert_webhook_failed', { error });
  }
}

function estimateCost(securityEventsLastHour: number): number {
  const functionsInvocations = 50_000 + securityEventsLastHour * 24 * 30;
  const firestoreReads = 200_000;
  const firestoreWrites = 80_000;
  return Number(
    (
      (functionsInvocations / 1_000_000) * 0.4 +
      (firestoreReads / 100_000) * 0.06 +
      (firestoreWrites / 100_000) * 0.18
    ).toFixed(2),
  );
}

export const opsHealthSnapshot = onSchedule(
  {
    schedule: 'every 60 minutes',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async () => {
    const since = admin.firestore.Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
    const snap = await db()
      .collection('securityEvents')
      .where('createdAt', '>=', since)
      .limit(500)
      .get();

    const byReason: Record<string, number> = {};
    let quotaBlocks = 0;
    let appCheckFails = 0;
    let authFails = 0;

    for (const doc of snap.docs) {
      const reason = String(doc.data().reason ?? 'unknown');
      byReason[reason] = (byReason[reason] ?? 0) + 1;
      if (reason === 'quota_exceeded') quotaBlocks += 1;
      if (reason.includes('app_check')) appCheckFails += 1;
      if (reason.includes('auth') || reason.includes('unauthenticated')) authFails += 1;
    }

    const threshold =
      Number(process.env.OPS_SPIKE_SECURITY_PER_HOUR) ||
      SERVER_DEFAULT_REMOTE.spikeAlertSecurityEventsPerHour;

    await db()
      .collection('ops')
      .doc('health')
      .collection('docs')
      .doc('latest')
      .set({
        at: admin.firestore.FieldValue.serverTimestamp(),
        windowHours: 1,
        securityEvents: snap.size,
        quotaBlocks,
        appCheckFails,
        authFails,
        byReason,
        estimatedMonthlyCostUsd: estimateCost(snap.size),
        notes:
          'Cost is a heuristic from event volume — not live GCP Billing. No journal/AI text stored.',
      });

    await recordDailyCounter('security', {
      events: snap.size,
      quotaBlocks,
      appCheckFails,
      authFails,
    });
    await maybeAlertSpike(snap.size, threshold);
    functions.logger.info('ops.health_snapshot', { securityEvents: snap.size });
  },
);

async function assertOpsAdmin(uid: string, token?: Record<string, unknown>): Promise<void> {
  const adminSnap = await db().collection('opsAdmins').doc(uid).get();
  if (!adminSnap.exists && token?.opsAdmin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Ops admin required.');
  }
}

export const getOpsDashboard = onCall(
  { enforceAppCheck: false, timeoutSeconds: 20, memory: '256MiB' },
  async (request) => {
    requireAppCheck(request);
    const uid = requireAuth(request);
    await assertOpsAdmin(uid, request.auth?.token as Record<string, unknown> | undefined);

    const day = new Date().toISOString().slice(0, 10);
    const [latest, daily, ai, subs, flags, remote] = await Promise.all([
      db().collection('ops').doc('health').collection('docs').doc('latest').get(),
      db().collection('ops').doc('aggregates').collection('daily').doc(day).get(),
      db().collection('ops').doc('aggregates').collection('ai').doc(day).get(),
      db().collection('ops').doc('aggregates').collection('subs').doc(day).get(),
      db().collection('ops').doc('config').collection('docs').doc('flags').get(),
      db().collection('ops').doc('config').collection('docs').doc('remote').get(),
    ]);

    return {
      health: latest.data() ?? null,
      aggregates: {
        daily: daily.data() ?? null,
        ai: ai.data() ?? null,
        subs: subs.data() ?? null,
      },
      config: {
        flags: flags.data() ?? null,
        remote: remote.data() ?? null,
      },
      day,
    };
  },
);
