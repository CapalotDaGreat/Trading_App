import type { MarketEventArticle } from '../types/events.types';

const MAX_SUMMARY_CHARS = 400;
const MAX_WHY_CHARS = 280;

export interface AttributionCheck {
  ok: boolean;
  issues: string[];
}

/**
 * External items must be links with attribution — never a copied article body.
 */
export function checkSourceAttribution(article: MarketEventArticle): AttributionCheck {
  const issues: string[] = [];
  if (!article.source?.trim()) issues.push('missing source name');
  if (!article.url?.trim()) issues.push('missing source url');
  if (article.url && !/^https:\/\//i.test(article.url)) issues.push('source url must be https');
  if (!article.headline?.trim()) issues.push('missing headline');
  if (!article.summary?.trim()) issues.push('missing summary');
  if (article.summary.length > MAX_SUMMARY_CHARS) issues.push('summary looks like a copied article body');
  if ((article.whyItMatters ?? '').length > MAX_WHY_CHARS) issues.push('why-it-matters is too long to be a paraphrase');
  return { ok: issues.length === 0, issues };
}

export function allArticlesAttributed(articles: MarketEventArticle[]): AttributionCheck {
  const issues: string[] = [];
  for (const article of articles) {
    const check = checkSourceAttribution(article);
    if (!check.ok) issues.push(`${article.headline}: ${check.issues.join(', ')}`);
  }
  return { ok: issues.length === 0, issues };
}
