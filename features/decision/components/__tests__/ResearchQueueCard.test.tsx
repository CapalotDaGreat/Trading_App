import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { ResearchQueueCard } from '../ResearchQueueCard';

const mockMutate = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/features/decision-log/hooks/useDecisionLog', () => ({
  useAppendDecisionRecord: () => ({ mutate: mockMutate }),
}));

jest.mock('@/features/decision/services/coaching-loop.service', () => ({
  loadQueueCompletions: jest.fn(async () => new Set()),
  toggleQueueSymbol: jest.fn(async () => new Set(['MSFT'])),
}));

const queue = ['AAPL', 'MSFT', 'NVDA', 'TSLA'].map((symbol, index) => ({
  symbol,
  estimatedMinutes: 5 + index,
  completed: false,
  researchValueScore: 90 - index,
  rankReason: `Rank reason ${index + 1}`,
}));

describe('ResearchQueueCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSubscriptionStore.setState({ tier: 'free', isPremium: false });
  });

  it('keeps the top three actionable and gates only the deeper queue', async () => {
    const screen = await render(
      <ResearchQueueCard queue={queue} regime="Range-bound" freeItemLimit={3} />,
    );

    await waitFor(() => expect(screen.getByTestId('research-queue-research-AAPL')).toBeTruthy());
    expect(screen.getByTestId('research-queue-research-NVDA')).toBeTruthy();
    expect(screen.queryByTestId('research-queue-research-TSLA')).toBeNull();
    expect(screen.getByTestId('premium-os-gate-advancedResearchQueue')).toBeTruthy();
  });

  it('records a skip and persists queue completion', async () => {
    const onOutcome = jest.fn();
    const screen = await render(
      <ResearchQueueCard queue={queue.slice(0, 1)} regime="Range-bound" onOutcome={onOutcome} />,
    );

    await fireEvent.press(await screen.findByTestId('research-queue-skip-AAPL'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'AAPL', action: 'skipped', researchValueScore: 90 }),
    );
    const { toggleQueueSymbol } = jest.requireMock(
      '@/features/decision/services/coaching-loop.service',
    ) as { toggleQueueSymbol: jest.Mock };
    expect(toggleQueueSymbol).toHaveBeenCalledWith('AAPL');
    expect(onOutcome).toHaveBeenCalledWith(queue[0], 'skipped');
  });
});
