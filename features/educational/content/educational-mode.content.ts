export const EDUCATIONAL_MODE_MISSION =
  'Helping traders make better decisions through education, research, and disciplined practice.';

export const EDUCATIONAL_MODE_SHEET = {
  title: 'Educational Mode',
  body: 'This feature is designed to help you learn trading concepts and improve your decision-making process.\n\nTradeVision AI does not execute trades, provide financial advice, or guarantee future performance.',
  bullets: [
    'Research and coaching — not brokerage',
    'Scores measure process quality, not price direction',
    'Practice in Lab and Replay without real money',
  ],
} as const;

export const EDUCATIONAL_INSIGHT_FOOTER = {
  title: 'Educational Insight',
  lines: [
    'Use this analysis as part of your own research process.',
    'Markets are uncertain.',
    'Good decisions are based on discipline, not predictions.',
  ],
} as const;

export const LAB_ONBOARDING = {
  title: 'Welcome to Decision Lab',
  body: 'Decision Lab is a risk-free environment designed to help you practice structured decision-making.',
  points: [
    { label: 'No real money', detail: 'Simulated cash only' },
    { label: 'No brokerage', detail: 'Nothing is sent to a broker' },
    { label: 'No investment advice', detail: 'You practice process, not tips' },
    { label: 'Process over profits', detail: 'Thesis quality beats simulated P&L' },
  ],
} as const;
