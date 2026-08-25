import { DATA_SOURCE_LABEL } from '@/features/markets/constants/data-source';
import { getDataFreshness } from '@/features/markets/constants/freshness';
import { EVIDENCE_LEVEL_COPY, NON_PREDICTION_COPY } from '@/shared/constants/trust-language';
import { formatPercent, formatPrice } from '@/shared/utils/format';

import { LOCAL_ANALYSIS_LABEL } from '../constants/ai-release';
import type { AiEnrichedContext, AiRequestContext } from '../types/ai.types';
import type {
  AiAnswerDepth,
  AiAnswerMode,
  AiEvidenceLevel,
  AiMentorMemoryUse,
  AiSourceAttribution,
  AiStructuredMentorAnswer,
  AiTrustPayload,
} from '../types/ai-trust.types';
import {
  capEvidenceLevel,
  evidenceLevelLabel,
  explainEvidenceQuality,
  looksLikeRepeatAsk,
} from './ai-evidence-level.service';
import {
  adviceRefusal,
  classifyMentorAsk,
  injectionRefusal,
  journalDumpRefusal,
  looksLikePromptInjection,
  predictionRefusal,
  sanitizeMentorOutput,
  signalOverrideRefusal,
} from './ai-safety.service';
import { runAiSelfCheck } from './ai-self-check.service';

export const AI_ANSWER_MODES: Array<{ value: AiAnswerMode; label: string }> = [
  { value: 'quick', label: 'Quick' },
  { value: 'deep_research', label: 'Deep research' },
  { value: 'coach', label: 'Coach' },
  { value: 'review', label: 'Review' },
  { value: 'explain', label: 'Explain' },
  { value: 'replay_coach', label: 'Replay coach' },
];

export function inferAiAnswerMode(prompt: string): AiAnswerMode {
  const lower = prompt.toLowerCase();
  if (/\breplay\b|blind chart|episode/.test(lower)) return 'replay_coach';
  if (/\bexplain\b|what is|how does|define /.test(lower)) return 'explain';
  if (/\breview\b|what changed|since last/.test(lower)) return 'review';
  if (/\bcoach\b|psychology|patience|invalidation discipline/.test(lower)) return 'coach';
  if (/\bdeep\b|full (research|pack)|research pack/.test(lower)) return 'deep_research';
  return 'quick';
}

function bulletCap(depth: AiAnswerDepth, mode: AiAnswerMode): number {
  if (depth === 'concise' || mode === 'quick') return 2;
  if (depth === 'detailed' || mode === 'deep_research') return 5;
  return 3;
}

function memoryUse(context?: AiEnrichedContext | null): AiMentorMemoryUse {
  const dna = context?.decisionIntelligence?.tradingDna;
  const di = context?.decisionIntelligence;
  const used: string[] = [];
  const notUsed = ['raw journal text', 'portfolio dollar values', 'other users’ DNA'];
  if (dna?.observationLine) used.push('Trading DNA process note (labels only)');
  if (dna?.strengths?.length) used.push('Recent process strengths');
  if (di?.psychologyReminder) used.push('Mentor setup process reminder');
  if (di?.tradingStyle) used.push('Stated research style');
  if (!used.length) {
    return {
      used: [],
      notUsed,
      disclosure:
        'No Trading DNA or Decision Log process notes are attached to this answer. I am not claiming to remember everything you have ever told me.',
    };
  }
  return {
    used,
    notUsed,
    disclosure: `Using: ${used.join('; ')}. Not using journal bodies, P&L, or a complete history dump.`,
  };
}

function sourcesFor(context?: AiEnrichedContext | null): AiSourceAttribution[] {
  const assembledAt = context?.assembledAt ?? Date.now();
  const freshness = getDataFreshness(context?.assembledAt);
  const dataKind = freshness === 'stale' || freshness === 'unknown' ? 'approximate' : 'delayed';
  const items: AiSourceAttribution[] = [
    {
      label: LOCAL_ANALYSIS_LABEL,
      timestamp: assembledAt,
      freshness,
      dataKind,
    },
  ];
  if (context?.quote) {
    items.push({
      label: `Quote · ${DATA_SOURCE_LABEL[dataKind]}`,
      timestamp: assembledAt,
      freshness,
      dataKind,
    });
  }
  if (context?.newsHeadlines?.length) {
    items.push({
      label: `Headlines (${context.newsHeadlines.length} attached)`,
      timestamp: assembledAt,
      freshness,
      dataKind: 'delayed',
    });
  }
  return items;
}

