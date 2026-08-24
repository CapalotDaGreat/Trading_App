import { fireEvent, render } from '@testing-library/react-native';

import { ProcessSnapshotCard } from '../ProcessSnapshotCard';
import { buildDecisionDebt } from '../../services/decision-os.service';

describe('ProcessSnapshotCard', () => {
  it('offers Review, Dismiss, and Defer without shaming copy', async () => {
    const onReview = jest.fn();
    const onDismiss = jest.fn();
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
        onDismiss={onDismiss}
        onDefer={onDefer}
      />,
    );

    expect(screen.getByText('You have 7 items waiting for review.')).toBeTruthy();
    expect(screen.queryByText(/unfinished decisions/i)).toBeNull();
    expect(screen.getByText('DQS')).toBeTruthy();
    expect(screen.getByText('Research consistency')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Review waiting items'));
    await fireEvent.press(screen.getByLabelText('Dismiss waiting reviews for this session'));
    await fireEvent.press(screen.getByLabelText('Defer waiting reviews until later'));

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDefer).toHaveBeenCalledTimes(1);
  });
});
