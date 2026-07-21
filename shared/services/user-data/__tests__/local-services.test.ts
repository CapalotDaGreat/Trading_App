/* eslint-disable import/first */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('@/firebase/config', () => ({
  canUseFirestore: jest.fn(() => false),
  isFirebaseConfigured: jest.fn(() => false),
  requireDb: jest.fn(),
  DEMO_USER_UID: 'demo-guest',
}));

import {
  createAlert,
  deleteAlert,
  getAlerts,
  markAlertTriggered,
} from '@/features/alerts/services/alert.service';
import {
  appendDecisionRecord,
  getDecisionRecords,
} from '@/features/decision-log/services/decision-log.service';
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  updateJournalEntry,
} from '@/features/journal/services/journal.service';
import {
  ensureDemoSeedData,
  resetDemoSeedData,
} from '@/features/onboarding/services/demo-seed.service';
import {
  createHolding,
  deleteHolding,
  getHoldings,
  updateHolding,
} from '@/features/portfolio/services/portfolio.service';
import {
  deleteUserProfile,
  getUserProfile,
  updateUserProfile,
} from '@/features/profile/services/profile.service';
import {
  addSymbolToWatchlist,
  deleteWatchlist,
  getWatchlists,
} from '@/features/watchlists/services/watchlist.service';

const UID = 'demo-guest';

describe('local feature services', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('provides a coherent idempotent demo seed and selective reset', async () => {
    await AsyncStorage.setItem('tradevision-settings', 'preserved');
    await ensureDemoSeedData(UID);
    await ensureDemoSeedData(UID);

    expect((await getWatchlists(UID))[0]?.symbols).toEqual(
      expect.arrayContaining(['NVDA', 'AAPL', 'SPY']),
    );
    expect(await getJournalEntries(UID)).toHaveLength(2);
    expect((await getHoldings(UID))[0]).toMatchObject({ symbol: 'AAPL', currentPrice: 225 });
    expect((await getAlerts(UID))[0]).toMatchObject({ symbol: 'NVDA', isActive: true });
    expect(await getDecisionRecords(UID)).toHaveLength(3);

    await resetDemoSeedData(UID);
    expect(await AsyncStorage.getItem('tradevision-settings')).toBe('preserved');
    expect(await getHoldings(UID)).toEqual([]);
  });

  it('supports local CRUD and decision event-key dedupe across services', async () => {
    await ensureDemoSeedData(UID);

    const watchlist = (await getWatchlists(UID))[0]!;
    await addSymbolToWatchlist(UID, watchlist.id, 'MSFT', 'premium');
    expect((await getWatchlists(UID))[0]?.symbols).toContain('MSFT');
    await deleteWatchlist(UID, watchlist.id);
    expect(await getWatchlists(UID)).toEqual([]);

    const journal = await createJournalEntry(UID, {
      symbol: 'AAPL',
      direction: 'long',
      entryPrice: 100,
      quantity: 2,
      notes: 'Local test',
    });
    await updateJournalEntry(UID, journal.id, { notes: 'Updated locally' });
    expect((await getJournalEntries(UID)).find((entry) => entry.id === journal.id)?.notes).toBe(
      'Updated locally',
    );
    await deleteJournalEntry(UID, journal.id);

    const holding = await createHolding(UID, {
      symbol: 'MSFT',
      name: 'Microsoft',
      marketType: 'stocks',
      assetClass: 'equity',
      quantity: 3,
      averageCost: 400,
      currentPrice: 400,
    });
    await updateHolding(UID, holding.id, { quantity: 4 });
    expect((await getHoldings(UID)).find((item) => item.id === holding.id)?.quantity).toBe(4);
    await deleteHolding(UID, holding.id);

    const alert = await createAlert(UID, {
      symbol: 'AAPL',
      targetPrice: 250,
      condition: 'above',
    });
    await markAlertTriggered(UID, alert.id);
    expect((await getAlerts(UID)).find((item) => item.id === alert.id)).toMatchObject({
      isActive: false,
      triggeredAt: expect.any(Number),
    });
    await deleteAlert(UID, alert.id);

    expect((await getUserProfile(UID))?.displayName).toBe('Demo Trader');
    await updateUserProfile(UID, { displayName: 'Local Trader' });
    expect((await getUserProfile(UID))?.displayName).toBe('Local Trader');
    await deleteUserProfile(UID);

    const input = {
      symbol: 'AAPL',
      regime: 'trend',
      action: 'researched' as const,
      eventKey: 'integration:dedupe',
    };
    const [first, second] = await Promise.all([
      appendDecisionRecord(UID, input),
      appendDecisionRecord(UID, input),
    ]);
    expect(second.id).toBe(first.id);
    expect(
      (await getDecisionRecords(UID, 200)).filter(
        (record) => record.eventKey === 'integration:dedupe',
      ),
    ).toHaveLength(1);
  });
});
