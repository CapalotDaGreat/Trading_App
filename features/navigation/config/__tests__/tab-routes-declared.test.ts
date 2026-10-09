import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const TABS_DIR = path.join(__dirname, '../../../../app/(tabs)');

describe('tab routes', () => {
  it('declares every route file in the tab layout so none appears as an unstyled default tab', () => {
    const layout = readFileSync(path.join(TABS_DIR, '_layout.tsx'), 'utf8');
    const routes = readdirSync(TABS_DIR)
      .filter((file) => file.endsWith('.tsx') && !file.startsWith('_'))
      .map((file) => file.replace(/\.tsx$/, ''));

    const undeclared = routes.filter((route) => !layout.includes(`name="${route}"`));
    expect(undeclared).toEqual([]);
  });

  it('keeps Events reachable as a route but out of the tab bar', () => {
    const layout = readFileSync(path.join(TABS_DIR, '_layout.tsx'), 'utf8');
    expect(layout).toMatch(/name="events" options=\{\{ href: null \}\}/);
  });
});
