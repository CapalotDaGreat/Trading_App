import { useJournalDraftStore } from '../journal-draft.store';

describe('journal draft idempotent writes', () => {
  beforeEach(() => {
    useJournalDraftStore.setState({ draft: null, savedAt: null });
  });

  it('saveDraft does not rewrite when content is identical', () => {
    const draft = {
      symbol: 'SPY',
      direction: 'long' as const,
      entryPrice: 100,
      quantity: 1,
      notes: 'Process note',
    };
    const { saveDraft } = useJournalDraftStore.getState();
    saveDraft(draft);
    const savedAt = useJournalDraftStore.getState().savedAt;

    let writes = 0;
    const unsub = useJournalDraftStore.subscribe(() => {
      writes += 1;
    });
    saveDraft({ ...draft });
    unsub();

    expect(writes).toBe(0);
    expect(useJournalDraftStore.getState().savedAt).toBe(savedAt);
  });
});
