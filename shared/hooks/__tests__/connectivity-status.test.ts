import { inQuietHours } from '@/features/notifications/services/educational-reminders.service';

describe('connectivity / reminder helpers', () => {
  it('exports quiet-hours helper for offline-first notification gating', () => {
    expect(typeof inQuietHours).toBe('function');
  });
});
