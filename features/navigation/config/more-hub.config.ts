export interface MoreHubItem {
  href: string;
  title: string;
  description: string;
  icon:
    | 'flash-outline'
    | 'radio-outline'
    | 'pulse-outline'
    | 'shield-checkmark-outline'
    | 'film-outline'
    | 'flask-outline'
    | 'analytics-outline'
    | 'school-outline'
    | 'notifications-outline'
    | 'calendar-outline'
    | 'settings-outline';
  testID: string;
}

export interface MoreHubSection {
  title: 'Decide' | 'Review' | 'Practice' | 'Stay on Top';
  hint: string;
  items: MoreHubItem[];
}

export const MORE_HUB_SECTIONS: MoreHubSection[] = [
  {
    title: 'Decide',
    hint: 'Choose what deserves attention',
    items: [
      {
        href: '/',
        title: 'Daily',
        description: 'Today’s brief and research queue',
        icon: 'flash-outline',
        testID: 'more-daily',
      },
      {
        href: '/decision/radar',
        title: 'Setups',
        description: 'Ranked ideas worth researching',
        icon: 'radio-outline',
        testID: 'more-setups',
      },
      {
        href: '/decision/regime',
        title: 'Market condition',
        description: 'Risk-on, chop, or high volatility',
        icon: 'pulse-outline',
        testID: 'more-market-condition',
      },
      {
        href: '/decision/risk',
        title: 'Portfolio risk',
        description: 'Concentration and correlation',
        icon: 'shield-checkmark-outline',
        testID: 'more-portfolio-risk',
      },
    ],
  },
  {
    title: 'Review',
    hint: 'Reflect on decisions and history',
    items: [
      {
        href: '/decision/decision-replay',
        title: 'Review',
        description: 'Process Tape and Chart Replay in one place',
        icon: 'film-outline',
        testID: 'more-review',
      },
    ],
  },
  {
    title: 'Practice',
    hint: 'Build skill without live risk',
    items: [
      {
        href: '/decision/lab',
        title: 'Decision Lab',
        description: 'Thesis-first paper practice',
        icon: 'flask-outline',
        testID: 'more-decision-lab',
      },
      {
        href: '/analysis/backtest',
        title: 'Strategy sandbox — sample data',
        description: 'Test simple rules on generated history',
        icon: 'analytics-outline',
        testID: 'more-strategy-sandbox',
      },
      {
        href: '/academy',
        title: 'Learn',
        description: 'Lessons and decision checklists',
        icon: 'school-outline',
        testID: 'more-learn',
      },
    ],
  },
  {
    title: 'Stay on Top',
    hint: 'Alerts, calendar, and settings',
    items: [
      {
        href: '/alerts',
        title: 'Alerts',
        description: 'Know when price reaches your level',
        icon: 'notifications-outline',
        testID: 'more-alerts',
      },
      {
        href: '/calendar',
        title: 'Calendar',
        description: 'Events that can move markets',
        icon: 'calendar-outline',
        testID: 'more-calendar',
      },
      {
        href: '/settings',
        title: 'Settings',
        description: 'Theme, account, and preferences',
        icon: 'settings-outline',
        testID: 'more-settings',
      },
    ],
  },
];
