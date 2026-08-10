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
  mentor: 'Mentor',
  simulator: 'Simulator',
  processTape: 'Process Tape',
  chartReplay: 'Chart Replay',
  replayTv: 'Decision Replay TV',
  journal: 'Journal',
  decisionHeatmap: 'Decision Heatmap',
  decisionLab: 'Decision Lab',
  learn: 'Learn',
  strategySandbox: 'Strategy sandbox',
  portfolio: 'Portfolio',
  alerts: 'Alerts',
  calendar: 'Calendar',
  settings: 'Settings',
  subscription: 'Subscription',
  tradingDna: 'Trading DNA',
  passport: 'Decision Passport',
} as const;

export type NavigationIconName =
  | 'analytics-outline'
  | 'book-outline'
  | 'briefcase-outline'
  | 'calendar-outline'
  | 'card-outline'
  | 'compass-outline'
  | 'finger-print-outline'
  | 'film-outline'
  | 'fitness-outline'
  | 'flask-outline'
  | 'grid-outline'
  | 'notifications-outline'
  | 'pulse-outline'
  | 'radio-outline'
  | 'school-outline'
  | 'search-outline'
  | 'settings-outline'
  | 'shield-checkmark-outline'
  | 'sparkles-outline';

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

/** Research: Start (queue) → Deepen (context). */
export const RESEARCH_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Start',
    items: [
      {
        href: '/decision/radar',
        title: IA_GLOSSARY.setups,
        description: 'What deserves research time right now.',
        accessibilityLabel: 'Open Setups research queue',
        icon: 'radio-outline',
        testID: 'research-setups',
      },
    ],
  },
  {
    title: 'Deepen',
    items: [
      {
        href: '/markets',
        title: IA_GLOSSARY.markets,
        description: 'Browse or search before opening a chart.',
        accessibilityLabel: 'Open Markets browse and search',
        icon: 'search-outline',
        testID: 'research-markets',
      },
      {
        href: '/decision/regime',
        title: IA_GLOSSARY.marketCondition,
        description: 'Whether conditions support focused research.',
        accessibilityLabel: 'Open market condition',
        icon: 'pulse-outline',
        testID: 'research-market-condition',
      },
      {
        href: '/decision/risk',
        title: IA_GLOSSARY.portfolioRisk,
        description: 'Concentration and correlation before adding risk.',
        accessibilityLabel: 'Open portfolio risk',
        icon: 'shield-checkmark-outline',
        testID: 'research-portfolio-risk',
      },
      {
        href: '/ai?source=research',
        title: IA_GLOSSARY.ask,
        description: 'Ask about evidence, uncertainty, or what to research next.',
        accessibilityLabel: 'Ask about your research context',
        icon: 'sparkles-outline',
        testID: 'research-ask',
      },
    ],
  },
];