function knownFacts(context?: AiEnrichedContext | null, cap = 3): string[] {
  const lines: string[] = [];
  if (!context) {
    return ['No market context is attached to this session.'];
  }
  if (context.symbol && context.quote) {
    lines.push(
      `${context.symbol.toUpperCase()} last attached quote is ${formatPrice(context.quote.price)} (${formatPercent(context.quote.changePercent)}).`,
    );
  } else if (context.symbol) {
    lines.push(`${context.symbol.toUpperCase()} is in focus, but no quote is attached.`);
  } else {
    lines.push('No symbol quote is attached.');
  }
  if (context.trend) lines.push(`Structure label on the attached pack: ${context.trend}.`);
  if (context.rsi) lines.push(`RSI (14) on the attached pack: ${context.rsi.value} (${context.rsi.signal}).`);
  if (context.decisionIntelligence?.regimeLabel) {
    lines.push(`Decision regime context: ${context.decisionIntelligence.regimeLabel}.`);
  }
  const known = context.decisionIntelligence?.tradingDna?.known ?? [];
  for (const item of known.slice(0, 2)) {
    lines.push(`Known process evidence: ${item}.`);
  }
  return lines.slice(0, cap);
}

function unknownFacts(context?: AiEnrichedContext | null, cap = 3): string[] {
  const lines: string[] = [];
  if (!context?.quote) lines.push('A live or delayed last price is not available here.');
  if (!context?.newsHeadlines?.length) lines.push('No headlines are attached — I will not invent news.');
  if (context?.atr == null) lines.push('ATR / volatility context is missing.');
  if (!context?.decisionIntelligence?.tradingDna) {
    lines.push('Trading DNA labels are not attached (and I will not invent your history).');
  } else {
    for (const item of context.decisionIntelligence.tradingDna.unknown?.slice(0, 2) ?? []) {
      lines.push(item);
    }
  }
  if (!context?.supportLevels?.length) lines.push('No invalidation level is written on this pack.');
  if (!lines.length) lines.push('Unknowns always remain: undisclosed catalysts, broker tape, and your unwritten thesis.');
  return lines.slice(0, cap);
}

function evidenceLines(trust: AiTrustPayload | undefined, cap = 3): string[] {
  if (!trust) return ['No evidence pack was assembled.'];
  const present = trust.evidence.items.filter((i) => i.present).slice(0, cap);
  if (!present.length) return ['Evidence modules are empty — I will not fabricate prices, news, or citations.'];
  return present.map((item) => `${item.label}: ${item.detail}`);
}

function interpretationFor(
  mode: AiAnswerMode,
  level: AiEvidenceLevel,
  context?: AiEnrichedContext | null,
): string {
  if (level === 'insufficient') {
    return 'Interpretation: I do not know enough from this pack to rank research priority. Missing inputs are not a forecast.';
  }
  if (mode === 'coach' || mode === 'replay_coach') {
    const inference = context?.decisionIntelligence?.tradingDna?.inference?.[0];
    if (inference) {
      return `Interpretation: ${inference} This is an observed tendency from process events, not a diagnosis or a probability of profit.`;
    }
    return 'Interpretation: this is about process completeness (DQS-style checklist quality), not a probability of profit. RVS/DQS are not prediction odds.';
  }
  if (mode === 'review') {
    return 'Interpretation: research time should follow what actually changed in the attached pack — not a claim that the setup will work.';
  }
  if (context?.symbol) {
    return `Interpretation: ${context.symbol.toUpperCase()} may or may not deserve more attention. That is a research-priority call, never a forecast.`;
  }
  return 'Interpretation: what is known vs missing tells you whether to spend research time. It does not say the market will move.';
}

function whatChanged(trust: AiTrustPayload | undefined, mode: AiAnswerMode): string {
  if (mode !== 'review' && mode !== 'deep_research' && mode !== 'replay_coach') {
    return trust?.whyChanged?.reason ?? 'No prior snapshot is attached, so I cannot describe a change.';
  }
  return (
    trust?.whyChanged?.reason ??
    'No stored prior recommendation snapshot — I will not invent a “what changed” story.'
  );
}

function whatWouldChange(trust: AiTrustPayload | undefined, cap = 3): string[] {
  const flips = trust?.counterfactuals ?? [];
  if (!flips.length) {
    return [
      'This research priority would increase if independent confirmation appears on the attached pack.',
      'This assessment becomes weaker if freshness goes stale or invalidation stays unwritten.',
    ];
  }
  return flips.slice(0, cap).map((f) => `${f.label} — ${f.detail}`);
}

