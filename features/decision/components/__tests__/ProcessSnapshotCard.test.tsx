import { fireEvent, render } from '@testing-library/react-native';

import { ProcessSnapshotCard } from '../ProcessSnapshotCard';
import { buildDecisionDebt } from '../../services/decision-os.service';

describe('ProcessSnapshotCard', () => {
  it('offers one primary review action without shaming or duplicate dismiss', async () => {
    const onReview = jest.fn();
    const onDefer = jest.fn();
    const debt = buildDecisionDebt({
      unreviewedSetups: 2,
      incompleteJournals: 5,
    });

    const screen = await render(
      <ProcessSnapshotCard
        processScore={72}
        researched={7}
        journaled={1}
        skipped={4}
        total={12}
        debt={debt}
        onReview={onReview}
        onDefer={onDefer}
      />,
    );

    expect(screen.getByText('7 items are available to review when you want.')).toBeTruthy();
    expect(screen.queryByText(/unfinished decisions/i)).toBeNull();
    expect(screen.getByText('DQS')).toBeTruthy();
    expect(screen.getByText('Research consistency')).toBeTruthy();
    expect(screen.queryByText('Dismiss')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Review when ready'));
    await fireEvent.press(screen.getByLabelText('Defer waiting reviews until later'));

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onDefer).toHaveBeenCalledTimes(1);
  });
});
