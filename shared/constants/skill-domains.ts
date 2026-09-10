/** Internal training domains. Scores are process evidence, never P/L. */

export type SkillDomain =
  | 'market_understanding'
  | 'chart_reading'
  | 'technical_analysis'
  | 'risk_management'
  | 'fundamental_analysis'
  | 'decision_making'
  | 'psychology'
  | 'portfolio_management'
  | 'process_discipline';

export const SKILL_DOMAIN_LABELS: Record<SkillDomain, string> = {
  market_understanding: 'Market Understanding',
  chart_reading: 'Chart Reading',
  technical_analysis: 'Technical Analysis',
  risk_management: 'Risk Management',
  fundamental_analysis: 'Fundamental Analysis',
  decision_making: 'Decision Making',
  psychology: 'Psychology',
  portfolio_management: 'Portfolio Management',
  process_discipline: 'Process Discipline',
};

export const SKILL_DOMAINS = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];

export const SKILL_DOMAIN_BLURB: Record<SkillDomain, string> = {
  market_understanding: 'Mechanics, asset classes, liquidity, and volatility — how markets actually work.',
  chart_reading: 'Trend, structure, support/resistance, candles, and volume.',
  technical_analysis: 'Setups, confirmation, divergence, momentum, and multiple timeframes.',
  risk_management: 'Size, reward-to-risk, stops, exposure, and drawdown.',
  fundamental_analysis: 'Earnings, cash flow, valuation, and competitive position as evidence — not a forecast.',
  decision_making: 'Thesis, evidence, assumptions, uncertainty, and invalidation.',
  psychology: 'FOMO, revenge, loss aversion, confirmation bias, and overconfidence.',
  portfolio_management: 'Allocation, diversification, correlation, and concentration.',
  process_discipline: 'Planning, journaling, review, and following the rules you wrote.',
};
