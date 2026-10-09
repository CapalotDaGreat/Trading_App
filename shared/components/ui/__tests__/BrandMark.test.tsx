import { render } from '@testing-library/react-native';

import { BrandMark } from '@/shared/components/ui/BrandMark';

describe('BrandMark', () => {
  it('renders the app icon as an accessible, square, rounded logo', async () => {
    const screen = await render(<BrandMark size={40} />);
    const mark = screen.getByTestId('brand-mark');

    expect(screen.getByLabelText('TradeAcademy logo')).toBeTruthy();
    expect(mark.props.source).toBeTruthy();
    expect(mark.props.style).toMatchObject({ width: 40, height: 40, borderRadius: 9 });
  });
});
