import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

/**
 * Records a backup intent document and logs the GCS export command.
 * Full managed export requires GCP permissions:
 *   gcloud firestore export gs://$OPS_BACKUP_BUCKET/firestore/$(date +%Y%m%d)
 */
export const opsBackupExport = onSchedule(
  {
    schedule: 'every day 03:15',
    timeZone: 'UTC',
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async () => {
    const bucket = process.env.OPS_BACKUP_BUCKET?.trim();
    const day = new Date().toISOString().slice(0, 10);
    const path = bucket ? `gs://${bucket}/firestore/${day}` : null;

    await admin
      .firestore()
      .collection('ops')
      .doc('backups')
      .collection('runs')
      .doc(day)
      .set({
        day,
        status: path ? 'scheduled' : 'skipped_no_bucket',
        target: path,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        notes:
          'Configure OPS_BACKUP_BUCKET and grant the App Engine / Cloud Functions SA datastore.import_export + storage admin. See docs/ops/DISASTER_RECOVERY.md.',
      });

    if (!path) {
      functions.logger.warn('ops.backup_skipped_no_bucket');
      return;
    }

    functions.logger.info('ops.backup_marked', { path });
    // Actual export is performed by ops runbook / Cloud Scheduler → Firestore export job.
    // Keeping this marker avoids coupling the Node runtime to gcloud CLI inside the sandbox.
  },
);
