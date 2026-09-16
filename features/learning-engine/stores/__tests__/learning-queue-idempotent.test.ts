import { useLearningQueueStore } from '../learning-queue.store';

describe('learning queue idempotent writes', () => {
  beforeEach(() => {
    useLearningQueueStore.setState({
      plannerPrimaryCta: null,
      recentActivityKeys: [],
    });
  });

  it('setPlannerPrimaryCta does not notify when label/href are unchanged', () => {
    const { setPlannerPrimaryCta } = useLearningQueueStore.getState();
    setPlannerPrimaryCta({ label: 'Practice risk', href: '/practice?drill=1' });

    let writes = 0;
    const unsub = useLearningQueueStore.subscribe(() => {
      writes += 1;
    });

    setPlannerPrimaryCta({ label: 'Practice risk', href: '/practice?drill=1' });
    setPlannerPrimaryCta({ label: 'Practice risk', href: '/practice?drill=1' });
    unsub();

    expect(writes).toBe(0);
    expect(useLearningQueueStore.getState().plannerPrimaryCta).toEqual({
      label: 'Practice risk',
      href: '/practice?drill=1',
    });
  });

  it('recordOpened does not reshuffle when the key is already most recent', () => {
    const { recordOpened } = useLearningQueueStore.getState();
    recordOpened('/academy/lesson/a');

    let writes = 0;
    const unsub = useLearningQueueStore.subscribe(() => {
      writes += 1;
    });
    recordOpened('/academy/lesson/a');
    unsub();

    expect(writes).toBe(0);
    expect(useLearningQueueStore.getState().recentActivityKeys[0]).toBe('/academy/lesson/a');
  });
});
