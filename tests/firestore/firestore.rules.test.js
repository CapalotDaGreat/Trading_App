const fs = require('node:fs');
const path = require('node:path');

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const { deleteDoc, doc, getDoc, setDoc, Timestamp } = require('firebase/firestore');

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'tradevision-rules-test',
    firestore: {
      rules: fs.readFileSync(
        path.resolve(__dirname, '../../firebase/rules/firestore.rules'),
        'utf8',
      ),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

function ownerDb(uid = 'owner') {
  return testEnv
    .authenticatedContext(uid, {
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
    })
    .firestore();
}

function userDb(uid, emailVerified, provider = 'password') {
  return testEnv
    .authenticatedContext(uid, {
      email_verified: emailVerified,
      firebase: { sign_in_provider: provider },
    })
    .firestore();
}

const timestamps = () => ({
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

test('allows owner service payloads and rejects cross-user reads', async () => {
  const db = ownerDb();
  const otherDb = ownerDb('other');

  await assertSucceeds(
    setDoc(doc(db, 'users/owner/holdings/h1'), {
      symbol: 'SPY',
      name: 'S&P 500 ETF',
      marketType: 'stocks',
      assetClass: 'etf',
      quantity: 2,
      averageCost: 500,
      currentPrice: 505,
      currency: 'USD',
      side: 'long',
      ...timestamps(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(db, 'users/owner/journal/j1'), {
      symbol: 'SPY',
      direction: 'long',
      entryPrice: 500,
      quantity: 2,
      outcome: 'open',
      tags: [],
      notes: 'Research journal',
      tradedAt: new Date().toISOString(),
      ...timestamps(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(db, 'users/owner/alerts/a1'), {
      symbol: 'SPY',
      condition: 'above',
      targetPrice: 510,
      isActive: true,
      ...timestamps(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(db, 'users/owner/decisionLog/d1'), {
      symbol: 'SPY',
      regime: 'risk-on',
      action: 'researched',
      createdAt: Timestamp.now(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(db, 'userSettings/owner'), {
      theme: 'system',
      updatedAt: Timestamp.now(),
    }),
  );
  await assertFails(getDoc(doc(otherDb, 'users/owner/journal/j1')));
});

test('rejects malformed documents', async () => {
  const db = ownerDb();
  await assertFails(
    setDoc(doc(db, 'users/owner/journal/invalid'), {
      symbol: 'SPY',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }),
  );
});

test('validates onboarding preferences in settings and profiles', async () => {
  const db = ownerDb();
  const preferences = {
    timeBudgetMinutes: 20,
    activationGoal: 'build_decision_discipline',
    selectedUniverse: ['SPY', 'QQQ', 'AAPL'],
  };

  await assertSucceeds(
    setDoc(doc(db, 'userSettings/owner'), {
      theme: 'system',
      preferences,
      hasCompletedOnboarding: true,
      updatedAt: Timestamp.now(),
    }),
  );
  await assertSucceeds(
    setDoc(doc(db, 'users/owner'), {
      email: 'owner@example.com',
      displayName: 'Owner',
      onboardingCompleted: true,
      preferences,
      ...timestamps(),
    }),
  );
  await assertFails(
    setDoc(doc(db, 'userSettings/owner'), {
      theme: 'system',
      preferences: { ...preferences, timeBudgetMinutes: 999 },
      updatedAt: Timestamp.now(),
    }),
  );
  await assertFails(
    setDoc(doc(db, 'userSettings/owner'), {
      theme: 'system',
      preferences: { ...preferences, selectedUniverse: ['SPY', 'QQQ', 123] },
      updatedAt: Timestamp.now(),
    }),
  );
  await assertFails(
    setDoc(doc(db, 'users/owner'), {
      email: 'owner@example.com',
      displayName: 'Owner',
      preferences: { ...preferences, selectedUniverse: ['SPY'] },
      ...timestamps(),
    }),
  );
});

test('keeps subscription documents server-owned and owner-readable', async () => {
  const db = ownerDb();
  const otherDb = ownerDb('other');
  const ref = doc(db, 'subscriptions/owner');

  await assertFails(setDoc(ref, { status: 'active' }));
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'subscriptions/owner'), {
      status: 'active',
      expiresAt: Timestamp.now(),
    });
  });
  await assertSucceeds(getDoc(ref));
  await assertFails(getDoc(doc(otherDb, 'subscriptions/owner')));
});

test('allows verified writes while denying anonymous and unverified writes', async () => {
  const anonymous = userDb('anonymous-user', false, 'anonymous');
  const unverified = userDb('unverified', false);
  const verified = ownerDb('verified');
  const profile = (email, displayName) => ({
    email,
    displayName,
    ...timestamps(),
  });

  await assertFails(
    setDoc(doc(anonymous, 'users/anonymous-user'), profile('anonymous@example.com', 'Anonymous')),
  );
  await assertFails(
    setDoc(doc(unverified, 'users/unverified'), profile('unverified@example.com', 'Unverified')),
  );
  await assertSucceeds(
    setDoc(doc(verified, 'users/verified'), profile('verified@example.com', 'Verified')),
  );
  await assertFails(
    setDoc(doc(verified, 'users/verified'), {
      ...profile('verified@example.com', 'Verified'),
      fcmTokens: ['unbounded-token'],
    }),
  );
});

test('validates owner-scoped device documents and real deletion', async () => {
  const owner = ownerDb();
  const other = ownerDb('other');
  const deviceId = 'device-identifier-1234';
  const device = {
    deviceId,
    token: 'ExponentPushToken[valid-token]',
    platform: 'android',
    deviceName: 'Test device',
    updatedAt: Timestamp.now(),
  };

  await assertSucceeds(setDoc(doc(owner, `users/owner/devices/${deviceId}`), device));
  await assertFails(setDoc(doc(other, `users/owner/devices/${deviceId}`), device));
  await assertFails(
    setDoc(doc(owner, 'users/owner/devices/short'), {
      ...device,
      deviceId: 'short',
    }),
  );
  await assertSucceeds(deleteDoc(doc(owner, `users/owner/devices/${deviceId}`)));
});