/** Review: Continue → Reflect → Practice → Learn. */
export const REVIEW_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Continue',
    items: [
      {
        href: '/decision/decision-replay?segment=process',
        title: IA_GLOSSARY.processTape,
        description: 'What you researched, skipped, and recorded.',
        accessibilityLabel: 'Continue Process Tape review',
        icon: 'film-outline',
        testID: 'review-process-tape',
      },
      {
        href: '/decision/replay-tv',
        title: IA_GLOSSARY.replayTv,
        description: 'Continue a blind historical decision session.',
        accessibilityLabel: 'Continue Decision Replay TV',
        icon: 'film-outline',
        testID: 'review-replay-tv',
      },
    ],
  },
  {
    title: 'Reflect',
    items: [
      {
        href: '/journal',
        title: IA_GLOSSARY.journal,
        description: 'Learning journey — timeline, reviews, DNA, and coaching.',
        accessibilityLabel: 'Open decision journal learning journey',
        icon: 'book-outline',
        testID: 'review-journal',
      },
      {
        href: '/decision/heatmap',
        title: IA_GLOSSARY.decisionHeatmap,
        description: 'Process consistency over time.',
        accessibilityLabel: 'Open Decision Heatmap',
        icon: 'grid-outline',
        testID: 'review-decision-heatmap',
      },
    ],
  },
  {
    title: 'Practice',
    items: [
      {
        href: '/decision/simulator',
        title: IA_GLOSSARY.simulator,
        description: 'Train decisions with future candles hidden.',
        accessibilityLabel: 'Open Decision Simulator practice',
        icon: 'fitness-outline',
        testID: 'review-simulator',
      },
      {
        href: '/decision/decision-replay?segment=chart',
        title: IA_GLOSSARY.chartReplay,
        description: 'Replay charts without peeking ahead.',
        accessibilityLabel: 'Open Chart Replay practice',
        icon: 'analytics-outline',
        testID: 'review-chart-replay',
      },
      {
        href: '/decision/lab',
        title: IA_GLOSSARY.decisionLab,
        description: 'Thesis-first practice without live risk.',
        accessibilityLabel: 'Open Decision Lab practice',
        icon: 'flask-outline',
        testID: 'review-decision-lab',
      },
    ],
  },
  {
    title: 'Learn',
    items: [
      {
        href: '/academy',
        title: IA_GLOSSARY.learn,
        description: 'Lessons and checklists for better habits.',
        accessibilityLabel: 'Open Learn lessons and checklists',
        icon: 'school-outline',
        testID: 'review-learn',
      },
      {
        href: '/analysis/backtest',
        title: IA_GLOSSARY.strategySandbox,
        description: 'Simple rules on sample generated history.',
        accessibilityLabel: 'Open strategy sandbox with sample data',
        icon: 'analytics-outline',
        testID: 'review-strategy-sandbox',
      },
    ],
  },
];

/** You: Growth → Desk → Account. */
export const YOU_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Growth',
    items: [
      {
        href: '/decision/mentor',
        title: IA_GLOSSARY.mentor,
        description: 'Your process priority, repeated pattern, and next exercise.',
        accessibilityLabel: 'Open your trading mentor',
        icon: 'compass-outline',
        testID: 'you-mentor',
      },
      {
        href: '/decision/intelligence',
        title: IA_GLOSSARY.tradingDna,
        description: 'Who you are becoming as a trader.',
        accessibilityLabel: 'Open Trading DNA',
        icon: 'finger-print-outline',
        testID: 'you-trading-dna',
      },
      {
        href: '/decision/passport',
        title: IA_GLOSSARY.passport,
        description: 'Process milestones — never P&L trophies.',
        accessibilityLabel: 'Open Decision Passport',
        icon: 'analytics-outline',
        testID: 'you-passport',
      },
      {
        href: '/academy',
        title: IA_GLOSSARY.learn,
        description: 'Continue lessons matched to your process.',
        accessibilityLabel: 'Open Learn lessons and checklists',
        icon: 'school-outline',
        testID: 'you-learn',
      },
    ],
  },
  {
    title: 'Desk',
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
        description: 'Levels that need your attention.',
        accessibilityLabel: 'Open your alerts',
        icon: 'notifications-outline',
        testID: 'you-alerts',
      },
      {
        href: '/calendar',
        title: IA_GLOSSARY.calendar,
        description: 'Events that may change conditions.',
        accessibilityLabel: 'Open market calendar',
        icon: 'calendar-outline',
        testID: 'you-calendar',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        href: '/settings',
        title: IA_GLOSSARY.settings,
        description: 'Theme, privacy, data, and preferences.',
        accessibilityLabel: 'Open settings',
        icon: 'settings-outline',
        testID: 'you-settings',
      },
      {
        href: '/subscription',
        title: IA_GLOSSARY.subscription,
        description: 'Plan and access.',
        accessibilityLabel: 'Open subscription',
        icon: 'card-outline',
        testID: 'you-subscription',
      },
    ],
  },
];
