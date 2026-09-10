/** Visible primary tabs — training loop plus Market Events and You. Ask stays a route. */
export const PRIMARY_TAB_LABELS = [
  'Home',
  'Learn',
  'Practice',
  'Simulate',
  'Review',
  'Events',
  'You',
] as const;

export const IA_GLOSSARY = {
  home: 'Home',
  today: 'Home',
  learn: 'Learn',
  practice: 'Practice',
  simulate: 'Simulate',
  research: 'Study',
  review: 'Review',
  events: 'Events',
  ask: 'Ask',
  you: 'You',
  setups: 'Training recommendations',
  markets: 'Markets',
  marketCondition: 'Market condition',
  portfolioRisk: 'Portfolio risk',
  mentor: 'Mentor',
  simulator: 'Decision simulator',
  processTape: 'Process Tape',
  chartReplay: 'Chart Replay',
  replayTv: 'Decision Replay',
  journal: 'Journal',
  decisionHeatmap: 'Decision Heatmap',
  decisionLab: 'Decision Lab',
  strategySandbox: 'Strategy sandbox',
  portfolio: 'Simulate',
  alerts: 'Alerts',
  calendar: 'Market Events',
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

/** Educational research — not a live trading terminal. */
export const RESEARCH_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Learn the name',
    items: [
      {
        href: '/search',
        title: 'Search',
        description: 'Find lessons, drills, glossary terms, and educational charts.',
        accessibilityLabel: 'Open unified educational search',
        icon: 'search-outline',
        testID: 'research-search',
      },
      {
        href: '/academy',
        title: IA_GLOSSARY.learn,
        description: 'Academy paths for concepts behind any ticker you explore.',
        accessibilityLabel: 'Open Learn',
        icon: 'school-outline',
        testID: 'research-learn',
      },
    ],
  },
  {
    title: 'Explore (educational)',
    items: [
      {
        href: '/events',
        title: IA_GLOSSARY.events,
        description: 'Upcoming prints and why a trader might care — never a buy/sell call.',
        accessibilityLabel: 'Open Market Events',
        icon: 'calendar-outline',
        testID: 'research-events',
      },
      {
        href: '/markets',
        title: 'Study names',
        description: 'Browse sample or synthetic names before opening an educational chart.',
        accessibilityLabel: 'Open study names',
        icon: 'grid-outline',
        testID: 'research-markets',
      },
      {
        href: '/decision/radar',
        title: 'Training recommendations',
        description: 'What to practice next from your record — not a list of trades.',
        accessibilityLabel: 'Open training recommendations',
        icon: 'radio-outline',
        testID: 'research-setups',
      },
      {
        href: '/decision/regime',
        title: IA_GLOSSARY.marketCondition,
        description: 'What kind of tape this is, and which process fits.',
        accessibilityLabel: 'Open market condition',
        icon: 'pulse-outline',
        testID: 'research-market-condition',
      },
      {
        href: '/decision/risk',
        title: IA_GLOSSARY.portfolioRisk,
        description: 'Concentration and correlation before adding simulated risk.',
        accessibilityLabel: 'Open portfolio risk',
        icon: 'shield-checkmark-outline',
        testID: 'research-portfolio-risk',
      },
      {
        href: '/ai?source=research',
        title: IA_GLOSSARY.ask,
        description: 'Ask the on-device mentor about a concept or gap — never for a buy/sell call.',
        accessibilityLabel: 'Ask the educational mentor',
        icon: 'sparkles-outline',
        testID: 'research-ask',
      },
    ],
  },
];

export const PRACTICE_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Scenarios',
    items: [
      {
        href: '/decision/lab',
        title: IA_GLOSSARY.decisionLab,
        description: 'Thesis-first drills without live risk.',
        accessibilityLabel: 'Open Decision Lab',
        icon: 'flask-outline',
        testID: 'practice-decision-lab',
      },
      {
        href: '/decision/simulator',
        title: IA_GLOSSARY.simulator,
        description: 'Train decisions with future candles hidden.',
        accessibilityLabel: 'Open Decision Simulator',
        icon: 'fitness-outline',
        testID: 'practice-simulator',
      },
      {
        href: '/decision/decision-replay?segment=chart',
        title: IA_GLOSSARY.chartReplay,
        description: 'Replay charts without peeking ahead.',
        accessibilityLabel: 'Open Chart Replay',
        icon: 'analytics-outline',
        testID: 'practice-chart-replay',
      },
      {
        href: '/decision/replay-tv',
        title: IA_GLOSSARY.replayTv,
        description: 'Historical decision rooms. Outcome does not grade the process alone.',
        accessibilityLabel: 'Open Decision Replay',
        icon: 'film-outline',
        testID: 'practice-replay-tv',
      },
    ],
  },
];

