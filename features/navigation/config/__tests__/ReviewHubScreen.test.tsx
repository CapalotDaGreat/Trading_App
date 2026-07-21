import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ReviewHubScreen from '@/app/decision/decision-replay';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ segment: 'process' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));

jest.mock('@/features/decision-replay/hooks/useDecisionReplay', () => ({
  useDecisionReplaySession: () => ({
    data: undefined,
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
  }),
  useWeeklyGameTape: () => ({
    data: undefined,
    isRefetching: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/features/decision-replay/services/demo-tape.service', () => ({
  ensureDemoDecisionTape: jest.fn(async () => undefined),
}));

jest.mock('@/features/decision-replay/components/ChartReplaySegment', () => ({
  ChartReplaySegment: () => null,
}));
jest.mock('@/features/decision-replay/components/DecisionReplayTimeline', () => ({
  DecisionReplayTimeline: () => null,
}));
jest.mock('@/features/decision-replay/components/GameTapeCards', () => ({
  LearningInsightsCard: () => null,
  WeeklyGameTapeCard: () => null,
}));
jest.mock('@/features/decision-replay/components/ReplayCoachCard', () => ({
  ReplayCoachCard: () => null,
}));
jest.mock('@/features/decision-replay/components/ScoreEvolutionCard', () => ({
  ScoreEvolutionCard: () => null,
}));

describe('ReviewHubScreen navigation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps basic Process Tape and journal reflection free and switches segments canonically', async () => {
    const screen = await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ReviewHubScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByTestId('review-process-tape')).toBeTruthy();
    expect(screen.getByText(/History of what you researched, skipped, and reflected on/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('process-tape-reflect'));
    expect(mockPush).toHaveBeenCalledWith('/journal');

    await fireEvent.press(screen.getByTestId('review-segment-chart'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/decision/decision-replay',
      params: { segment: 'chart' },
    });
  });
});
