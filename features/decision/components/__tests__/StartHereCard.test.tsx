import { fireEvent, render } from '@testing-library/react-native';

import type { SetupCardData } from '@/features/decision/types/decision.types';

import { StartHereCard, startHereEventKey } from '../StartHereCard';

const mockMutate = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/features/decision-log/hooks/useDecisionLog', () => ({
  useAppendDecisionRecord: () => ({ mutate: mockMutate }),
}));

const setup: SetupCardData = {
  id: 'setup-aapl',
  symbol: 'AAPL',
  title: 'Structure review',
  bias: 'neutral',
  status: 'forming',
  confidence: 68,
  researchValueScore: 82,
  decisionQualityScore: 68,
  researchValueExplanation: 'High learning value with portfolio relevance.',
  why: ['Defined structure'],
  invalidation: 'Structure breaks',
  risk: 'medium',
  explainability: {
    confidence: 68,
    factors: [],
    agrees: 2,
    disagrees: 1,
    dataAsOf: Date.now(),
    freshness: 'recent',
    reasoning: 'Mixed evidence',
  },
};

describe('StartHereCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('renders honest score context and records accessible Research and Skip actions', async () => {
    const onOutcome = jest.fn();
    const screen = await render(
      <StartHereCard
        symbol="aapl"
        setup={setup}
        queueItem={{ symbol: 'AAPL', estimatedMinutes: 12, completed: false }}
        regime="Range-bound"
        onOutcome={onOutcome}
      />,
    );

    expect(screen.getByText(/RVS 82 · DQS 68/)).toBeTruthy();
    expect(screen.getByText('High learning value with portfolio relevance.')).toBeTruthy();
    expect(screen.getByText(/not price direction/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Research AAPL from Start Here'));
    await fireEvent.press(screen.getByLabelText('Skip AAPL from Start Here'));

    expect(mockMutate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        action: 'researched',
        eventKey: 'start-here-outcome:AAPL:researched:2026-07-21',
        researchValueScore: 82,
        decisionQualityScore: 68,
      }),
    );
    expect(mockMutate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: 'skipped',
        eventKey: 'start-here-outcome:AAPL:skipped:2026-07-21',
      }),
    );
    expect(mockPush).toHaveBeenCalledWith('/asset/AAPL');
    expect(onOutcome).toHaveBeenCalledTimes(2);
  });

  it('uses the queue snapshot when no top setup exists', async () => {
    const screen = await render(
      <StartHereCard
        symbol="MSFT"
        queueItem={{
          symbol: 'MSFT',
          estimatedMinutes: 10,
          completed: false,
          setupTitle: 'Range structure review',
          rankReason: 'Fits the saved time budget',
          researchValueScore: 77,
          decisionQualityScore: 64,
        }}
        regime="Range-bound"
      />,
    );

    expect(screen.getByText(/MSFT · Range structure review/)).toBeTruthy();
    expect(screen.getByText(/RVS 77 · DQS 64/)).toBeTruthy();
    expect(screen.getByText('Fits the saved time budget')).toBeTruthy();
  });

  it('generates the same idempotency key for same-day retries', () => {
    expect(startHereEventKey('aapl', 'researched', '2026-07-21')).toBe(
      startHereEventKey('AAPL', 'researched', '2026-07-21'),
    );
  });
});
