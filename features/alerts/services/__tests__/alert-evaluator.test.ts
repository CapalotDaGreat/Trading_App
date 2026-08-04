const mockGetAlerts = jest.fn();
const mockMarkAlertTriggered = jest.fn();
const mockFetchQuotes = jest.fn();
const mockPresentLocalNotification = jest.fn();

jest.mock('../alert.service', () => ({
  getAlerts: (...args: unknown[]) => mockGetAlerts(...args),
  markAlertTriggered: (...args: unknown[]) => mockMarkAlertTriggered(...args),
}));

jest.mock('@/features/markets/services/market-data.service', () => ({
  fetchQuotes: (...args: unknown[]) => mockFetchQuotes(...args),
}));

jest.mock('@/features/notifications/services/notification.service', () => ({
  notificationService: {
    presentLocalNotification: (...args: unknown[]) => mockPresentLocalNotification(...args),
    scheduleLocalNotification: jest.fn(),
  },
}));

jest.mock('@/shared/services/observability/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { AppState } from 'react-native';

import { evaluateAlertsForUser } from '../alert-evaluator.service';

describe('evaluateAlertsForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      value: 'background',
    });
    mockGetAlerts.mockResolvedValue([
      {
        id: 'a1',
        symbol: 'AAPL',
        targetPrice: 100,
        condition: 'above',
        isActive: true,
        triggeredAt: null,
      },
    ]);
    mockFetchQuotes.mockResolvedValue([{ symbol: 'AAPL', price: 101 }]);
    mockMarkAlertTriggered.mockResolvedValue(undefined);
    mockPresentLocalNotification.mockResolvedValue('n1');
  });

  it('no-ops when inactive unless allowInactive is set', async () => {
    await expect(evaluateAlertsForUser('u1')).resolves.toBe(0);
    expect(mockGetAlerts).not.toHaveBeenCalled();

    await expect(evaluateAlertsForUser('u1', { allowInactive: true })).resolves.toBe(1);
    expect(mockMarkAlertTriggered).toHaveBeenCalledWith('u1', 'a1');
    expect(mockPresentLocalNotification).toHaveBeenCalled();
  });
});
