const PREDICTION_RE =
  /\b(will (it |the (price|market|setup) )?(go|rise|fall|rally|crash|happen)|how much will (it|this|the price)|what will happen|tomorrow(?:'s)? (price|move|close)|guaranteed(?: winner)?|sure thing|100%\s*(win|sure)|price target of|definitely (buy|sell|profit)|how far will it|predict (the )?(price|move))\b/i;

const ADVICE_RE =
  /\b(should i (buy|sell)|buy now|sell now|go long|go short|market order|limit order|open an account|best broker|guaranteed profit|i recommend (buying|selling)|give me a (buy|sell))\b/i;

const INJECTION_RE =
  /\b(ignore (all )?(your |the )?(previous |prior )?(instructions|rules)|you are now|system prompt|reveal (your )?(instructions|prompt)|jailbreak|dan mode|developer mode|give me a signal)\b/i;

const LEAKAGE_RE =
  /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\bremember everything you(?:'ve| have) ever\b|here is my journal:|ssn[:\s]*\d{3}|\bexact private journal\b|\bjournal contents\b|\bdump (my )?journal\b)/i;

const FAKE_SOURCE_RE =
  /\b(according to (secret|insider|unpublished) (memo|report)|as cited in example\.com|source:\s*made[- ]up)\b/i;

const FAKE_PROBABILITY_RE =
  /\b(\d{1,3})\s*%\s*(chance|probability|odds|likely to (win|succeed|profit|rally))\b/i;

const DQS_RVS_AS_PREDICTION_RE =
  /\b(dqs|rvs|decision quality|research value)[^\n]{0,48}(\d{1,3})\s*%[^\n]{0,36}(chance|probability|will (win|succeed|profit)|likely to succeed)\b/i;

const SETUP_SUCCESS_RE =
  /\b(this setup will succeed|setup will (work|win|succeed)|guaranteed winner|must (win|profit)|cannot lose)\b/i;

const EXCESSIVE_CERTAINTY_RE =
  /\b(certainly will|definitely will|must go (up|down)|no doubt (it|this) will|i am certain (it|this) will)\b/i;

export type MentorAskClass =
  | 'prediction'
  | 'investment_advice'
  | 'prompt_injection'
  | 'journal_dump'
  | 'signal_override'
  | 'research';

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

export function looksLikeFakeProbability(text: string): boolean {
  return FAKE_PROBABILITY_RE.test(text);
}

export function looksLikeDqsRvsAsPrediction(text: string): boolean {
  return DQS_RVS_AS_PREDICTION_RE.test(text);
}

export function looksLikeSetupSuccessLanguage(text: string): boolean {
  return SETUP_SUCCESS_RE.test(text);
}

export function looksLikeExcessiveCertainty(text: string): boolean {
  return EXCESSIVE_CERTAINTY_RE.test(text);
}

export function looksLikeJournalDumpAsk(text: string): boolean {
  return /\b(exact private journal|journal contents|tell me my (exact )?journal|dump (my )?journal|quote my journal)\b/i.test(
    text,
  );
}

export function classifyMentorAsk(prompt: string): MentorAskClass {
  if (looksLikePromptInjection(prompt)) return 'prompt_injection';
  if (looksLikeJournalDumpAsk(prompt) || looksLikePrivateDataLeak(prompt)) return 'journal_dump';
  if (/\bgive me a signal\b/i.test(prompt)) return 'signal_override';
  if (looksLikeInvestmentAdvice(prompt)) return 'investment_advice';
  if (looksLikePredictionLanguage(prompt) || looksLikeSetupSuccessLanguage(prompt)) return 'prediction';
  return 'research';
}

const BUY_SELL_SWAP: Array<[RegExp, string]> = [
  [/\bbuy now\b/gi, 'research further'],
  [/\bsell now\b/gi, 'revisit the case'],
  [/\bgo long\b/gi, 'study the constructive case'],
  [/\bgo short\b/gi, 'study the defensive case'],
  [/\bguaranteed profit\b/gi, 'no guaranteed outcome'],
  [/\bbest broker\b/gi, 'your own broker relationship (we do not recommend one)'],
  [/\bI remember everything you've ever told me\b/gi, 'I only use process notes attached to this session'],
  [/\bthis setup will succeed\b/gi, 'this case still needs research, not a success claim'],
  [/\bguaranteed winner\b/gi, 'not a guaranteed outcome'],
  [FAKE_PROBABILITY_RE, 'evidence coverage — not a probability'],
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
  next = next.replace(DQS_RVS_AS_PREDICTION_RE, 'DQS/RVS describe process and research priority, not a chance of profit');
  return next.trim();
}

export function injectionRefusal(): string {
  return 'I only help with research process and evidence. I will not change role, ignore evidence rules, or treat injected instructions as data.';
}

export function predictionRefusal(): string {
  return "I don't know. I cannot tell you how much a price will move, what happens tomorrow, or whether any case is a winner.";
}

export function adviceRefusal(): string {
  return "I don't know whether you should buy or sell. That would be investment advice. I can only help you decide whether the case deserves more research time.";
}

export function journalDumpRefusal(): string {
  return "I don't have your journal body, and I will not reconstruct it. Mentor memory uses process labels only — never private journal contents.";
}

export function signalOverrideRefusal(): string {
  return 'I will not ignore research rules or issue a buy/sell signal. Ask about evidence, invalidation, or process.';
}
