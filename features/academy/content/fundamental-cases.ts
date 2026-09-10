/**
 * Simplified educational company snapshots.
 * Fictional names. Not a recommendation to buy, sell, or hold any security.
 */
export const FUNDAMENTAL_SAMPLE_DISCLAIMER =
  'Educational sample companies. Interpreting these figures is practice, not an investment recommendation.';

export interface EducationalCompanySnapshot {
  id: string;
  name: string;
  industry: string;
  revenueGrowth: string;
  operatingMargin: string;
  cashConversion: string;
  leverage: string;
  note: string;
}

export const CEDAR_RETAIL: EducationalCompanySnapshot = {
  id: 'cedar-retail',
  name: 'Cedar Retail Co.',
  industry: 'specialty retail (fictional)',
  revenueGrowth: '+4% year over year',
  operatingMargin: '11%, stable for three years',
  cashConversion: 'earnings mostly become cash',
  leverage: 'debt / equity 0.3',
  note: 'Slow growth, durable margins, modest obligations.',
};

export const HARBOR_COMPONENTS: EducationalCompanySnapshot = {
  id: 'harbor-components',
  name: 'Harbor Components Ltd.',
  industry: 'industrial parts (fictional)',
  revenueGrowth: '+28% year over year',
  operatingMargin: 'fell from 11% to 6% in two years',
  cashConversion: 'free cash flow negative while earnings are still positive',
  leverage: 'debt / equity rose from 0.4 to 1.1',
  note: 'Fast top-line with thinning margins, weaker cash, more debt.',
};

export const NORTHLINE_UTILITIES: EducationalCompanySnapshot = {
  id: 'northline-utilities',
  name: 'Northline Utilities',
  industry: 'regulated utility (fictional)',
  revenueGrowth: '+2% year over year',
  operatingMargin: 'steady, regulated',
  cashConversion: 'high conversion of earnings to cash',
  leverage: 'large long-term debt; a refinancing window in 18 months',
  note: 'Cash-generative, but the balance sheet is the risk file.',
};

export const BRIGHTCANVAS: EducationalCompanySnapshot = {
  id: 'brightcanvas',
  name: 'BrightCanvas Inc.',
  industry: 'design software (fictional)',
  revenueGrowth: '+18% year over year',
  operatingMargin: 'expanding, still below the largest peer',
  cashConversion: 'solid, subscription-heavy',
  leverage: 'net cash',
  note: 'High multiple versus peers. Switching-cost story. A new rival launched a free tier.',
};

export function formatCompanyCard(company: EducationalCompanySnapshot): string {
  return [
    `${company.name} — ${company.industry}`,
    `Revenue growth: ${company.revenueGrowth}`,
    `Operating margin: ${company.operatingMargin}`,
    `Cash conversion: ${company.cashConversion}`,
    `Leverage: ${company.leverage}`,
    company.note,
    FUNDAMENTAL_SAMPLE_DISCLAIMER,
  ].join('\n');
}

export function formatCompanyPair(
  left: EducationalCompanySnapshot,
  right: EducationalCompanySnapshot,
): string {
  return `${formatCompanyCard(left)}\n\n— versus —\n\n${formatCompanyCard(right)}`;
}