function suggestedAction(
  mode: AiAnswerMode,
  level: AiEvidenceLevel,
  context?: AiEnrichedContext | null,
): string {
  if (level === 'insufficient') {
    return 'Next research action: stop. Attach a quote or write invalidation before asking for a deeper read.';
  }
  if (mode === 'replay_coach') {
    return 'Next research action: stay on the freeze — do not peek at future candles. Name invalidation, then commit a research-time decision.';
  }
  if (mode === 'coach') {
    return 'Next research action: write one explicit invalidation sentence, then decide whether the case still deserves time.';
  }
  if (level === 'limited') {
    return 'Next research action: skip or watch — coverage is too thin for a deep block.';
  }
  if (context?.symbol) {
    return `Next research action: open ${context.symbol.toUpperCase()} only if you can name invalidation first. Otherwise skip.`;
  }
  return 'Next research action: pick one symbol, write invalidation, or skip. Protect attention.';
}

function mentorMemoryLine(context?: AiEnrichedContext | null): string | null {
  const line = context?.decisionIntelligence?.tradingDna?.observationLine?.trim();
  if (!line) return null;
  if (/remember everything/i.test(line)) return null;
  return line;
}

export function composeStructuredMentorAnswer(input: {
  prompt: string;
  context: AiRequestContext;
  trust?: AiTrustPayload;
  mode: AiAnswerMode;
  depth: AiAnswerDepth;
  evidenceLevel: AiEvidenceLevel;
  priorEvidenceLevel?: AiEvidenceLevel | null;
}): AiStructuredMentorAnswer {
  const enriched = input.context.enriched;
  const cap = bulletCap(input.depth, input.mode);
  const memory = memoryUse(enriched);
  const dnaLine = mentorMemoryLine(enriched);
  const conflicting = Boolean(
    enriched?.overallBias &&
      enriched.overallBias !== 'neutral' &&
      (enriched.rsi?.signal === 'overbought' || enriched.rsi?.signal === 'oversold'),
  );
  const repeatAsk = looksLikeRepeatAsk(input.prompt);
  const cappedLevel = capEvidenceLevel(
    input.evidenceLevel,
    input.priorEvidenceLevel ?? input.context.priorEvidenceLevel,
  );
  const quality = explainEvidenceQuality({
    context: enriched,
    evidence: input.trust?.evidence,
    level: cappedLevel,
    conflicting,
  });

  const whatIKnow = knownFacts(enriched, cap);
  if (quality.honestyLead) {
    whatIKnow.unshift(quality.honestyLead);
  }
  if (dnaLine && (input.mode === 'coach' || input.mode === 'replay_coach' || input.depth !== 'concise')) {
    whatIKnow.push(dnaLine);
  }

  const interpretation = interpretationFor(input.mode, cappedLevel, enriched);
  const askClass = classifyMentorAsk(input.prompt);

  const answer: AiStructuredMentorAnswer = {
    mode: input.mode,
    depth: input.depth,
    evidenceLevel: cappedLevel,
    whatIKnow,
    whatIDontKnow: unknownFacts(enriched, cap),
    evidence: evidenceLines(input.trust, cap),
    whyItMatters: interpretation,
    interpretation,
    whatChanged: whatChanged(input.trust, input.mode),
    whatWouldChange: whatWouldChange(input.trust, cap),
    suggestedResearchAction: suggestedAction(input.mode, cappedLevel, enriched),
    memoryUse: memory,
    sources: sourcesFor(enriched),
    evidenceWhy: quality.why,
    whatWouldImproveEvidence: quality.whatWouldImprove,
    honestyLead: quality.honestyLead,
    availableEvidence: quality.available,
    missingEvidence: quality.missing,
    selfCheck: {
      passed: true,
      downgraded: false,
      evidenceLevel: cappedLevel,
      flags: [],
    },
  };

  if (repeatAsk) {
    answer.whatIDontKnow = [
      'Asking again does not add new evidence, so I will not become more certain.',
      ...answer.whatIDontKnow,
    ].slice(0, cap + 1);
  }

  if (askClass === 'prompt_injection' || looksLikePromptInjection(input.prompt)) {
    answer.honestyLead = injectionRefusal();
    answer.whatIKnow = [injectionRefusal()];
    answer.interpretation =
      'Interpretation: injected instructions are not evidence. Safety rules stay in force.';
    answer.whyItMatters = answer.interpretation;
    answer.suggestedResearchAction =
      'Next research action: ask about evidence, invalidation, or process — not about overriding safety rules.';
  } else if (askClass === 'journal_dump') {
    answer.honestyLead = journalDumpRefusal();
    answer.whatIKnow = [journalDumpRefusal()];
    answer.interpretation =
      'Interpretation: private journal bodies are not attached and will not be reconstructed.';
    answer.whyItMatters = answer.interpretation;
    answer.suggestedResearchAction =
      'Next research action: use Journal in-app if you want to reread your own notes. Mentor will not dump them.';
  } else if (askClass === 'signal_override') {
    answer.honestyLead = signalOverrideRefusal();
    answer.whatIKnow = [signalOverrideRefusal()];
    answer.interpretation = 'Interpretation: a signal would be a forecast plus advice. I will not issue one.';
    answer.whyItMatters = answer.interpretation;
    answer.suggestedResearchAction =
      'Next research action: name invalidation on the attached pack, or skip.';
  } else if (askClass === 'prediction') {
    answer.honestyLead = predictionRefusal();
    answer.whatIKnow = [predictionRefusal(), ...answer.whatIKnow.filter((l) => l !== quality.honestyLead)].slice(
      0,
      cap + 1,
    );
    answer.interpretation =
      'Interpretation: unknown future prices stay unknown. Attached DQS/RVS-style process scores are not a probability of profit.';
    answer.whyItMatters = answer.interpretation;
    answer.suggestedResearchAction =
      'Next research action: write invalidation or skip. Do not treat this pack as a forecast.';
  } else if (askClass === 'investment_advice') {
    answer.honestyLead = adviceRefusal();
    answer.whatIKnow = [adviceRefusal(), ...answer.whatIKnow.filter((l) => l !== quality.honestyLead)].slice(
      0,
      cap + 1,
    );
    answer.interpretation =
      'Interpretation: buy/sell is not a research question I can answer. Research priority is whether the case deserves time.';
    answer.whyItMatters = answer.interpretation;
    answer.suggestedResearchAction =
      'Next research action: if you still want a process check, name invalidation first — or skip.';
  }

  const selfCheck = runAiSelfCheck({
    prompt: input.prompt,
    context: enriched,
    answer,
    evidenceLevel: cappedLevel,
    priorEvidenceLevel: input.priorEvidenceLevel ?? input.context.priorEvidenceLevel,
  });
  answer.selfCheck = selfCheck;
  answer.evidenceLevel = selfCheck.evidenceLevel;
  if (selfCheck.downgraded) {
    if (askClass === 'research') {
      answer.suggestedResearchAction = suggestedAction(input.mode, selfCheck.evidenceLevel, enriched);
    }
    if (selfCheck.flags.includes('stale_data')) {
      answer.whatIDontKnow = [
        'Attached inputs may be delayed or stale — I will not treat them as a live broker tape.',
        ...answer.whatIDontKnow,
      ].slice(0, cap + 1);
    }
    if (selfCheck.flags.includes('unsupported_claims') && askClass === 'research') {
      answer.whatIKnow = ['I do not have a usable quote, so I will not invent a price.'];
    }
    if (selfCheck.flags.includes('weak_evidence') && selfCheck.evidenceLevel === 'insufficient') {
      answer.honestyLead =
        answer.honestyLead ?? "I don't have enough current data to evaluate this responsibly.";
    }
  }
  return answer;
}

