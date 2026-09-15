const mockScheduleEducationalReminder = jest.fn();

jest.mock('../educational-reminders.service', () => ({
  scheduleEducationalReminder: (...args: unknown[]) => mockScheduleEducationalReminder(...args),
}));

import { queueEducationalReminder } from '../queue-educational-reminder';

describe('queueEducationalReminder', () => {
  beforeEach(() => {
    mockScheduleEducationalReminder.mockClear();
  });

  it('forwards kind and delay to the educational reminder service', () => {
    queueEducationalReminder('journal', 3600);
    expect(mockScheduleEducationalReminder).toHaveBeenCalledWith('journal', 3600);
  });

  it('accepts practice and review kinds without throwing', () => {
    expect(() => queueEducationalReminder('practice')).not.toThrow();
    expect(() => queueEducationalReminder('review', 120)).not.toThrow();
    expect(mockScheduleEducationalReminder).toHaveBeenCalledWith('practice', undefined);
    expect(mockScheduleEducationalReminder).toHaveBeenCalledWith('review', 120);
  });
});
