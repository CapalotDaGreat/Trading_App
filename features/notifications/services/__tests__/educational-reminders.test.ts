import {
  educationalReminderCopy,
  inQuietHours,
} from '../educational-reminders.service';

describe('educational reminders', () => {
  it('keeps reminder copy educational and free of signal language', () => {
    for (const kind of ['practice', 'journal', 'review', 'replay'] as const) {
      const copy = educationalReminderCopy(kind);
      expect(copy.title.length).toBeGreaterThan(3);
      expect(copy.body.toLowerCase()).not.toMatch(/buy now|sell now|guaranteed|signal alert/);
      expect(copy.body.toLowerCase()).toMatch(/education|educational|process|practice|journal|review|replay/);
    }
  });

  it('detects quiet hours spanning midnight', () => {
    const late = new Date('2026-09-15T23:30:00');
    const early = new Date('2026-09-15T06:00:00');
    const noon = new Date('2026-09-15T12:00:00');
    expect(inQuietHours(late, 22, 7)).toBe(true);
    expect(inQuietHours(early, 22, 7)).toBe(true);
    expect(inQuietHours(noon, 22, 7)).toBe(false);
  });
});
