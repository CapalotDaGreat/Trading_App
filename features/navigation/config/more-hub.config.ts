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
    | 'settings-outline'
    | 'compass-outline'
    | 'fitness-outline'
    | 'ribbon-outline'
    | 'grid-outline';
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
      {
        href: '/decision/heatmap',
        title: 'Decision Heatmap',
        description: 'Process consistency across days — never P&L',
        icon: 'grid-outline',
        testID: 'more-decision-heatmap',
      },
    ],
  },
  {
    title: 'Practice',
    hint: 'Build skill without live risk',
    items: [
      {
        href: '/decision/mentor',
        title: 'Trading Mentor',
        description: 'Daily focus and weekly process coaching',
        icon: 'compass-outline',
        testID: 'more-trading-mentor',
      },
      {
        href: '/decision/simulator',
        title: 'Decision Simulator',
        description: 'Train decisions with future candles hidden',
        icon: 'fitness-outline',
        testID: 'more-decision-simulator',
      },
      {
        href: '/decision/replay-tv',
        title: 'Decision Replay TV',
        description: 'Famous historical episodes — blind tape, process scores',
        icon: 'film-outline',
        testID: 'more-replay-tv',
      },
      {
        href: '/decision/intelligence',
        title: 'Personal Intelligence',
        description: 'Trading DNA, Decision Graph, and who you are becoming',
        icon: 'analytics-outline',
        testID: 'more-personal-intelligence',
      },
      {
        href: '/decision/passport',
        title: 'Decision Passport',
        description: 'Process credentials from practice loops',
        icon: 'ribbon-outline',
        testID: 'more-decision-passport',
      },
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
