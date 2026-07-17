import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';

import { startAlertEvaluationLoop } from '../services/alert-evaluator.service';

/** Foreground price-alert evaluator — polls active alerts and fires local notifications. */
export function useAlertEvaluator() {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    return startAlertEvaluationLoop(uid);
  }, [uid]);
}
