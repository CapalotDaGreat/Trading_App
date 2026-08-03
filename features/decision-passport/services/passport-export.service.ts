import { Platform, Share } from 'react-native';

import type { DecisionPassportProfile } from '../types/passport.types';

export interface PassportExportPackage {
  status: 'ready';
  suggestedFilename: string;
  sections: string[];
  message: string;
  exportedAt: string;
  schemaVersion: 1;
  purpose: 'decision_passport_process_export';
  notice: string;
  profile: DecisionPassportProfile;
}

/**
 * Structured passport export — process/learning profile only, never a P&L report.
 */
export function buildPassportExportPackage(profile: DecisionPassportProfile): PassportExportPackage {
  const stamp = new Date(profile.generatedAt).toISOString().slice(0, 10);
  return {
    status: 'ready',
    suggestedFilename: `tradevision-decision-passport-${stamp}.json`,
    sections: [
      'Trading Identity',
      'Trading DNA',
      'Learning Journey',
      'Decision Quality Trend',
      'Research Value Trend',
      'Consistency',
      'Achievements',
      'Monthly Summaries',
      'Yearly Summaries',
      'Evolution Timeline',
    ],
    message: profile.exportReady.message,
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    purpose: 'decision_passport_process_export',
    notice:
      'This export is a process and learning profile. It is not a performance, brokerage, or profitability report.',
    profile,
  };
}

/** @deprecated Prefer buildPassportExportPackage */
export function buildPassportExportStub(profile: DecisionPassportProfile): PassportExportPackage {
  return buildPassportExportPackage(profile);
}

export async function sharePassportExport(pkg: PassportExportPackage): Promise<void> {
  const content = JSON.stringify(pkg, null, 2);
  const filename = pkg.suggestedFilename;

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
