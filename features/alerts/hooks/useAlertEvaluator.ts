import { useEffect } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';

import {
  registerAlertBackgroundTask,
  unregisterAlertBackgroundTask,
} from '../services/alert-background.task';
import { startAlertEvaluationLoop } from '../services/alert-evaluator.service';

/** Foreground ~45s poll + optional OS-scheduled background evaluation when capable. */
export function useAlertEvaluator() {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) {
      void unregisterAlertBackgroundTask();
      return;
    }

    const stopForeground = startAlertEvaluationLoop(uid);
    void registerAlertBackgroundTask(uid);

    return () => {
      stopForeground();
    };
  }, [uid]);
}
