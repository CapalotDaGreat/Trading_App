import { render } from '@testing-library/react-native';

import { ALL_LESSONS } from '@/features/academy/content';
import type { CurriculumRecommendation } from '@/features/academy/services/curriculum.service';

import { NextLessonCard } from '../CurriculumCards';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const lesson = ALL_LESSONS[0];

function rec(partial: Partial<CurriculumRecommendation>): CurriculumRecommendation {
  return {
    lesson,
    reason: 'Test reason',
    evidence: ['evidence'],
    isPersonalized: false,
    source: 'path',
    ...partial,
  };
}

describe('NextLessonCard authority copy', () => {
  it('does not label path browse as Personalized next / Home next', async () => {
    const screen = await render(
      <NextLessonCard recommendation={rec({ isPersonalized: true, source: 'dna' })} showPremiumBadge />,
    );
    expect(screen.getByText('Browse suggestion · not Home next')).toBeTruthy();
    expect(screen.queryByText(/Next lesson · Personalized/i)).toBeNull();
  });

  it('labels weakness refreshers without claiming mastery', async () => {
    const screen = await render(<NextLessonCard recommendation={rec({ source: 'weakness' })} />);
    expect(screen.getByText('Path refresher · from your checks')).toBeTruthy();
  });
});
