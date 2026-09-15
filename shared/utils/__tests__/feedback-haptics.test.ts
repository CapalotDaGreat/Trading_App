import * as Haptics from 'expo-haptics';

import { feedbackHaptic } from '@/shared/utils/feedback-haptics';
import { useSettingsStore } from '@/shared/stores/settings.store';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

describe('feedbackHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingsStore.setState({ hapticsEnabled: true });
  });

  it('fires success notification when haptics are enabled', () => {
    feedbackHaptic('success');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('no-ops when the user disables haptics', () => {
    useSettingsStore.setState({ hapticsEnabled: false });
    feedbackHaptic('selection');
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
