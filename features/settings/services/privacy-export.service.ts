import { Platform, Share } from 'react-native';

import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { getDecisionRecords } from '@/features/decision-log/services/decision-log.service';
import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';
import { loadTraderMemory } from '@/features/decision/services/trader-intelligence.service';
import {
  exportJournalToJson,
  getJournalEntries,
} from '@/features/journal/services/journal.service';
import { settingsService } from '@/features/settings/services/settings.service';
import { DEMO_USER_UID } from '@/firebase/config';

export interface PrivacyDataExportPackage {
  exportedAt: string;
  schemaVersion: 1;
  purpose: 'data_subject_access_request';
  notice: string;
  account: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
  };
  settings: ReturnType<typeof settingsService.getSettings>;
  privacy: ReturnType<typeof settingsService.getPrivacySettings>;
  notifications: ReturnType<typeof settingsService.getNotificationSettings>;
  journalJson: string;
  decisionLog: Awaited<ReturnType<typeof getDecisionRecords>>;
  traderMemory: Awaited<ReturnType<typeof loadTraderMemory>>;
  passport: ReturnType<ReturnType<typeof useDecisionPassportStore.getState>['getSnapshot']>;
  academyLessonIdsCompleted: string[];
}

/**
 * Build a portable JSON export of data available on-device / via current session.
 * Full cloud archive (Storage blobs) still requires a Cloud Function for complete DSAR packages.
 */
export async function buildPrivacyDataExport(input: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<PrivacyDataExportPackage> {
  const uid = input.uid || DEMO_USER_UID;
  const [journalEntries, decisionLog, traderMemory] = await Promise.all([
    getJournalEntries(uid).catch(() => []),
    getDecisionRecords(uid, 200).catch(() => []),
    loadTraderMemory(uid),
  ]);

  const lessons = useAcademyProgressStore.getState().lessons;
  const academyLessonIdsCompleted = Object.entries(lessons)
    .filter(([, progress]) => progress.read || progress.completed)
    .map(([id]) => id);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    purpose: 'data_subject_access_request',
    notice:
      'This package contains data available to the signed-in session on this device. It is not a profitability report. Cloud Storage media and server-only logs may require a privacy@tradevision.ai request for a complete archive.',
    account: {
      uid,
      email: input.email ?? null,
      displayName: input.displayName ?? null,
    },
    settings: settingsService.getSettings(),
    privacy: settingsService.getPrivacySettings(),
    notifications: settingsService.getNotificationSettings(),
    journalJson: exportJournalToJson(journalEntries),
    decisionLog,
    traderMemory,
    passport: useDecisionPassportStore.getState().getSnapshot(),
    academyLessonIdsCompleted,
  };
}

export async function sharePrivacyDataExport(pkg: PrivacyDataExportPackage): Promise<void> {
  const content = JSON.stringify(pkg, null, 2);
  const filename = `tradevision-privacy-export-${pkg.exportedAt.slice(0, 10)}.json`;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    title: filename,
    message: content,
  });
}
