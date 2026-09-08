import { searchJournalEntries } from '../journal-search.service';
import type { JournalEntry } from '../../types/journal.types';

function entry(partial: Partial<JournalEntry>): JournalEntry {
  return {
    id: partial.id ?? '1',
    symbol: partial.symbol ?? 'AAPL',
    direction: 'long',
    entryPrice: 100,
    quantity: 1,
    outcome: partial.outcome ?? 'open',
    tags: partial.tags ?? [],
    notes: partial.notes ?? '',
    emotion: partial.emotion,
    lessonsLearned: partial.lessonsLearned,
    planAdhered: partial.planAdhered,
    tradedAt: partial.tradedAt ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('journal search', () => {
  const entries: JournalEntry[] = [
    entry({ id: 'tsla', symbol: 'TSLA', notes: 'Uncertain about the gap', emotion: 'fearful' }),
    entry({ id: 'rsi', symbol: 'NVDA', notes: 'RSI stretched into resistance', tags: ['rsi'] }),
    entry({
      id: 'loss',
      symbol: 'MSFT',
      outcome: 'loss',
      notes: 'Plan drifted after the thesis changed',
      planAdhered: false,
    }),
  ];

  it('finds Tesla without requiring the ticker casing', () => {
    const hits = searchJournalEntries(entries, 'Show my decisions about Tesla');
    expect(hits.map((item) => item.id)).toContain('tsla');
  });

  it('finds uncertain process notes', () => {
    const hits = searchJournalEntries(entries, '', 'uncertain');
    expect(hits.map((item) => item.id)).toContain('tsla');
  });

  it('finds losses and RSI mentions', () => {
    expect(searchJournalEntries(entries, 'losing decisions').map((item) => item.id)).toContain('loss');
    expect(searchJournalEntries(entries, 'decisions involving RSI').map((item) => item.id)).toContain('rsi');
  });
});
