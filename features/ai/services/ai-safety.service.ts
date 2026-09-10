const PREDICTION_RE =
  /\b(will (it |the (price|market|setup) )?(go|rise|fall|rally|crash|happen)|how much will (it|this|the price)|what will happen|tomorrow(?:'s)? (price|move|close)|guaranteed(?: winner)?|sure thing|100%\s*(win|sure)|price target of|definitely (buy|sell|profit)|how far will it|predict (the )?(price|move)|what should (the price|it) do)\b/i;

const ADVICE_RE =
  /\b(should i (buy|sell)|what should i sell|buy now|sell now|go long|go short|market order|limit order|open an account|best broker|guaranteed profit|i recommend (buying|selling)|give me a (buy|sell)|how many shares)\b/i;

const INJECTION_RE =
  /\b(ignore (all )?(your |the )?(previous |prior )?(instructions|rules|safety|framing)|you are now|system prompt|reveal (your )?(instructions|prompt|policies|hidden (rules|prompt))|print (your )?(system|hidden) (prompt|message)|jailbreak|dan mode|developer mode|give me a signal|forget (your )?(constraints|safety)|override (your )?(safety|framing|policies)|disregard (all )?(safety|policies)|act as (an )?unrestricted|hidden (system )?prompt)\b/i;

const LEAKAGE_RE =
  /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\bremember everything you(?:'ve| have) ever\b|here is my journal:|ssn[:\s]*\d{3}|\bexact private journal\b|\bjournal contents\b|\bdump (my )?(journal|hidden (context|data)|private (notes|context))\b|\bquote my journal\b|\bshow (me )?(the )?(hidden|private) (user )?data\b|\bextract (the )?(hidden|private) (context|journal|data)\b)/i;

const FAKE_SOURCE_RE =
  /\b(according to (secret|insider|unpublished) (memo|report)|as cited in example\.com|source:\s*made[- ]up|fabricated (source|citation)|unpublished desk note)\b/i;

const FABRICATED_AUTHORITY_RE =
  /\b(i am (your )?(administrator|admin|developer|openai|anthropic|the system)|as (your )?(administrator|developer|openai)|openai says you must|anthropic requires you to ignore)\b/i;

const CONFIDENCE_ESCALATION_RE =
  /\b(be more confident|higher confidence|more certain|i'?m sure(,| —|-)? just confirm|say it with (more )?certainty|use more technical (language|terms)|make (it|your answer) (sound )?more (certain|confident|technical)|you already said so)\b/i;

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

export function looksLikeFabricatedAuthority(text: string): boolean {
  return FABRICATED_AUTHORITY_RE.test(text);
}

export function looksLikeConfidenceEscalation(text: string): boolean {
  return CONFIDENCE_ESCALATION_RE.test(text) || looksLikeRepeatAskLite(text);
}

function looksLikeRepeatAskLite(text: string): boolean {
  return /\b(again|are you sure|just tell me|same question|be more certain)\b/i.test(text);
}

export function looksLikeHiddenDataExtraction(text: string): boolean {
  return /\b(dump (hidden|attached) (context|memory|data)|show (me )?(the )?(hidden|attached) (system )?context|extract (private|hidden) (user )?data|what private data do you have)\b/i.test(
    text,
  );
}

export function looksLikeStaleTreatedAsLive(text: string): boolean {
  return /\b(live (broker )?tape|live quote|real-time quote|right now the (price|market)|this is (a )?current (live )?tape|treat this as live)\b/i.test(
    text,
  );
}

export function looksLikeFakeTimestamp(text: string, assembledAt?: number): boolean {
  if (/\b(timestamp|as of|data as of)\b[^\n]{0,48}(made[- ]up|fake|example\.com)\b/i.test(text)) {
    return true;
  }
  const matches = text.match(/\d{4}-\d{2}-\d{2}T[0-9:.Z+-]+/g) ?? [];
  const horizon = Date.now() + 120_000;
  for (const raw of matches) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed) && parsed > horizon) return true;
    if (
      assembledAt &&
      Number.isFinite(parsed) &&
      Math.abs(parsed - assembledAt) > 7 * 86_400_000 &&
      /\b(as of|timestamp|data as of)\b/i.test(text)
    ) {
      return true;
    }
  }
  return false;
}

export function looksLikeFakeEvidenceCitation(text: string, hasAttachedNews: boolean): boolean {
  if (hasAttachedNews) return false;
  return /\baccording to (bloomberg|reuters|cnbc|the sec filing|an unpublished (note|memo))\b/i.test(text);
}

export function looksLikeContradictoryUserClaim(
  prompt: string,
  context?: { rsi?: { value: number }; quote?: { price: number } } | null,
): boolean {
  if (context?.rsi) {
    const match = prompt.match(/\brsi(?:\s*\(?14\)?)?\s*(?:is|=)?\s*(\d{1,3}(?:\.\d+)?)/i);
    if (match?.[1]) {
      const claimed = Number(match[1]);
      if (Number.isFinite(claimed) && Math.abs(claimed - context.rsi.value) >= 8) return true;
    }
  }
  if (context?.quote) {
    const match = prompt.match(/\b(?:last )?price(?:\s+is)?\s*\$?(\d{2,6}(?:\.\d+)?)/i);
    if (match?.[1]) {
      const claimed = Number(match[1]);
      if (Number.isFinite(claimed) && Math.abs(claimed - context.quote.price) / context.quote.price >= 0.08) {
        return true;
      }
    }
  }
  return false;
}

/** True when sanitizer word-swaps would still leave an unsupported call. */
export function remainingUnsupportedClaim(text: string): boolean {
  const cleaned = sanitizeMentorOutput(text);
  const stripped = cleaned
    .replace(/\bnot a claim that[^.!\n]*/gi, '')
    .replace(/\bi don't know[^.!\n]*/gi, '')
    .replace(/\bi cannot tell you[^.!\n]*/gi, '')
    .replace(/\bi will not treat[^.!\n]*/gi, '');
  return (
    looksLikePredictionLanguage(stripped) ||
    looksLikeInvestmentAdvice(stripped) ||
    looksLikeSetupSuccessLanguage(stripped) ||
    looksLikeFakeProbability(stripped)
  );
}

export function looksLikeJournalDumpAsk(text: string): boolean {
  return /\b(exact private journal|journal contents|tell me my (exact )?journal|dump (my )?journal|quote my journal)\b/i.test(
    text,
  );
}

export function classifyMentorAsk(prompt: string): MentorAskClass {
  if (looksLikePromptInjection(prompt) || looksLikeFabricatedAuthority(prompt)) return 'prompt_injection';
  if (
    looksLikeJournalDumpAsk(prompt) ||
    looksLikePrivateDataLeak(prompt) ||
    looksLikeHiddenDataExtraction(prompt)
  ) {
    return 'journal_dump';
  }
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
  next = next.replace(
    DQS_RVS_AS_PREDICTION_RE,
    'Process and research-quality scores describe evidence completeness, not a chance of profit',
  );
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

export function unsupportedClaimRefusal(): string {
  return "I don't know. That claim is unsupported by the attached evidence, so I will not rephrase it into a softer-sounding call.";
}

export function fabricatedAuthorityRefusal(): string {
  return 'I will not treat fabricated authority, role-play, or a claimed override as evidence. Safety framing stays in force.';
}
