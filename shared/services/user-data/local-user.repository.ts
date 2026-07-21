import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCAL_USER_DATA_VERSION = 1;
export const LOCAL_USER_DATA_KEY_PREFIX = `tradevision:user-data:v${LOCAL_USER_DATA_VERSION}`;

export type LocalCollectionName =
  'watchlists' | 'journal' | 'holdings' | 'alerts' | 'profiles' | 'decisionLog';

export interface LocalEntity {
  id: string;
  [key: string]: unknown;
}

export interface LocalUserDataDocument {
  version: typeof LOCAL_USER_DATA_VERSION;
  uid: string;
  updatedAt: string;
  demoSeedVersion?: number;
  collections: Record<LocalCollectionName, LocalEntity[]>;
}

export interface LocalStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const LEGACY_WATCHLIST_KEY = 'tradevision-demo-watchlist';
const LEGACY_JOURNAL_KEY = 'tradevision-demo-journal';
const LEGACY_PROFILE_KEY = 'tradevision-demo-profile';
const LEGACY_DECISION_LOG_KEY = 'tradevision-decision-log';

const queues = new Map<string, Promise<unknown>>();
let idCounter = 0;

function emptyCollections(): LocalUserDataDocument['collections'] {
  return {
    watchlists: [],
    journal: [],
    holdings: [],
    alerts: [],
    profiles: [],
    decisionLog: [],
  };
}

function createEmptyDocument(uid: string): LocalUserDataDocument {
  return {
    version: LOCAL_USER_DATA_VERSION,
    uid,
    updatedAt: new Date().toISOString(),
    collections: emptyCollections(),
  };
}

