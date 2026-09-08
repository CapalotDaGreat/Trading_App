import { AppState, type AppStateStatus, Platform } from 'react-native';

export type ReachabilityListener = (online: boolean) => void;

const PROBE_MS = 30_000;
const PROBE_TIMEOUT_MS = 3_500;

let listeners = new Set<ReachabilityListener>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let appSub: { remove: () => void } | null = null;
let lastOnline = true;
let inFlight: Promise<boolean> | null = null;
let webBound = false;

async function probeOnlineOnce(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

function emit(online: boolean): void {
  lastOnline = online;
  for (const listener of listeners) listener(online);
}

async function refresh(): Promise<boolean> {
  if (!inFlight) {
    inFlight = probeOnlineOnce().finally(() => {
      inFlight = null;
    });
  }
  const online = await inFlight;
  emit(online);
  return online;
}

function onAppState(status: AppStateStatus): void {
  if (status === 'active') void refresh();
}

function onWebOnline(): void {
  emit(true);
}

function onWebOffline(): void {
  emit(false);
}

function ensureLoop(): void {
  if (intervalId) return;
  void refresh();
  intervalId = setInterval(() => void refresh(), PROBE_MS);
  appSub = AppState.addEventListener('change', onAppState);
  if (Platform.OS === 'web' && typeof window !== 'undefined' && !webBound) {
    window.addEventListener('online', onWebOnline);
    window.addEventListener('offline', onWebOffline);
    webBound = true;
  }
}

function teardownIfIdle(): void {
  if (listeners.size > 0) return;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  appSub?.remove();
  appSub = null;
  if (webBound && typeof window !== 'undefined') {
    window.removeEventListener('online', onWebOnline);
    window.removeEventListener('offline', onWebOffline);
    webBound = false;
  }
}

/** Shared reachability — one probe for QueryProvider and UI offline banners. */
export function subscribeReachability(listener: ReachabilityListener): () => void {
  listeners.add(listener);
  listener(lastOnline);
  ensureLoop();
  return () => {
    listeners.delete(listener);
    teardownIfIdle();
  };
}

export function getLastReachability(): boolean {
  return lastOnline;
}

export async function probeOnline(): Promise<boolean> {
  return refresh();
}

export function getReachabilityListenerCount(): number {
  return listeners.size;
}

/** Test helper. */
export function resetReachabilityForTests(): void {
  listeners = new Set();
  teardownIfIdle();
  lastOnline = true;
  inFlight = null;
}
