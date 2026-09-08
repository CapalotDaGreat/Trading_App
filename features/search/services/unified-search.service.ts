import { searchAcademyLessons, type AcademySearchHit } from '@/features/academy/services/academy-search.service';
import type { Lesson } from '@/features/academy/types/academy.types';
import {
  searchJournalEntries,
  type JournalQuickFilter,
} from '@/features/journal/services/journal-search.service';
import type { JournalEntry } from '@/features/journal/types/journal.types';
import type { SearchResult } from '@/features/markets/services/market-search.service';

export type UnifiedSearchGroup = 'markets' | 'academy' | 'journal';

export interface UnifiedSearchResults {
  query: string;
  academy: AcademySearchHit[];
  journal: JournalEntry[];
  markets: SearchResult[];
}

export function buildLocalUnifiedSearch(input: {
  query: string;
  lessons: Lesson[];
  journalEntries?: JournalEntry[];
  journalFilter?: JournalQuickFilter;
  includePremium?: boolean;
}): Omit<UnifiedSearchResults, 'markets'> & { markets: SearchResult[] } {
  const query = input.query.trim();
  return {
    query,
    academy: searchAcademyLessons(input.lessons, query, {
      limit: 8,
      includePremium: input.includePremium,
    }),
    journal: searchJournalEntries(input.journalEntries ?? [], query, input.journalFilter ?? 'all').slice(
      0,
      8,
    ),
    markets: [],
  };
}

export function looksLikeInstrumentQuery(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (trimmed.length <= 6 && /^[A-Za-z.]{1,6}$/.test(trimmed)) return true;
  return /etf|stock|ticker|symbol|nvda|aapl|tsla|btc|eur/i.test(trimmed);
}