export function formatMentorAnswer(answer: AiStructuredMentorAnswer): string {
  const level = EVIDENCE_LEVEL_COPY[answer.evidenceLevel];
  const available = answer.availableEvidence ?? [];
  const missing = answer.missingEvidence ?? [];
  const qualityLines = [
    `Evidence quality: ${level.label.replace(/ evidence$/i, '')}.`,
    ...(available.length ? ['Available:', ...available.map((item) => `- ${item}`)] : ['Available:', '- none listed']),
    'Missing:',
    ...(missing.length ? missing.map((item) => `- ${item}`) : ['- no attached-pack gaps listed — catalysts can still be unknown']),
  ];

  const sections: Array<[string, string[]]> = [
    ['Evidence quality', qualityLines],
    ['Known', answer.whatIKnow],
    ['Unknown', answer.whatIDontKnow],
    ['Evidence', answer.evidence],
    ['Interpretation', [answer.interpretation || answer.whyItMatters]],
    ['What changed', [answer.whatChanged]],
    ['What would change the assessment', answer.whatWouldChange],
    ['Next research action', [answer.suggestedResearchAction]],
  ];

  const header = [
    answer.honestyLead,
    `${level.label}. ${level.meaning}`,
    answer.memoryUse.disclosure,
    answer.sources[0]
      ? `Source: ${answer.sources[0].label} · ${new Date(answer.sources[0].timestamp).toISOString()} · ${answer.sources[0].freshness} · ${DATA_SOURCE_LABEL[answer.sources[0].dataKind]}`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const body = sections
    .map(([title, lines]) => {
      const shown = answer.depth === 'concise' ? lines.slice(0, title === 'Evidence quality' ? 8 : 2) : lines;
      return `**${title}**\n${shown.map((l) => `• ${l}`).join('\n')}`;
    })
    .join('\n\n');

  const footer = [NON_PREDICTION_COPY, 'This is not a trade instruction, broker recommendation, or outcome guarantee.'].join(
    ' ',
  );

  return sanitizeMentorOutput([header, body, footer].join('\n\n'));
}

export { evidenceLevelLabel };
