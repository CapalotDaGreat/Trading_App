import type { JournalEntry } from '../types/journal.types';

export type JournalQuickFilter = 'all' | 'uncertain' | 'losses' | 'recent' | 'thesis_changed';

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'my',
  'me',
  'show',
  'about',
  'where',
  'was',
  'were',
  'from',
  'last',
  'involving',
  'decisions',
  'decision',
  'notes',
  'entries',
  'journal',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'how',
  'do',
  'i',
]);
const UNCERTAIN = /uncertain|unsure|not sure|doubt|fear|fomo|hesitat/i;
const THESIS_CHANGED = /changed thesis|thesis changed|invalidat|stopped out|plan drift|plan-drift/i;

export function searchJournalEntries(
  entries: JournalEntry[],
  query: string,
  filter: JournalQuickFilter = 'all',
): JournalEntry[] {
  const now = Date.now();
  const monthAgo = now - 30 * 86_400_000;
  const tokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return entries.filter((entry) => {
    if (filter === 'losses' && entry.outcome !== 'loss') return false;
    if (filter === 'recent') {
      const stamp = Date.parse(entry.tradedAt || entry.createdAt);
      if (!Number.isFinite(stamp) || stamp < monthAgo) return false;
    }
    if (filter === 'uncertain') {
      const blob = `${entry.notes} ${entry.emotion ?? ''} ${entry.lessonsLearned ?? ''}`;
      if (entry.emotion !== 'fearful' && entry.emotion !== 'fomo' && !UNCERTAIN.test(blob)) {
        return false;
      }
    }
    if (filter === 'thesis_changed') {
      const blob = `${entry.notes} ${entry.lessonsLearned ?? ''} ${entry.improvementCommitment ?? ''}`;
      if (entry.planAdhered !== false && !THESIS_CHANGED.test(blob)) return false;
    }

    if (!tokens.length) return true;

    const haystack = [
      entry.symbol,
      entry.notes,
      entry.lessonsLearned,
      entry.strategy,
      entry.tags.join(' '),
      entry.emotion,
      entry.mistakeCategory,
      entry.regimeNote,
      ...(entry.linkedAcademyLessonIds ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const lowered = query.toLowerCase();
    const intentHit =
      (/\buncertain|unsure\b/i.test(lowered) &&
        (entry.emotion === 'fearful' || entry.emotion === 'fomo' || UNCERTAIN.test(haystack))) ||
      (/\bloss|losing\b/i.test(lowered) && entry.outcome === 'loss') ||
      (/\brsi|momentum\b/i.test(lowered) && haystack.includes('rsi')) ||
      (/\btesla\b/i.test(lowered) && (haystack.includes('tsla') || haystack.includes('tesla')));

    if (intentHit) return true;
    return tokens.some(
      (token) => haystack.includes(token) || entry.symbol.toLowerCase().includes(token),
    );
  });
}
