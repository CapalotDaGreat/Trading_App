import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_TAPE_KEY = 'tradevision-decision-replay-demo-seed-v1';
const LOCAL_LOG_KEY = 'tradevision-decision-log';

/**
 * Seeds a short labelled demo decision tape once so Expo Go / guest users
 * can experience Process Tape. Events are process footage only —
 * no fabricated candle/price series.
 */
export async function ensureDemoDecisionTape(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(DEMO_TAPE_KEY);
    if (done === '1') return;

    const now = Date.now();
    const day = new Date();
    day.setHours(8, 10, 0, 0);
    let origin = day.getTime();
    if (origin > now || origin < now - 86_400_000) {
      origin = now - 90 * 60_000;
    }

    const seeded = [
      {
        id: `demo-tape-0-${origin}`,
        symbol: '',
        regime: 'trending',
        action: 'brief_opened',
        note: 'Morning brief opened',
        createdAt: origin,
      },
      {
        id: `demo-tape-1-${origin}`,
        symbol: 'BTC/USD',
        regime: 'trending',
        action: 'researched',
        note: 'Structure + checklist pass',
        setupScore: 72,
        researchValueScore: 78,
        decisionQualityScore: 68,
        risk: 'medium',
        invalidation: 'Below prior day low',
        createdAt: origin + 8 * 60_000,
      },
      {
        id: `demo-tape-2-${origin}`,
        symbol: 'NVDA',
        regime: 'trending',
        action: 'ignored',
        note: 'High RVS but outside time budget',
        setupScore: 74,
        researchValueScore: 81,
        decisionQualityScore: 55,
        risk: 'high',
        createdAt: origin + 16 * 60_000,
      },
      {
        id: `demo-tape-3-${origin}`,
        symbol: 'BTC/USD',
        regime: 'high_volatility',
        action: 'invalidated',
        note: 'Broke invalidation level',
        setupScore: 40,
        researchValueScore: 35,
        decisionQualityScore: 70,
        risk: 'high',
        invalidation: 'Below prior day low',
        createdAt: origin + 54 * 60_000,
      },
      {
        id: `demo-tape-4-${origin}`,
        symbol: 'BTC/USD',
        regime: 'high_volatility',
        action: 'journaled',
        note: 'Logged skip after invalidation — process win',
        setupScore: 70,
        researchValueScore: 40,
        decisionQualityScore: 82,
        createdAt: origin + 70 * 60_000,
      },
    ];

    let existing: unknown[] = [];
    try {
      const raw = await AsyncStorage.getItem(LOCAL_LOG_KEY);
      if (raw) existing = JSON.parse(raw) as unknown[];
    } catch {
      existing = [];
    }

    const others = (existing as { id?: string }[]).filter(
      (r) => !String(r.id ?? '').startsWith('demo-tape-'),
    );
    await AsyncStorage.setItem(LOCAL_LOG_KEY, JSON.stringify([...seeded, ...others].slice(0, 200)));
    await AsyncStorage.setItem(DEMO_TAPE_KEY, '1');
  } catch {
    // non-blocking
  }
}