/** Review: learn from your own behavior — not a P&L dashboard. */
export const REVIEW_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Your work',
    items: [
      {
        href: '/journal',
        title: IA_GLOSSARY.journal,
        description: 'Thesis, evidence, and what you would do differently.',
        accessibilityLabel: 'Open journal',
        icon: 'book-outline',
        testID: 'review-journal',
      },
      {
        href: '/simulate',
        title: 'Simulation history',
        description: 'Paper-trading ledger. P&L is context, not a grade.',
        accessibilityLabel: 'Open simulated portfolio history',
        icon: 'briefcase-outline',
        testID: 'review-simulation',
      },
      {
        href: '/decision/decision-replay?segment=process',
        title: IA_GLOSSARY.processTape,
        description: 'What you researched, skipped, and recorded.',
        accessibilityLabel: 'Open Process Tape',
        icon: 'film-outline',
        testID: 'review-process-tape',
      },
    ],
  },
  {
    title: 'Patterns',
    items: [
      {
        href: '/decision/intelligence',
        title: IA_GLOSSARY.tradingDna,
        description: 'Who you are becoming — from your records, not invented stats.',
        accessibilityLabel: 'Open Trading DNA',
        icon: 'finger-print-outline',
        testID: 'review-trading-dna',
      },
      {
        href: '/decision/heatmap',
        title: IA_GLOSSARY.decisionHeatmap,
        description: 'Process consistency over time.',
        accessibilityLabel: 'Open Decision Heatmap',
        icon: 'grid-outline',
        testID: 'review-decision-heatmap',
      },
      {
        href: '/decision/passport',
        title: IA_GLOSSARY.passport,
        description: 'Process milestones — never P&L trophies.',
        accessibilityLabel: 'Open Decision Passport',
        icon: 'analytics-outline',
        testID: 'review-passport',
      },
    ],
  },
  {
    title: 'Replay',
    items: [
      {
        href: '/decision/replay-tv',
        title: IA_GLOSSARY.replayTv,
        description: 'Continue a blind historical decision session.',
        accessibilityLabel: 'Continue Decision Replay',
        icon: 'film-outline',
        testID: 'review-replay-tv',
      },
    ],
  },
];

/** You: profile, progress, settings, subscription, privacy, account, data. */
export const YOU_HUB_SECTIONS: readonly NavigationHubSection[] = [
  {
    title: 'Profile',
    items: [
      {
        href: '/settings/profile',
        title: 'Profile',
        description: 'Display name, currency, and how this device labels amounts.',
        accessibilityLabel: 'Open profile',
        icon: 'compass-outline',
        testID: 'you-profile',
      },
      {
        href: '/onboarding',
        title: 'Learning profile',
        description: 'Experience, goals, and topics. Not a suitability questionnaire.',
        accessibilityLabel: 'Edit learning profile',
        icon: 'school-outline',
        testID: 'you-learning-profile',
      },
    ],
  },
  {
    title: 'Progress',
    items: [
      {
        href: '/learn',
        title: 'Academy progress',
        description: 'Paths, lessons, and what to study next.',
        accessibilityLabel: 'Open Academy progress',
        icon: 'school-outline',
        testID: 'you-learn',
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
        href: '/decision/intelligence',
        title: IA_GLOSSARY.tradingDna,
        description: 'Personal patterns from journal and practice evidence.',
        accessibilityLabel: 'Open Trading DNA',
        icon: 'finger-print-outline',
        testID: 'you-trading-dna',
      },
      {
        href: '/readiness',
        title: 'Training readiness',
        description: 'Strengths and gaps in your training record — never a live-trading certificate.',
        accessibilityLabel: 'Open training readiness',
        icon: 'shield-checkmark-outline',
        testID: 'you-readiness',
      },
      {
        href: '/academy/lesson/prep-simulation-vs-live',
        title: 'Simulation vs real money',
        description: 'Why paper profit is not permission to trade live.',
        accessibilityLabel: 'Open simulation versus real money lesson',
        icon: 'book-outline',
        testID: 'you-real-money-prep',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        href: '/settings',
        title: IA_GLOSSARY.settings,
        description: 'Theme, notifications, accessibility, and preferences.',
        accessibilityLabel: 'Open settings',
        icon: 'settings-outline',
        testID: 'you-settings',
      },
      {
        href: '/subscription',
        title: IA_GLOSSARY.subscription,
        description: 'Free teaches. Premium unlocks depth.',
        accessibilityLabel: 'Open subscription',
        icon: 'card-outline',
        testID: 'you-subscription',
      },
      {
        href: '/settings/privacy',
        title: 'Privacy',
        description: 'What this device stores and how coaching uses it.',
        accessibilityLabel: 'Open privacy',
        icon: 'shield-checkmark-outline',
        testID: 'you-privacy',
      },
      {
        href: '/settings/privacy?focus=export',
        title: 'Data management',
        description: 'Export or clear local learning records.',
        accessibilityLabel: 'Open data management',
        icon: 'grid-outline',
        testID: 'you-data',
      },
    ],
  },
];
