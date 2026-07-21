import { canUseFirestore } from '@/firebase/config';

export type UserDataBackend = 'firestore' | 'local';

/** Firebase-authenticated users use Firestore; demo/guest users are uid-scoped locally. */
export function resolveUserDataBackend(uid: string | null | undefined): UserDataBackend {
  return canUseFirestore(uid) ? 'firestore' : 'local';
}
