import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);

export async function fetchOpsDashboard() {
  const callable = httpsCallable(functions, 'getOpsDashboard');
  const result = await callable({});
  return result.data as {
    health: Record<string, unknown> | null;
    aggregates: {
      daily: Record<string, unknown> | null;
      ai: Record<string, unknown> | null;
      subs: Record<string, unknown> | null;
    };
    config: {
      flags: Record<string, unknown> | null;
      remote: Record<string, unknown> | null;
    };
    day: string;
  };
}

export async function upsertOpsConfig(kind: 'flags' | 'remote', payload: Record<string, unknown>) {
  const callable = httpsCallable(functions, 'upsertOpsConfig');
  await callable({ kind, payload });
}
