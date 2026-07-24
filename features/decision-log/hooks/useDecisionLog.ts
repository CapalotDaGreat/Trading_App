import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';

import {
  appendDecisionRecord,
  getDecisionRecords,
  summarizeDecisionLog,
  type DecisionAction,
  type DecisionLogSummary,
  type DecisionRecord,
} from '../services/decision-log.service';

export const decisionLogKeys = {
  all: ['decision-log'] as const,
  list: (uid?: string) => ['decision-log', uid ?? 'guest'] as const,
  summary: (uid?: string) => ['decision-log', 'summary', uid ?? 'guest'] as const,
};

export function useDecisionLog() {
  const { user } = useAuth();
  const uid = user?.uid;

  const query = useQuery({
    queryKey: decisionLogKeys.list(uid),
    queryFn: () => getDecisionRecords(uid),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  const summaryQuery = useQuery({
    queryKey: decisionLogKeys.summary(uid),
    queryFn: async (): Promise<DecisionLogSummary> =>
      summarizeDecisionLog(await getDecisionRecords(uid)),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  return {
    records: query.data as DecisionRecord[] | undefined,
    summary: summaryQuery.data as DecisionLogSummary | undefined,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useAppendDecisionRecord() {
  const { user } = useAuth();
  const uid = user?.uid;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      symbol: string;
      regime: string;
      action: DecisionAction;
      setupScore?: number;
      bias?: string;
      invalidation?: string;
      note?: string;
      researchValueScore?: number;
      decisionQualityScore?: number;
      risk?: DecisionRecord['risk'];
      eventKey?: string;
    }) => appendDecisionRecord(uid, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: decisionLogKeys.list(uid) });
      void qc.invalidateQueries({ queryKey: decisionLogKeys.summary(uid) });
      void qc.invalidateQueries({ queryKey: ['decision-replay'] });
      void qc.invalidateQueries({ queryKey: ['decision-heatmap'] });
      void qc.invalidateQueries({ queryKey: ['decision-passport'] });
    },
  });
}
