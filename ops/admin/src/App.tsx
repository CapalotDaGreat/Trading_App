import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { auth, fetchOpsDashboard, upsertOpsConfig } from './firebase';

type Tab = 'health' | 'flags' | 'remote' | 'ai' | 'analytics' | 'subs' | 'links';

const SENTRY_ORG = import.meta.env.VITE_SENTRY_ORG ?? '';
const SENTRY_PROJECT = import.meta.env.VITE_SENTRY_PROJECT ?? '';
const EAS_PROJECT = import.meta.env.VITE_EAS_PROJECT_URL ?? 'https://expo.dev';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('health');
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchOpsDashboard>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [flagsJson, setFlagsJson] = useState('{}');
  const [remoteJson, setRemoteJson] = useState('{}');

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchOpsDashboard();
      setData(next);
      setFlagsJson(JSON.stringify(next.config.flags ?? {}, null, 2));
      setRemoteJson(JSON.stringify(next.config.remote ?? {}, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void refresh();
  }, [user]);

  const health = data?.health;
  const tabs = useMemo(
    () =>
      [
        ['health', 'Health'],
        ['flags', 'Flags'],
        ['remote', 'Remote Config'],
        ['ai', 'AI Ops'],
        ['analytics', 'Analytics'],
        ['subs', 'Subscriptions'],
        ['links', 'Crashes / Deploy'],
      ] as const,
    [],
  );

  if (!user) {
    return (
      <div className="shell">
        <h1>TradeVision Ops Admin</h1>
        <p className="muted">
          Internal dashboard only. Aggregates never include journals, AI chats, emails, or portfolio
          values. Requires `opsAdmins/{"{uid}"}` allowlist.
        </p>
        <div className="card">
          <div className="row">
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => {
                setError(null);
                void signInWithEmailAndPassword(auth, email, password).catch((err) =>
                  setError(err instanceof Error ? err.message : 'Sign-in failed'),
                );
              }}
            >
              Sign in
            </button>
          </div>
          {error ? <p className="warn">{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>TradeVision Ops Admin</h1>
          <p className="muted">Signed in · aggregates for {data?.day ?? '…'}</p>
        </div>
        <div className="row">
          <button type="button" className="secondary" onClick={() => void refresh()} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="secondary" onClick={() => void signOut(auth)}>
            Sign out
          </button>
        </div>
      </div>

      {error ? <p className="warn">{error}</p> : null}

      <div className="row tabs" style={{ marginBottom: 16 }}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'health' ? (
        <div className="grid">
          <div className="card">
            <div className="muted">Security events (1h)</div>
            <div className="metric">{String(health?.securityEvents ?? '—')}</div>
          </div>
          <div className="card">
            <div className="muted">Quota blocks</div>
            <div className="metric">{String(health?.quotaBlocks ?? '—')}</div>
          </div>
          <div className="card">
            <div className="muted">App Check fails</div>
            <div className="metric">{String(health?.appCheckFails ?? '—')}</div>
          </div>
          <div className="card">
            <div className="muted">Est. monthly cost (heuristic)</div>
            <div className="metric">${String(health?.estimatedMonthlyCostUsd ?? '—')}</div>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="muted">Raw health snapshot</div>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {tab === 'flags' ? (
        <div className="card">
          <p className="muted">
            Edit Firestore-backed flags via privileged callable. Keep `globalKill` false unless
            emergency.
          </p>
          <textarea
            style={{ width: '100%', minHeight: 280, background: '#020617', color: '#e2e8f0' }}
            value={flagsJson}
            onChange={(e) => setFlagsJson(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              try {
                const payload = JSON.parse(flagsJson) as Record<string, unknown>;
                void upsertOpsConfig('flags', payload)
                  .then(() => refresh())
                  .catch((err) => setError(err instanceof Error ? err.message : 'Save failed'));
              } catch {
                setError('Flags JSON invalid');
              }
            }}
          >
            Save flags
          </button>
        </div>
      ) : null}

      {tab === 'remote' ? (
        <div className="card">
          <p className="muted">Remote config values (AI limits, polling, promo copy, sample rates).</p>
          <textarea
            style={{ width: '100%', minHeight: 280, background: '#020617', color: '#e2e8f0' }}
            value={remoteJson}
            onChange={(e) => setRemoteJson(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              try {
                const payload = JSON.parse(remoteJson) as Record<string, unknown>;
                void upsertOpsConfig('remote', payload)
                  .then(() => refresh())
                  .catch((err) => setError(err instanceof Error ? err.message : 'Save failed'));
              } catch {
                setError('Remote JSON invalid');
              }
            }}
          >
            Save remote config
          </button>
        </div>
      ) : null}

      {tab === 'ai' ? (
        <div className="card">
          <div className="muted">AI aggregates today (metadata only — no prompts)</div>
          <pre>{JSON.stringify(data?.aggregates.ai ?? {}, null, 2)}</pre>
        </div>
      ) : null}

      {tab === 'analytics' ? (
        <div className="card">
          <div className="muted">Product analytics aggregates today</div>
          <pre>{JSON.stringify(data?.aggregates.daily ?? {}, null, 2)}</pre>
        </div>
      ) : null}

      {tab === 'subs' ? (
        <div className="card">
          <div className="muted">Subscription funnel aggregates today</div>
          <pre>{JSON.stringify(data?.aggregates.subs ?? {}, null, 2)}</pre>
        </div>
      ) : null}

      {tab === 'links' ? (
        <div className="card">
          <p className="muted">External consoles (no private user data mirrored here).</p>
          <ul>
            <li>
              <a href={EAS_PROJECT} target="_blank" rel="noreferrer">
                EAS / deployments
              </a>
            </li>
            <li>
              <a
                href={
                  SENTRY_ORG && SENTRY_PROJECT
                    ? `https://sentry.io/organizations/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/`
                    : 'https://sentry.io'
                }
                target="_blank"
                rel="noreferrer"
              >
                Sentry crashes & performance
              </a>
            </li>
            <li>
              <a href="https://app.revenuecat.com" target="_blank" rel="noreferrer">
                RevenueCat
              </a>
            </li>
            <li>
              <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
                Firebase console
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