function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseObject(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function parseArray(raw: string | null): LocalEntity[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? value.filter(
          (item): item is LocalEntity =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as LocalEntity).id === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

function normalizeDocument(value: unknown, uid: string): LocalUserDataDocument | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<LocalUserDataDocument>;
  if (candidate.version !== LOCAL_USER_DATA_VERSION || candidate.uid !== uid) return null;

  const collections = emptyCollections();
  for (const name of Object.keys(collections) as LocalCollectionName[]) {
    const items = candidate.collections?.[name];
    collections[name] = Array.isArray(items)
      ? items.filter(
          (item): item is LocalEntity =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof (item as LocalEntity).id === 'string',
        )
      : [];
  }

  return {
    version: LOCAL_USER_DATA_VERSION,
    uid,
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
    demoSeedVersion:
      typeof candidate.demoSeedVersion === 'number' ? candidate.demoSeedVersion : undefined,
    collections,
  };
}

function nextId(collection: LocalCollectionName): string {
  idCounter += 1;
  return `local-${collection}-${Date.now()}-${idCounter}`;
}

export function localUserDataStorageKey(uid: string): string {
  return `${LOCAL_USER_DATA_KEY_PREFIX}:${encodeURIComponent(uid)}`;
}

/**
 * Versioned, uid-scoped local persistence. Mutations are serialized per user so
 * concurrent feature writes cannot overwrite one another.
 */
export class LocalUserRepository {
  constructor(
    readonly uid: string,
    private readonly storage: LocalStorageAdapter = AsyncStorage,
  ) {
    if (!uid) throw new Error('A uid is required for local user data.');
  }

  private get key(): string {
    return localUserDataStorageKey(this.uid);
  }

  private async migrateLegacyData(): Promise<LocalUserDataDocument> {
    const document = createEmptyDocument(this.uid);
    const [watchlistRaw, journalRaw, profileRaw, scopedProfileRaw, decisionLogRaw] =
      await Promise.all([
        this.storage.getItem(LEGACY_WATCHLIST_KEY),
        this.storage.getItem(LEGACY_JOURNAL_KEY),
        this.storage.getItem(LEGACY_PROFILE_KEY),
        this.storage.getItem(`${LEGACY_PROFILE_KEY}:${this.uid}`),
        this.storage.getItem(LEGACY_DECISION_LOG_KEY),
      ]);

    const watchlist = parseObject(watchlistRaw);
    if (watchlist) {
      document.collections.watchlists = [
        {
          id: 'demo-watchlist',
          ...watchlist,
        },
      ];
    }
    document.collections.journal = parseArray(journalRaw);
    document.collections.decisionLog = parseArray(decisionLogRaw);

    const profile = parseObject(scopedProfileRaw) ?? parseObject(profileRaw);
    if (profile) {
      document.collections.profiles = [{ ...profile, id: this.uid, uid: this.uid }];
    }

    await this.storage.setItem(this.key, JSON.stringify(document));
    await Promise.all([
      this.storage.removeItem(LEGACY_WATCHLIST_KEY),
      this.storage.removeItem(LEGACY_JOURNAL_KEY),
      this.storage.removeItem(LEGACY_PROFILE_KEY),
      this.storage.removeItem(`${LEGACY_PROFILE_KEY}:${this.uid}`),
      this.storage.removeItem(LEGACY_DECISION_LOG_KEY),
    ]);
    return document;
  }

  private async readDocument(): Promise<LocalUserDataDocument> {
    const raw = await this.storage.getItem(this.key);
    if (!raw) return this.migrateLegacyData();
    try {
      return normalizeDocument(JSON.parse(raw) as unknown, this.uid) ?? this.migrateLegacyData();
    } catch {
      return this.migrateLegacyData();
    }
  }

  private async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const previous = queues.get(this.key) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(operation);
    queues.set(this.key, current);
    try {
      return await current;
    } finally {
      if (queues.get(this.key) === current) queues.delete(this.key);
    }
  }

  private async mutate<T>(
    operation: (document: LocalUserDataDocument) => T | Promise<T>,
  ): Promise<T> {
    return this.runExclusive(async () => {
      const document = await this.readDocument();
      const result = await operation(document);
      document.updatedAt = new Date().toISOString();
      await this.storage.setItem(this.key, JSON.stringify(document));
      return clone(result);
    });
  }

  async getDocument(): Promise<LocalUserDataDocument> {
    return this.runExclusive(async () => clone(await this.readDocument()));
  }

  async list<T extends { id: string }>(collection: LocalCollectionName): Promise<T[]> {
    const document = await this.getDocument();
    return document.collections[collection] as unknown as T[];
  }

  async get<T extends { id: string }>(
    collection: LocalCollectionName,
    id: string,
  ): Promise<T | null> {
    const items = await this.list<T>(collection);
    return items.find((item) => item.id === id) ?? null;
  }

  async create<T extends { id: string }>(
    collection: LocalCollectionName,
    value: Omit<T, 'id'> & { id?: string },
    maxItems?: number,
  ): Promise<T> {
    return this.mutate((document) => {
      const item = { ...value, id: value.id ?? nextId(collection) } as T;
      document.collections[collection].unshift(item as unknown as LocalEntity);
      if (maxItems !== undefined) {
        document.collections[collection] = document.collections[collection].slice(0, maxItems);
      }
      return item;
    });
  }

  async put<T extends { id: string }>(collection: LocalCollectionName, value: T): Promise<T> {
    return this.mutate((document) => {
      const items = document.collections[collection];
      const index = items.findIndex((item) => item.id === value.id);
      if (index >= 0) items[index] = value as unknown as LocalEntity;
      else items.unshift(value as unknown as LocalEntity);
      return value;
    });
  }

  async update<T extends { id: string }>(
    collection: LocalCollectionName,
    id: string,
    updates: Partial<Omit<T, 'id'>>,
  ): Promise<T> {
    return this.mutate((document) => {
      const items = document.collections[collection];
      const index = items.findIndex((item) => item.id === id);
      if (index < 0) throw new Error(`${collection} record not found.`);
      const updated = { ...items[index], ...updates, id } as unknown as T;
      items[index] = updated as unknown as LocalEntity;
      return updated;
    });
  }

  async delete(collection: LocalCollectionName, id: string): Promise<void> {
    await this.mutate((document) => {
      document.collections[collection] = document.collections[collection].filter(
        (item) => item.id !== id,
      );
    });
  }

  async createUnique<T extends { id: string }>(
    collection: LocalCollectionName,
    uniqueField: keyof T,
    value: Omit<T, 'id'> & { id?: string },
    maxItems?: number,
  ): Promise<T> {
    return this.mutate((document) => {
      const candidateValue = (value as Partial<T>)[uniqueField];
      const existing = document.collections[collection].find(
        (item) => item[uniqueField as string] === candidateValue,
      ) as unknown as T | undefined;
      if (existing) return existing;
      const item = { ...value, id: value.id ?? nextId(collection) } as T;
      document.collections[collection].unshift(item as unknown as LocalEntity);
      if (maxItems !== undefined) {
        document.collections[collection] = document.collections[collection].slice(0, maxItems);
      }
      return item;
    });
  }

  async replaceAll(
    collections: Partial<Record<LocalCollectionName, LocalEntity[]>>,
  ): Promise<void> {
    await this.mutate((document) => {
      for (const [name, items] of Object.entries(collections)) {
        document.collections[name as LocalCollectionName] = clone(items ?? []);
      }
    });
  }

  async seedIfNeeded(
    seedVersion: number,
    collections: Partial<Record<LocalCollectionName, LocalEntity[]>>,
  ): Promise<boolean> {
    return this.mutate((document) => {
      if ((document.demoSeedVersion ?? 0) >= seedVersion) return false;
      for (const [name, items] of Object.entries(collections)) {
        document.collections[name as LocalCollectionName] = clone(items ?? []);
      }
      document.demoSeedVersion = seedVersion;
      return true;
    });
  }

  /** Removes only this user's feature data; app settings and theme keys are untouched. */
  async reset(): Promise<void> {
    await this.runExclusive(() => this.storage.removeItem(this.key));
  }
}

export function getLocalUserRepository(
  uid: string,
  storage: LocalStorageAdapter = AsyncStorage,
): LocalUserRepository {
  return new LocalUserRepository(uid, storage);
}
