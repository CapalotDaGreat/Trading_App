import type { DecisionPassportProfile } from '../types/passport.types';

export interface PassportExportStub {
  status: 'coming_soon';
  suggestedFilename: string;
  sections: string[];
  message: string;
}

/**
 * PDF export placeholder — structures the payload for a future native/PDF pipeline.
 * Does not generate a file yet (Expo SDK 54 production stub).
 */
export function buildPassportExportStub(profile: DecisionPassportProfile): PassportExportStub {
  const stamp = new Date(profile.generatedAt).toISOString().slice(0, 10);
  return {
    status: 'coming_soon',
    suggestedFilename: `tradevision-decision-passport-${stamp}.pdf`,
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
  };
}
