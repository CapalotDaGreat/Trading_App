import { DEMO_USER_UID } from '@/firebase/config';

import {
  EMPTY_REPLAY_TV_PROGRESS,
  migrateReplayTvPersistedState,
  useReplayTvStore,
} from '../replay-tv.store';

describe('Replay TV persistence', () => {
  beforeEach(() => {
    useReplayTvStore.setState({
      progressByUser: {},
      activeSessionByUser: {},
    });
  });

  it('keeps guest and signed-in sessions isolated', () => {
    useReplayTvStore.getState().startEpisode(DEMO_USER_UID, 'tesla-rally');
    useReplayTvStore.getState().startEpisode('alice', 'covid-crash');

    expect(useReplayTvStore.getState().sessionFor(DEMO_USER_UID)?.episodeId).toBe('tesla-rally');
    expect(useReplayTvStore.getState().sessionFor('alice')?.episodeId).toBe('covid-crash');
    expect(useReplayTvStore.getState().sessionFor('bob')).toBeNull();

    useReplayTvStore.getState().markComplete(DEMO_USER_UID, {
      episodeId: 'tesla-rally',
      collectionIds: ['featured'],
      processScore: 72,
    });
    useReplayTvStore.getState().markComplete('alice', {
      episodeId: 'covid-crash',
      collectionIds: ['crashes'],
      processScore: 64,
    });

    expect(useReplayTvStore.getState().progressFor(DEMO_USER_UID).completedEpisodeIds).toEqual(['tesla-rally']);
    expect(useReplayTvStore.getState().progressFor('alice').completedEpisodeIds).toEqual(['covid-crash']);
    expect(useReplayTvStore.getState().progressFor(DEMO_USER_UID).bestProcessByEpisode['tesla-rally']).toBe(72);
    expect(useReplayTvStore.getState().progressFor('alice').bestProcessByEpisode['tesla-rally']).toBeUndefined();
  });

  it('migrates legacy v2 persist onto the guest ledger', () => {
    const migrated = migrateReplayTvPersistedState({
      progress: {
        ...EMPTY_REPLAY_TV_PROGRESS,
        completedEpisodeIds: ['covid-crash'],
        attemptCount: 2,
        bestProcessByEpisode: { 'covid-crash': 81 },
      },
      activeSession: null,
    });
    expect(migrated.progressByUser[DEMO_USER_UID]?.completedEpisodeIds).toEqual(['covid-crash']);
    expect(migrated.progressByUser[DEMO_USER_UID]?.bestProcessByEpisode['covid-crash']).toBe(81);
    expect(migrated.activeSessionByUser[DEMO_USER_UID]).toBeNull();
    expect(Object.keys(migrated.progressByUser)).toEqual([DEMO_USER_UID]);
  });

  it('keeps keyed v3 persist separate per uid', () => {
    const migrated = migrateReplayTvPersistedState({
      progressByUser: {
        [DEMO_USER_UID]: { ...EMPTY_REPLAY_TV_PROGRESS, completedEpisodeIds: ['tesla-rally'] },
        alice: { ...EMPTY_REPLAY_TV_PROGRESS, completedEpisodeIds: ['lehman-weekend'] },
      },
      activeSessionByUser: {
        [DEMO_USER_UID]: null,
        alice: null,
      },
    });
    expect(migrated.progressByUser[DEMO_USER_UID]?.completedEpisodeIds).toEqual(['tesla-rally']);
    expect(migrated.progressByUser.alice?.completedEpisodeIds).toEqual(['lehman-weekend']);
  });
});
