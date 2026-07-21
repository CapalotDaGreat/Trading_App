import {
  LocalUserRepository,
  localUserDataStorageKey,
  type LocalStorageAdapter,
} from '../local-user.repository';

class MemoryStorage implements LocalStorageAdapter {
  readonly values = new Map<string, string>();

  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  async removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('LocalUserRepository', () => {
  it('isolates users and supports full CRUD', async () => {
    const storage = new MemoryStorage();
    const first = new LocalUserRepository('first', storage);
    const second = new LocalUserRepository('second', storage);

    const created = await first.create<{ id: string; value: number }>('alerts', { value: 1 });
    expect(await first.get('alerts', created.id)).toMatchObject({ value: 1 });
    expect(await second.list('alerts')).toEqual([]);

    await first.update('alerts', created.id, { value: 2 });
    expect(await first.get<{ id: string; value: number }>('alerts', created.id)).toMatchObject({
      value: 2,
    });

    await first.delete('alerts', created.id);
    expect(await first.list('alerts')).toEqual([]);
  });

  it('serializes concurrent writes without losing records', async () => {
    const storage = new MemoryStorage();
    const repository = new LocalUserRepository('concurrent', storage);

    await Promise.all(
      Array.from({ length: 40 }, (_, value) =>
        repository.create<{ id: string; value: number }>('journal', { value }),
      ),
    );

    const records = await repository.list<{ id: string; value: number }>('journal');
    expect(records).toHaveLength(40);
    expect(new Set(records.map((record) => record.value)).size).toBe(40);
  });

  it('deduplicates event keys atomically', async () => {
    const storage = new MemoryStorage();
    const repository = new LocalUserRepository('events', storage);

    const records = await Promise.all(
      Array.from({ length: 10 }, () =>
        repository.createUnique<{ id: string; eventKey: string }>('decisionLog', 'eventKey', {
          eventKey: 'same-event',
        }),
      ),
    );

    expect(new Set(records.map((record) => record.id)).size).toBe(1);
    expect(await repository.list('decisionLog')).toHaveLength(1);
  });

  it('migrates legacy demo keys once into the uid document', async () => {
    const storage = new MemoryStorage();
    storage.values.set(
      'tradevision-demo-watchlist',
      JSON.stringify({ name: 'Legacy', symbols: ['AAPL'] }),
    );
    storage.values.set(
      'tradevision-demo-journal',
      JSON.stringify([{ id: 'journal-1', symbol: 'AAPL' }]),
    );
    storage.values.set(
      'tradevision-demo-profile:demo-guest',
      JSON.stringify({ uid: 'wrong', displayName: 'Legacy Trader' }),
    );
    storage.values.set(
      'tradevision-decision-log',
      JSON.stringify([{ id: 'decision-1', eventKey: 'legacy-event' }]),
    );

    const repository = new LocalUserRepository('demo-guest', storage);
    const document = await repository.getDocument();

    expect(document.collections.watchlists[0]).toMatchObject({
      id: 'demo-watchlist',
      name: 'Legacy',
    });
    expect(document.collections.journal).toHaveLength(1);
    expect(document.collections.profiles[0]).toMatchObject({
      id: 'demo-guest',
      uid: 'demo-guest',
      displayName: 'Legacy Trader',
    });
    expect(document.collections.decisionLog).toHaveLength(1);
    expect(storage.values.has('tradevision-demo-watchlist')).toBe(false);
    expect(storage.values.has(localUserDataStorageKey('demo-guest'))).toBe(true);
  });

  it('seeds idempotently and resets only its own user-data key', async () => {
    const storage = new MemoryStorage();
    storage.values.set('tradevision-settings', 'keep');
    storage.values.set('tradevision-theme', 'keep');
    const repository = new LocalUserRepository('demo-guest', storage);

    expect(
      await repository.seedIfNeeded(1, {
        alerts: [{ id: 'seed-alert', symbol: 'NVDA' }],
      }),
    ).toBe(true);
    await repository.create<{ id: string; symbol: string }>('alerts', {
      id: 'user-alert',
      symbol: 'AAPL',
    });
    expect(
      await repository.seedIfNeeded(1, {
        alerts: [{ id: 'replacement', symbol: 'SPY' }],
      }),
    ).toBe(false);
    expect(await repository.list('alerts')).toHaveLength(2);

    await repository.reset();
    expect(storage.values.get('tradevision-settings')).toBe('keep');
    expect(storage.values.get('tradevision-theme')).toBe('keep');
    expect(storage.values.has(localUserDataStorageKey('demo-guest'))).toBe(false);
  });
});
