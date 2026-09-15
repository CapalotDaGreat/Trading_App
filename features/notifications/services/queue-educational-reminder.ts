import type { EducationalReminderKind } from './educational-reminders.service';

/**
 * Fire-and-forget educational reminder. Uses require (not dynamic import) so Jest
 * and Metro stay compatible without --experimental-vm-modules.
 */
export function queueEducationalReminder(
  kind: EducationalReminderKind,
  delaySeconds?: number,
): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./educational-reminders.service') as typeof import('./educational-reminders.service');
    void mod.scheduleEducationalReminder(kind, delaySeconds);
  } catch {
    // Notifications optional in some runtimes / tests.
  }
}
