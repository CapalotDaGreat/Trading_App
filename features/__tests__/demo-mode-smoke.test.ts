/**
 * End-to-end demo-mode smoke: exercises the core Decision OS services a guest
 * user hits on first launch. Runs under Jest (AsyncStorage mocked).
 */
import { ensureDemoSeedData } from '@/features/onboarding/services/demo-seed.service';
import { ensureDemoDecisionTape } from '@/features/decision-replay/services/demo-tape.service';
import {
  buildDecisionBrief,
} from '@/features/decision/services/decision-engine.service';
import { buildDecisionReplaySession } from '@/features/decision-replay/services/decision-replay.service';
import { getDecisionRecords } from '@/features/decision-log/services/decision-log.service';
import { getWatchlists } from '@/features/watchlists/services/watchlist.service';
import { getJournalEntries } from '@/features/journal/services/journal.service';
import { getHoldings } from '@/features/portfolio/services/portfolio.service';
import { DEMO_USER_UID, isFirebaseConfigured } from '@/firebase/config';
import {
  buildLabAiCritique,
  buildThesisChecklist,
  computeRiskReward,
  isThesisComplete,
} from '@/features/decision-lab/services/lab-thesis.service';
import { buildPersonalizedCurriculum } from '@/features/academy/services/curriculum.service';
import { buildPersonalIntelligence } from '@/features/personal-intelligence/services/personal-intelligence.service';
import { loadTraderMemory } from '@/features/decision/services/trader-intelligence.service';
import type { LabThesis } from '@/features/decision-lab/types/lab.types';

jest.setTimeout(45_000);

describe('demo mode smoke (Expo Go guest path)', () => {
  it('boots without Firebase and seeds usable local data', async () => {
    expect(isFirebaseConfigured()).toBe(false);

    await ensureDemoSeedData(DEMO_USER_UID);
    await ensureDemoDecisionTape();

    const [watchlists, journal, holdings, log] = await Promise.all([
      getWatchlists(DEMO_USER_UID),
      getJournalEntries(DEMO_USER_UID),
      getHoldings(DEMO_USER_UID),
      getDecisionRecords(DEMO_USER_UID),
    ]);

    expect(watchlists.length).toBeGreaterThan(0);
    expect(watchlists[0].symbols.length).toBeGreaterThan(0);
    expect(journal.length).toBeGreaterThan(0);
    expect(holdings.length).toBeGreaterThan(0);
    expect(log.length).toBeGreaterThan(0);
  });

  it('builds Today brief, radar, regime, and research queue quickly', async () => {
    const symbols = ['NVDA', 'AAPL', 'SPY'];
    const started = Date.now();
    const brief = await buildDecisionBrief({
      watchlistSymbols: symbols,
      portfolioChangePercent: 0.5,
      portfolioSymbols: ['AAPL'],
      uid: DEMO_USER_UID,
      timeBudgetMinutes: 20,
    });
    const elapsed = Date.now() - started;

    expect(brief.topSetups.length).toBeGreaterThan(0);
    expect(brief.headline.length).toBeGreaterThan(0);
    expect(brief.regime).toBeTruthy();
    expect(elapsed).toBeLessThan(25_000);

    expect((brief.researchQueue ?? []).length + brief.topSetups.length).toBeGreaterThan(0);
  });

  it('builds Decision Replay session from seeded tape', async () => {
    const records = await getDecisionRecords(DEMO_USER_UID);
    const session = buildDecisionReplaySession({
      records,
      range: 'week',
    });
    expect(session.frames.length).toBeGreaterThan(0);
  });

  it('runs Lab thesis critique and Academy curriculum without throwing', () => {
    const entryLow = 190;
    const entryHigh = 192;
    const entry = (entryLow + entryHigh) / 2;
    const stopLoss = 185;
    const target = 205;
    const riskReward = computeRiskReward('long', entry, stopLoss, target);
    const checklist = buildThesisChecklist({
      bias: 'long',
      entryLow,
      entryHigh,
      stopLoss,
      target,
      catalyst: 'Earnings follow-through',
      invalidation: 'Daily close below 185',
      confidence: 70,
      riskReward,
      academyChecklistDone: true,
    });

    const thesis: LabThesis = {
      id: 'smoke-thesis',
      symbol: 'AAPL',
      bias: 'long',
      entryLow,
      entryHigh,
      stopLoss,
      target,
      riskReward,
      catalyst: 'Earnings follow-through',
      invalidation: 'Daily close below 185',
      confidence: 70,
      checklist,
      scenarioId: 'trend_following',
      notes: '',
      createdAt: Date.now(),
    };

    expect(isThesisComplete(checklist)).toBe(true);
    const critique = buildLabAiCritique({
      thesis,
      regime: 'trending',
      holdings: [],
    });
    expect(critique.overall).toBeTruthy();
    expect(critique.summary.length).toBeGreaterThan(0);

    const curriculum = buildPersonalizedCurriculum({
      isRead: () => false,
      isPracticed: () => false,
    });
    expect(curriculum.length).toBeGreaterThan(0);
  });

  it('builds personal intelligence snapshot even with empty records', async () => {
    const memory = await loadTraderMemory();
    const intel = buildPersonalIntelligence({
      memory,
      records: [],
    });
    expect(intel).toBeTruthy();
    expect(intel.dna).toBeTruthy();
  });
});
