import { ALL_LESSONS, getLocalLessons } from '@/features/academy/content';
import { getLessons, shouldFetchRemoteAcademyCatalog } from '@/features/academy/services/academy.service';
import { getDecisionRecords } from '@/features/decision-log/services/decision-log.service';
import { getJournalEntries } from '@/features/journal/services/journal.service';
import { PRACTICE_DRILLS } from '@/features/practice/content/practice-drills';
import { generateSimulationScenario } from '@/features/simulation/services/scenario-generator.service';
import { DEMO_USER_UID, isFirebaseConfigured } from '@/firebase/config';

describe('educational core offline', () => {
  it('does not depend on Firebase for the Academy catalog', () => {
    expect(isFirebaseConfigured()).toBe(false);
    expect(shouldFetchRemoteAcademyCatalog()).toBe(false);
    expect(getLocalLessons(true).length).toBe(ALL_LESSONS.length);
    expect(ALL_LESSONS.length).toBeGreaterThan(10);
  });

  it('loads Academy, Practice, Simulation, Journal, and the decision log without network', async () => {
    const started = Date.now();
    const lessons = await getLessons(true);
    const scenario = generateSimulationScenario({
      userId: DEMO_USER_UID,
      seed: 11,
      now: '2026-09-10T00:00:00.000Z',
    });
    const journal = await getJournalEntries(DEMO_USER_UID);
    const log = await getDecisionRecords(DEMO_USER_UID, 20);
    const elapsed = Date.now() - started;

    expect(lessons.length).toBeGreaterThan(0);
    expect(PRACTICE_DRILLS.length).toBeGreaterThan(0);
    expect(scenario.marketPath.length).toBeGreaterThan(0);
    expect(scenario.seed).toBe(11);
    expect(Array.isArray(journal)).toBe(true);
    expect(Array.isArray(log)).toBe(true);
    expect(elapsed).toBeLessThan(8_000);
  });
});
