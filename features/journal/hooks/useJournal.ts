import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform, Share } from 'react-native';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { appendDecisionRecord } from '@/features/decision-log/services/decision-log.service';
import { canAccessFeature } from '@/shared/constants/subscription';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import {
  calculateJournalStats,
  createJournalEntry,
  deleteJournalEntry,
  exportJournalToCsv,
  exportJournalToJson,
  getJournalEntries,
  updateJournalEntry,
} from '../services/journal.service';
import type { CreateJournalEntryInput, UpdateJournalEntryInput } from '../types/journal.types';

const journalQueryKey = (uid: string | undefined) => ['journal', uid] as const;

export function useJournal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uid = user?.uid;
  const tier = useSubscriptionStore((s) => s.tier);
  const canExport = canAccessFeature(tier, 'exportData');

  const entriesQuery = useQuery({
    queryKey: journalQueryKey(uid),
    queryFn: () => getJournalEntries(uid!),
    enabled: Boolean(uid),
  });

  const entries = entriesQuery.data ?? [];
  const stats = calculateJournalStats(entries);

  const createMutation = useMutation({
    mutationFn: (input: CreateJournalEntryInput) => createJournalEntry(uid!, input),
    onSuccess: (entry) => {
      void appendDecisionRecord(uid, {
        symbol: entry.symbol,
        regime: 'journal',
        action: 'journaled',
        note: entry.notes,
        eventKey: `journal:${entry.id}`,
      });
      void queryClient.invalidateQueries({ queryKey: journalQueryKey(uid) });
      void queryClient.invalidateQueries({ queryKey: ['decision-log'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      entryId,
      updates,
    }: {
      entryId: string;
      updates: UpdateJournalEntryInput;
    }) => updateJournalEntry(uid!, entryId, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalQueryKey(uid) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteJournalEntry(uid!, entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: journalQueryKey(uid) });
    },
  });

  const exportJournal = async (format: 'csv' | 'json'): Promise<void> => {
    if (!canExport) {
      throw new Error('Journal export requires a Premium subscription.');
    }

    const content = format === 'csv' ? exportJournalToCsv(entries) : exportJournalToJson(entries);
    const filename = `tradevision-journal-${Date.now()}.${format}`;

    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    await Share.share({
      message: content,
      title: filename,
    });
  };

  return {
    entries,
    stats,
    canExport,
    isLoading: entriesQuery.isLoading,
    isError: entriesQuery.isError,
    error: entriesQuery.error,
    refetch: entriesQuery.refetch,
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    exportJournal,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
