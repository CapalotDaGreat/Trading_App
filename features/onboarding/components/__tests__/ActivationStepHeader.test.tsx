import { render } from '@testing-library/react-native';

import {
  ActivationStepHeader,
  activationStepSubtitle,
  activationStepTitle,
} from '../ActivationStepHeader';

describe('ActivationStepHeader', () => {
  it('renders the shortened demo step as an accessible activation target', async () => {
    const screen = await render(<ActivationStepHeader step={1} isDemo />);
    expect(screen.getByTestId('activation-step-1')).toBeTruthy();
    expect(screen.getByText('See a coherent demo brief')).toBeTruthy();
  });

  it('keeps real-user score framing distinct from predictive advice', async () => {
    const screen = await render(<ActivationStepHeader step={2} isDemo={false} />);
    expect(screen.getByText(activationStepTitle(2, false))).toBeTruthy();
    expect(screen.getByText(activationStepSubtitle(2, false))).toBeTruthy();
    expect(activationStepSubtitle(2, false)).toContain('not a buy or sell signal');
  });
});
