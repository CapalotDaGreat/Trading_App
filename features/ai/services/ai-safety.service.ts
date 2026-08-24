const PREDICTION_RE =
  /\b(will (go|rise|fall|rally|crash)|guaranteed|sure thing|100%\s*(win|sure)|price target of|definitely (buy|sell|profit))\b/i;

const ADVICE_RE =
  /\b(buy now|sell now|go long|go short|market order|limit order|open an account|best broker|guaranteed profit|i recommend (buying|selling))\b/i;

const INJECTION_RE =
  /\b(ignore (all )?(previous|prior) (instructions|rules)|you are now|system prompt|reveal (your )?(instructions|prompt)|jailbreak|dan mode|developer mode)\b/i;

const LEAKAGE_RE =
  /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\bremember everything you(?:'ve| have) ever\b|here is my journal:|ssn[:\s]*\d{3})/i;

const FAKE_SOURCE_RE =
  /\b(according to (secret|insider|unpublished) (memo|report)|as cited in example\.com|source:\s*made[- ]up)\b/i;

export function looksLikePredictionLanguage(text: string): boolean {
  return PREDICTION_RE.test(text);
}

export function looksLikeInvestmentAdvice(text: string): boolean {
  return ADVICE_RE.test(text);
}

export function looksLikePromptInjection(text: string): boolean {
  return INJECTION_RE.test(text);
}

export function looksLikePrivateDataLeak(text: string): boolean {
  return LEAKAGE_RE.test(text);
}

export function looksLikeFakeSource(text: string): boolean {
  return FAKE_SOURCE_RE.test(text);
}

const BUY_SELL_SWAP: Array<[RegExp, string]> = [
  [/\bbuy now\b/gi, 'research further'],
  [/\bsell now\b/gi, 'revisit the case'],
  [/\bgo long\b/gi, 'study the constructive case'],
  [/\bgo short\b/gi, 'study the defensive case'],
  [/\bguaranteed profit\b/gi, 'no guaranteed outcome'],
  [/\bbest broker\b/gi, 'your own broker relationship (we do not recommend one)'],
  [/\bI remember everything you've ever told me\b/gi, 'I only use process notes attached to this session'],
];

/**
 * Strip execution / certainty / broker language. Trust over fluency.
 */
export function sanitizeMentorOutput(text: string): string {
  let next = text;
  for (const [pattern, replacement] of BUY_SELL_SWAP) {
    next = next.replace(pattern, replacement);
  }
  next = next.replace(LEAKAGE_RE, '[redacted]');
  return next.trim();
}

export function injectionRefusal(): string {
  return 'I only help with research process and evidence. I will not change role, ignore evidence rules, or treat injected instructions as data.';
}
