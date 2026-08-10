import { fireEvent, render } from '@testing-library/react-native';
import { View } from 'react-native';

import { AccessibleChartFrame } from '@/shared/components/charts/AccessibleChartFrame';
import { StatusState } from '@/shared/components/feedback/StatusState';
import { CollapsibleSection } from '@/shared/components/patterns/CollapsibleSection';
import { Chip } from '@/shared/components/ui/Chip';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Surface } from '@/shared/components/ui/Surface';
import { Tag } from '@/shared/components/ui/Tag';
import { Text } from '@/shared/components/ui/Text';
import { getMinTouchTargetSize } from '@/shared/utils/accessibility';

describe('design-system accessibility foundations', () => {
  it('keeps visual text variants separate from explicit heading semantics', async () => {
    const screen = await render(
      <>
        <Text variant="h1">Visual title</Text>
        <Text variant="body" headingLevel={2}>
          Semantic heading
        </Text>
      </>,
    );

    expect(screen.getByText('Visual title').props.accessibilityRole).toBeUndefined();
    expect(screen.getByText('Semantic heading').props.accessibilityRole).toBe('header');
    expect(screen.getByText('Semantic heading').props['aria-level']).toBe(2);
  });

  it('separates static tags from interactive chips while preserving legacy static Chip calls', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <>
        <Tag label="Delayed data" />
        <Chip label="Legacy metadata" />
        <Chip label="One month" selected onPress={onPress} />
      </>,
    );

    expect(screen.queryByRole('button', { name: 'Legacy metadata' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'One month' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Delayed data')).toBeTruthy();
  });

  it('keeps status announcements separate from recovery controls', async () => {
    const onRetry = jest.fn();
    const screen = await render(
      <StatusState
        status="error"
        title="Could not refresh"
        description="Cached research is still shown."
        actionLabel="Try again"
        onAction={onRetry}
      />,
    );

    expect(
      screen.getByLabelText('Could not refresh. Cached research is still shown.').props
        .accessibilityRole,
    ).toBe('alert');
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('provides one chart image summary and a visible textual alternative', async () => {
    const screen = await render(
      <AccessibleChartFrame
        title="Portfolio performance"
        timeRange="One month"
        source="Saved portfolio"
        freshness="Updated today"
        summary="Value increased two percent."
        textualAlternative="Started at 100 and ended at 102."
      >
        <View testID="decorative-chart" />
      </AccessibleChartFrame>,
    );

    expect(
      screen.getByRole('image', {
        name: /Portfolio performance.*One month.*Saved portfolio.*increased two percent/i,
      }),
    ).toBeTruthy();
    expect(screen.getByText('Started at 100 and ended at 102.')).toBeTruthy();
  });

  it('gives interactive surfaces disabled state and button semantics', async () => {
    const screen = await render(
      <Surface interactive disabled onPress={jest.fn()} accessibilityLabel="Unavailable research">
        <Text>Research</Text>
      </Surface>,
    );

    expect(
      screen.getByRole('button', { name: 'Unavailable research' }).props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('exposes tablist semantics on SegmentedControl', async () => {
    const onChange = jest.fn();
    const screen = await render(
      <SegmentedControl
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'holdings', label: 'Holdings' },
        ]}
        value="overview"
        onChange={onChange}
        testID="segmented-control"
      />,
    );

    expect(screen.getByTestId('segmented-control').props.accessibilityRole).toBe('tablist');
    fireEvent.press(screen.getByRole('tab', { name: 'Holdings' }));
    expect(onChange).toHaveBeenCalledWith('holdings');
  });

  it('links collapsible triggers to content and keeps touch targets', async () => {
    const screen = await render(
      <CollapsibleSection title="More detail" description="Hidden until expanded" defaultExpanded>
        <Text>Expanded body</Text>
      </CollapsibleSection>,
    );

    const trigger = screen.getByRole('button', { name: 'More detail' });
    expect(trigger.props.accessibilityState).toEqual(expect.objectContaining({ expanded: true }));
    expect(trigger.props['aria-controls']).toBeTruthy();
    expect(screen.getByText('Expanded body')).toBeTruthy();
    expect(getMinTouchTargetSize()).toBeGreaterThanOrEqual(44);
  });
});
