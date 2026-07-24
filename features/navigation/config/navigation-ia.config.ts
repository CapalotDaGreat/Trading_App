export const IA_GLOSSARY = {
  today: 'Today',
  research: 'Research',
  review: 'Review',
  ask: 'Ask',
  you: 'You',
  setups: 'Setups',
  markets: 'Markets',
  marketCondition: 'Market condition',
  portfolioRisk: 'Portfolio risk',
  processTape: 'Process Tape',
  chartReplay: 'Chart Replay',
  journal: 'Journal',
  decisionLab: 'Decision Lab',
  learn: 'Learn',
  strategySandbox: 'Strategy sandbox',
  portfolio: 'Portfolio',
  alerts: 'Alerts',
  calendar: 'Calendar',
  settings: 'Settings',
  subscription: 'Subscription',
} as const;

export type NavigationIconName =
  | 'analytics-outline'
  | 'book-outline'
  | 'briefcase-outline'
  | 'calendar-outline'
  | 'card-outline'
  | 'film-outline'
  | 'flask-outline'
  | 'notifications-outline'
  | 'pulse-outline'
  | 'radio-outline'
  | 'school-outline'
  | 'search-outline'
  | 'settings-outline'
  | 'shield-checkmark-outline';

export interface NavigationHubItem {
  href: string;
  title: string;
  description: string;
  accessibilityLabel: string;
  icon: NavigationIconName;
  testID: string;
}

export interface NavigationHubSection {
  title: string;
  items: readonly NavigationHubItem[];
}

export const RESEARCH_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Research queue',
    items: [
      {
        href: '/decision/radar',
        title: IA_GLOSSARY.setups,
        description: 'Rank ideas, then choose what deserves deeper research.',
        accessibilityLabel: 'Open Setups research queue',
        icon: 'radio-outline',
        testID: 'research-setups',
      },
    ],
  },
  {
    title: 'Research context',
    items: [
      {
        href: '/markets',
        title: IA_GLOSSARY.markets,
        description: 'Browse or search symbols before opening a chart.',
        accessibilityLabel: 'Open Markets browse and search',
        icon: 'search-outline',
        testID: 'research-markets',
      },
      {
        href: '/decision/regime',
        title: IA_GLOSSARY.marketCondition,
        description: 'Check whether conditions support focused research.',
        accessibilityLabel: 'Open market condition',
        icon: 'pulse-outline',
        testID: 'research-market-condition',
      },
      {
        href: '/decision/risk',
        title: IA_GLOSSARY.portfolioRisk,
        description: 'Check concentration and correlation before adding risk.',
        accessibilityLabel: 'Open portfolio risk',
        icon: 'shield-checkmark-outline',
        testID: 'research-portfolio-risk',
      },
    ],
  },
];

export const REVIEW_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Review decisions',
    items: [
      {
        href: '/decision/decision-replay?segment=process',
        title: IA_GLOSSARY.processTape,
        description: 'Revisit what you researched, skipped, and recorded.',
        accessibilityLabel: 'Open Process Tape review',
        icon: 'film-outline',
        testID: 'review-process-tape',
      },
      {
        href: '/decision/decision-replay?segment=chart',
        title: IA_GLOSSARY.chartReplay,
        description: 'Replay charts without revealing what happened next.',
        accessibilityLabel: 'Open Chart Replay practice',
        icon: 'analytics-outline',
        testID: 'review-chart-replay',
      },
      {
        href: '/journal',
        title: IA_GLOSSARY.journal,
        description: 'Capture the reasoning behind decisions and outcomes.',
        accessibilityLabel: 'Open decision journal',
        icon: 'book-outline',
        testID: 'review-journal',
      },
    ],
  },
  {
    title: 'Practice the process',
    items: [
      {
        href: '/decision/lab',
        title: IA_GLOSSARY.decisionLab,
        description: 'Practice thesis-first decisions without live risk.',
        accessibilityLabel: 'Open Decision Lab practice',
        icon: 'flask-outline',
        testID: 'review-decision-lab',
      },
      {
        href: '/academy',
        title: IA_GLOSSARY.learn,
        description: 'Build decision habits with lessons and checklists.',
        accessibilityLabel: 'Open Learn lessons and checklists',
        icon: 'school-outline',
        testID: 'review-learn',
      },
      {
        href: '/analysis/backtest',
        title: IA_GLOSSARY.strategySandbox,
        description: 'Test simple rules on sample generated history.',
        accessibilityLabel: 'Open strategy sandbox with sample data',
        icon: 'analytics-outline',
        testID: 'review-strategy-sandbox',
      },
    ],
  },
];

export const YOU_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Your trading',
    items: [
      {
        href: '/portfolio',
        title: IA_GLOSSARY.portfolio,
        description: 'Holdings, performance, and position sizing.',
        accessibilityLabel: 'Open your portfolio',
        icon: 'briefcase-outline',
        testID: 'you-portfolio',
      },
      {
        href: '/alerts',
        title: IA_GLOSSARY.alerts,
        description: 'Review price levels that need your attention.',
        accessibilityLabel: 'Open your alerts',
        icon: 'notifications-outline',
        testID: 'you-alerts',
      },
      {
        href: '/calendar',
        title: IA_GLOSSARY.calendar,
        description: 'See events that may change market conditions.',
        accessibilityLabel: 'Open market calendar',
        icon: 'calendar-outline',
        testID: 'you-calendar',
      },
    ],
  },
  {
    title: 'Account and learning',
    items: [
      {
        href: '/settings',
        title: IA_GLOSSARY.settings,
        description: 'Manage your account, theme, data, and preferences.',
        accessibilityLabel: 'Open settings',
        icon: 'settings-outline',
        testID: 'you-settings',
      },
      {
        href: '/subscription',
        title: IA_GLOSSARY.subscription,
        description: 'View your plan and available access.',
        accessibilityLabel: 'Open subscription',
        icon: 'card-outline',
        testID: 'you-subscription',
      },
      {
        href: '/academy',
        title: IA_GLOSSARY.learn,
        description: 'Continue lessons and decision checklists.',
        accessibilityLabel: 'Open Learn lessons and checklists',
        icon: 'school-outline',
        testID: 'you-learn',
      },
    ],
  },
];
