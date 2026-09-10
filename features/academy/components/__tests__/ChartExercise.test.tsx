import { fireEvent, render } from '@testing-library/react-native';

import { ChartExercise } from '../ChartExercise';
import { nextRetryExercise } from '../../content/chart-exercise-retry';

const first = {
  prompt: 'RSI above the stretched band most usefully means…',
  choices: ['Price must reverse now', 'Recent gains were unusually persistent — ask what else confirms', 'You should sell', 'The data is live'],
  correctIndex: 1,
  explanation: 'RSI describes stretch, not a sell alarm.',
};

describe('ChartExercise retry', () => {
  it('selects a different prompt after a miss', () => {
    const next = nextRetryExercise('rsi', first, [first.prompt]);
    expect(next).toBeTruthy();
    expect(next!.prompt).not.toBe(first.prompt);
    expect(next!.choices.length).toBeGreaterThan(1);
  });

  it('records a miss, locks the item, then offers a different example', async () => {
    const onAttempt = jest.fn();
    const screen = await render(<ChartExercise exercise={first} kind="rsi" onAttempt={onAttempt} />);

    await fireEvent.press(screen.getByLabelText('Price must reverse now'));
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, selectedIndex: 0, retry: false, prompt: first.prompt }),
    );
    expect(screen.getByText('Not this one')).toBeTruthy();
    expect(screen.getByText('Correct')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(/Recent gains were unusually persistent/));
    expect(onAttempt).toHaveBeenCalledTimes(1);

    const next = nextRetryExercise('rsi', first, [first.prompt]);
    await fireEvent.press(screen.getByLabelText('Try a different example'));
    expect(screen.getByTestId('chart-exercise-prompt').props.children).toBe(next?.prompt);

    await fireEvent.press(screen.getByTestId('chart-exercise-choice-1'));
    expect(onAttempt).toHaveBeenLastCalledWith(
      expect.objectContaining({ correct: true, retry: true, prompt: next?.prompt }),
    );
  });
});
