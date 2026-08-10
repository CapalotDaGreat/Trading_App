import { fireEvent, render } from '@testing-library/react-native';

import { ResearchQueueCard } from '@/features/decision/components/ResearchQueueCard';
import { SetupCard } from '@/features/decision/components/SetupCard';
import type { SetupCardData } from '@/features/decision/types/decision.types';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/features/decision-log/hooks/useDecisionLog', () => ({
  useAppendDecisionRecord: () => ({ mutate: jest.fn() }),
}));

jest.mock('@/features/decision/services/coaching-loop.service', () => ({
  loadQueueCompletions: jest.fn(async () => new Set()),
  toggleQueueSymbol: jest.fn(async () => new Set()),
}));

const setup: SetupCardData = {
  id: 'setup-aapl',
  symbol: 'AAPL',
  title: 'Structure review',
  bias: 'bullish',
  status: 'confirmed',
  confidence: 72,
  researchValueScore: 80,
  decisionQualityScore: 70,
  why: ['Daily structure: uptrend'],
  invalidation: 'Below 180',
  risk: 'low',
  explainability: {
    confidence: 70,
    factors: [],
    agrees: 2,
    disagrees: 0,
    dataAsOf: Date.now(),
    freshness: 'recent',
    reasoning: 'Evidence for research priority only',
  },
};

describe('calm Decision OS language', () => {
  it('labels setups as research candidates with case-risk wording', async () => {
    const screen = await render(<SetupCard setup={setup} />);

    expect(screen.getByText(/Research candidate/)).toBeTruthy();
    expect(screen.getByText('Evidence stronger')).toBeTruthy();
    expect(screen.queryByText(/Evidence ready/i)).toBeNull();
    expect(screen.queryByText(/Lower risk/i)).toBeNull();
    expect(screen.queryByText(/Potential setup/i)).toBeNull();

    await fireEvent.press(screen.getByLabelText('Show why, checklist, and invalidation'));
    expect(screen.getByText('Contained case risk')).toBeTruthy();
  });

  it('defaults the research queue to evidence language', async () => {
    const screen = await render(
      <ResearchQueueCard
        queue={[
          {
            symbol: 'AAPL',
            estimatedMinutes: 10,
            completed: false,
            researchValueScore: 88,
          },
        ]}
        regime="Range-bound"
      />,
    );

    expect(await screen.findByText('RESEARCH QUEUE')).toBeTruthy();
    expect(screen.getByText('Highest research value now')).toBeTruthy();
    expect(screen.queryByText(/Highest-value ideas only/i)).toBeNull();
    expect(screen.queryByText(/RESEARCH OPPORTUNITIES/i)).toBeNull();
  });
});
