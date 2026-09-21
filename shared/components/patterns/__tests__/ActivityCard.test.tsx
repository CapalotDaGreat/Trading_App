import { fireEvent, render } from '@testing-library/react-native';

import { ActivityCard, ProgressHeader } from '@/shared/components/patterns/ActivityCard';

describe('activity progress language', () => {
  it('distinguishes available and in-progress activities', async () => {
    const onContinue = jest.fn();
    const screen = await render(
      <>
        <ActivityCard
          title="Risk foundations"
          description="Learn the core idea."
          actionLabel="Start"
          onAction={onContinue}
        />
        <ActivityCard
          title="Replay in progress"
          description="Saved on this device."
          status="in_progress"
          progress={0.5}
          progressLabel="Step 4 of 8"
          actionLabel="Continue"
          onAction={onContinue}
        />
      </>,
    );

    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByText('Step 4 of 8')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('exposes a persistent simulation progress header', async () => {
    const screen = await render(
      <ProgressHeader
        label="SIMULATION · PRACTICE ACCOUNT"
        title="Simulation in progress"
        detail="USD 100000 available"
      />,
    );

    expect(screen.getByText('SIMULATION · PRACTICE ACCOUNT')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
  });
});
