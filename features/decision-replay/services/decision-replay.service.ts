import type {
  DecisionAction,
  DecisionRecord,
} from '@/features/decision-log/services/decision-log.service';
import type { JournalEntry } from '@/features/journal/types/journal.types';
import type { TraderMemory } from '@/features/decision/types/decision.types';

const ACTION_LABELS: Record<DecisionAction, string> = {
  viewed: 'Viewed setup',
  opened: 'Opened setup',
  researched: 'Researched',
  ignored: 'Ignored',
  skipped: 'Skipped',
  journaled: 'Journal written',
  invalidated: 'Invalidated',
  completed: 'Completed',
  brief_opened: "Opened Today's Brief",
  alert_triggered: 'Alert triggered',
  portfolio_reviewed: 'Portfolio reviewed',
  ai_opened: 'AI recommendation opened',
  replay_completed: 'Replay completed',
  checklist_done: 'Checklist completed',
  lab_opened: 'Decision Lab opened',
  lab_closed: 'Decision Lab closed',
};

function decisionActionLabel(action: DecisionAction): string {
  return ACTION_LABELS[action] ?? action;
}

export type ReplayRange = 'today' | 'yesterday' | 'week' | 'month' | 'setup' | 'symbol';

export interface ScoreSnapshot {
  at: number;
  researchValue?: number;
  decisionQuality?: number;
  processScore?: number;
  confidence?: number;
  risk?: 'low' | 'medium' | 'high';
  note?: string;
}

export interface ReplayCoachQuestion {
  id: string;
  question: string;
  promptHint: string;
}

export interface ReplayCoachInsight {
  headline: string;
  processNote: string;
  evidence: string[];
  emotionRisk: 'low' | 'medium' | 'high';
  dnaFit: 'aligned' | 'neutral' | 'mismatch';
  questions: ReplayCoachQuestion[];
}

export interface ReplayFrameContext {
  regime: string;
  portfolioNote?: string;
  mindsetNote?: string;
  journalSnippet?: string;
  checklistNote?: string;
  researchValueScore?: number;
  decisionQualityScore?: number;
}

export interface DecisionReplayFrame {
  id: string;
  at: number;
  action: DecisionAction;
  label: string;
  symbol: string;
  note?: string;
  record: DecisionRecord;
  context: ReplayFrameContext;
  coach: ReplayCoachInsight;
  scores: ScoreSnapshot;
  isKeyDecision: boolean;
}

export interface DecisionReplaySession {
  id: string;
  range: ReplayRange;
  title: string;
  subtitle: string;
  fromMs: number;
  toMs: number;
  symbolFilter?: string;
  frames: DecisionReplayFrame[];
  scoreEvolution: ScoreSnapshot[];
  learningInsights: LearningInsight[];
  processSummary: string;
}

export interface LearningInsight {
  id: string;
  statement: string;
  evidence: string[];
  category: 'strength' | 'risk' | 'habit' | 'regime';
}

export interface WeeklyGameTape {
  generatedAt: number;
  weekFromMs: number;
  weekToMs: number;
  bestDecision: string;
  worstDecision: string;
  mostDisciplined: string;
  mostEmotional: string;
  mostImprovedHabit: string;
  mostRepeatedMistake: string;
  lessonForNextWeek: string;
  evidenceNotes: string[];
  processScore: number;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function resolveReplayRange(
  range: ReplayRange,
  now = Date.now(),
  symbol?: string,
): { fromMs: number; toMs: number; title: string; subtitle: string; symbolFilter?: string } {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  switch (range) {
    case 'today':
      return {
        fromMs: todayStart,
        toMs: todayEnd,
        title: "Today's decisions",
        subtitle: 'Replay your process — not your P&L',
      };
    case 'yesterday': {
      const y = todayStart - 86_400_000;
      return {
        fromMs: y,
        toMs: endOfDay(y),
        title: "Yesterday's decisions",
        subtitle: 'What did your process look like?',
      };
    }
    case 'week':
      return {
        fromMs: now - 7 * 86_400_000,
        toMs: todayEnd,
        title: 'This week',
        subtitle: 'Seven days of decision footage',
      };
    case 'month':
      return {
        fromMs: now - 30 * 86_400_000,
        toMs: todayEnd,
        title: 'Last 30 days',
        subtitle: 'Habits over outcomes',
      };
    case 'setup':
    case 'symbol':
      return {
        fromMs: now - 90 * 86_400_000,
        toMs: todayEnd,
        title: symbol ? `${symbol} decision tape` : 'Setup tape',
        subtitle: 'Every meaningful action on this idea',
        symbolFilter: symbol,
      };
    default:
      return {
        fromMs: todayStart,
        toMs: todayEnd,
        title: 'Decision replay',
        subtitle: 'Process review',
      };
  }
}

function journalNear(
  journals: JournalEntry[],
  symbol: string,
  at: number,
): JournalEntry | undefined {
  const window = 36 * 60 * 60 * 1000;
  return journals.find((j) => {
    const traded = new Date(j.tradedAt || j.createdAt).getTime();
    return (
      j.symbol.toUpperCase() === symbol.toUpperCase() &&
      Math.abs(traded - at) < window
    );
  });
}

function dnaFitFor(
  record: DecisionRecord,
  memory?: TraderMemory,
): ReplayCoachInsight['dnaFit'] {
  if (!memory) return 'neutral';
  const hay = `${record.note ?? ''} ${record.symbol}`.toLowerCase();
  if (memory.bestSetups.some((b) => hay.includes(b.toLowerCase().split(/\s+/)[0] ?? ''))) {
    return 'aligned';
  }
  if (memory.weakestSetups.some((w) => hay.includes(w.toLowerCase().split(/\s+/)[0] ?? ''))) {
    return 'mismatch';
  }
  if (
    memory.favoriteAssets.some((a) => a.toUpperCase() === record.symbol.toUpperCase())
  ) {
    return 'aligned';
  }
  return 'neutral';
}

function emotionRiskFor(
  action: DecisionAction,
  journal?: JournalEntry,
): ReplayCoachInsight['emotionRisk'] {
  if (journal?.emotion === 'fomo' || journal?.emotion === 'greedy') return 'high';
  if (journal?.emotion === 'fearful') return 'medium';
  if (action === 'ignored' || action === 'skipped') return 'low';
  if (action === 'researched' && !journal) return 'medium';
  return 'low';
}

const KEY_ACTIONS: DecisionAction[] = [
  'researched',
  'skipped',
  'ignored',
  'journaled',
  'invalidated',
  'completed',
  'replay_completed',
];

export function buildCoachForRecord(
  record: DecisionRecord,
  memory?: TraderMemory,
  journal?: JournalEntry,
): ReplayCoachInsight {
  const label = decisionActionLabel(record.action);
  const dnaFit = dnaFitFor(record, memory);
  const emotionRisk = emotionRiskFor(record.action, journal);
  const evidence: string[] = [];

  if (record.regime) evidence.push(`Regime logged: ${record.regime.replace(/_/g, ' ')}`);
  if (record.setupScore != null) evidence.push(`Setup score at time: ${record.setupScore}`);
  if (record.researchValueScore != null) {
    evidence.push(`Research Value: ${record.researchValueScore}`);
  }
  if (record.decisionQualityScore != null) {
    evidence.push(`Decision Quality: ${record.decisionQualityScore}`);
  }
  if (record.invalidation) evidence.push(`Invalidation noted: ${record.invalidation}`);
  if (journal?.emotion) evidence.push(`Journal emotion tag: ${journal.emotion}`);
  if (journal?.lessonsLearned) evidence.push(`Lesson noted: ${journal.lessonsLearned.slice(0, 80)}`);
  if (memory?.typicalMistakes[0]) {
    evidence.push(`DNA watch-out: ${memory.typicalMistakes[0]}`);
  }

  let processNote = '';
  let headline = label;

  switch (record.action) {
    case 'ignored':
    case 'skipped':
      headline = `You chose not to engage ${record.symbol || 'this idea'}`;
      processNote =
        dnaFit === 'mismatch'
          ? 'Skipping a weak-spot pattern protects process — good selectivity.'
          : 'A skip is a decision. Check whether it matched your plan or avoided discomfort.';
      break;
    case 'researched':
      headline = `You researched ${record.symbol}`;
      processNote = record.invalidation
        ? 'Invalidation was named — process aligned with plan.'
        : 'You researched without a clear invalidation — confirmation may have been incomplete.';
      break;
    case 'journaled':
      headline = 'You closed the loop with a journal';
      processNote =
        journal?.emotion && journal.emotion !== 'neutral' && journal.emotion !== 'confident'
          ? `Emotion tagged “${journal.emotion}” — review whether feeling led the decision.`
          : 'Journaling converts outcomes into process feedback.';
      break;
    case 'invalidated':
      headline = `${record.symbol || 'Setup'} invalidated`;
      processNote = 'Respecting invalidation is elite process — not a loss narrative.';
      break;
    case 'brief_opened':
      headline = "Opened Today's Brief";
      processNote = 'Starting from the brief reduces random scanning and overtrading.';
      break;
    case 'ai_opened':
      headline = 'Opened AI recommendation';
      processNote = 'AI is a research aid — verify against checklist and DNA before acting.';
      break;
    case 'portfolio_reviewed':
      headline = 'Reviewed portfolio';
      processNote = 'Portfolio awareness before new research reduces concentration mistakes.';
      break;
    case 'replay_completed':
      headline = 'Completed a replay session';
      processNote = 'Practice without live risk — keep the habit without forcing trades.';
      break;
    default:
      processNote = 'Review whether this step matched your plan, risk rules, and Trading DNA.';
  }

  if (dnaFit === 'mismatch') {
    processNote += ' This sat outside your preferred DNA setups.';
  }

  const questions: ReplayCoachQuestion[] = [];
  if (record.action === 'ignored' || record.action === 'skipped') {
    questions.push({
      id: 'why-ignore',
      question: 'What made you ignore this setup?',
      promptHint: 'Plan filter, fear, or incomplete information?',
    });
  }
  if (record.action === 'researched' || record.action === 'opened') {
    questions.push({
      id: 'overlook',
      question: 'What information did you overlook?',
      promptHint: 'Calendar, correlation, or checklist item?',
    });
    questions.push({
      id: 'confidence',
      question: 'What would have increased your confidence?',
      promptHint: 'Confirmation, clearer invalidation, or regime fit?',
    });
  }
  questions.push({
    id: 'same-today',
    question: 'Would you make the same decision today?',
    promptHint: 'Process first — not whether price went your way.',
  });
  if (record.invalidation || record.action === 'invalidated') {
    questions.push({
      id: 'invalidation',
      question: 'What invalidated the idea?',
      promptHint: 'Name the level or condition, not the P&L.',
    });
  }

  return {
    headline,
    processNote,
    evidence: evidence.length ? evidence : ['Logged in your Decision Log'],
    emotionRisk,
    dnaFit,
    questions: questions.slice(0, 4),
  };
}

export function buildLearningInsights(
  records: DecisionRecord[],
  memory?: TraderMemory,
  journals: JournalEntry[] = [],
): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const skipped = records.filter((r) => r.action === 'skipped' || r.action === 'ignored');
  const researched = records.filter((r) => r.action === 'researched');
  const journaled = records.filter((r) => r.action === 'journaled');
  const highRvsSkipped = skipped.filter(
    (r) => (r.researchValueScore ?? r.setupScore ?? 0) >= 70,
  );

  const regimes = records.map((r) => r.regime).filter(Boolean);
  const regimeCounts = regimes.reduce<Record<string, number>>((acc, r) => {
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  const topRegime = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1])[0];

  if (topRegime && topRegime[1] >= 2) {
    insights.push({
      id: 'regime-strength',
      statement: `You were most active in ${topRegime[0].replace(/_/g, ' ')} conditions.`,
      evidence: [`${topRegime[1]} logged decisions under this regime`],
      category: 'regime',
    });
  }

  if (highRvsSkipped.length >= 2) {
    insights.push({
      id: 'skip-high-rvs',
      statement: 'You frequently ignore high research-value setups.',
      evidence: highRvsSkipped.slice(0, 3).map(
        (r) =>
          `${r.symbol || 'Idea'} skipped with RVS/score ${r.researchValueScore ?? r.setupScore}`,
      ),
      category: 'habit',
    });
  }

  if (skipped.length >= 3 && researched.length > 0) {
    insights.push({
      id: 'selectivity',
      statement: 'Selectivity is showing — skips outnumber forced research loops.',
      evidence: [`${skipped.length} skips/ignores vs ${researched.length} researched`],
      category: 'strength',
    });
  }

  const emotional = journals.filter(
    (j) => j.emotion === 'fomo' || j.emotion === 'greedy' || j.emotion === 'fearful',
  );
  if (emotional.length >= 2) {
    insights.push({
      id: 'emotion-tags',
      statement: 'Emotion tags appear often near journaled decisions.',
      evidence: emotional.slice(0, 3).map((j) => `${j.symbol}: ${j.emotion}`),
      category: 'risk',
    });
  }

  if (memory?.typicalMistakes[0] && journaled.length > 0) {
    insights.push({
      id: 'dna-mistake',
      statement: `Watch for a repeated DNA pattern: ${memory.typicalMistakes[0]}.`,
      evidence: [`From Trading DNA · ${journaled.length} journals in range`],
      category: 'habit',
    });
  }

  if (researched.length >= 4 && journaled.length === 0) {
    insights.push({
      id: 'no-journal',
      statement: 'You researched several ideas without journaling outcomes.',
      evidence: [`${researched.length} researched · 0 journals in this tape`],
      category: 'risk',
    });
  }

  if (!insights.length) {
    insights.push({
      id: 'keep-logging',
      statement: 'Keep logging decisions — insights need footage.',
      evidence: [`${records.length} events in this session`],
      category: 'habit',
    });
  }

  return insights.slice(0, 5);
}

export function buildScoreEvolution(records: DecisionRecord[]): ScoreSnapshot[] {
  return [...records]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r, i, arr) => {
      const researched = arr.slice(0, i + 1).filter((x) => x.action === 'researched').length;
      const skipped = arr
        .slice(0, i + 1)
        .filter((x) => x.action === 'skipped' || x.action === 'ignored').length;
      const journaled = arr.slice(0, i + 1).filter((x) => x.action === 'journaled').length;
      const total = i + 1;
      const processScore = Math.min(
        100,
        Math.round((skipped / total) * 30) +
          Math.round((journaled / total) * 40) +
          Math.round((researched / total) * 30) +
          (total > 3 ? 10 : 0),
      );
      return {
        at: r.createdAt,
        researchValue: r.researchValueScore ?? r.setupScore,
        decisionQuality: r.decisionQualityScore ?? r.setupScore,
        processScore,
        confidence: r.setupScore,
        risk: r.risk,
        note: decisionActionLabel(r.action),
      };
    });
}

export function buildDecisionReplaySession(input: {
  records: DecisionRecord[];
  range: ReplayRange;
  symbol?: string;
  memory?: TraderMemory;
  journals?: JournalEntry[];
  now?: number;
}): DecisionReplaySession {
  const { range, symbol, memory, journals = [], now = Date.now() } = input;
  const window = resolveReplayRange(range, now, symbol);
  let records = input.records.filter(
    (r) => r.createdAt >= window.fromMs && r.createdAt <= window.toMs,
  );
  if (window.symbolFilter) {
    records = records.filter(
      (r) => r.symbol.toUpperCase() === window.symbolFilter!.toUpperCase(),
    );
  }
  records = [...records].sort((a, b) => a.createdAt - b.createdAt);

  const frames: DecisionReplayFrame[] = records.map((record) => {
    const journal = journalNear(journals, record.symbol, record.createdAt);
    const coach = buildCoachForRecord(record, memory, journal);
    return {
      id: record.id,
      at: record.createdAt,
      action: record.action,
      label: decisionActionLabel(record.action),
      symbol: record.symbol,
      note: record.note,
      record,
      context: {
        regime: record.regime || 'unknown',
        portfolioNote: undefined,
        mindsetNote: memory?.notes[0],
        journalSnippet: journal?.notes?.slice(0, 120),
        checklistNote: record.invalidation
          ? `Invalidation: ${record.invalidation}`
          : undefined,
        researchValueScore: record.researchValueScore ?? record.setupScore,
        decisionQualityScore: record.decisionQualityScore ?? record.setupScore,
      },
      coach,
      scores: {
        at: record.createdAt,
        researchValue: record.researchValueScore ?? record.setupScore,
        decisionQuality: record.decisionQualityScore ?? record.setupScore,
        confidence: record.setupScore,
        risk: record.risk,
        note: decisionActionLabel(record.action),
      },
      isKeyDecision: KEY_ACTIONS.includes(record.action),
    };
  });

  const scoreEvolution = buildScoreEvolution(records);
  const learningInsights = buildLearningInsights(records, memory, journals);

  const processSummary =
    records.length === 0
      ? 'No decisions logged in this window. Open Today’s Brief and log skips — footage creates coaching.'
      : `${records.length} decision events · ${frames.filter((f) => f.isKeyDecision).length} key moments. Process over P&L.`;

  return {
    id: `replay-${range}-${window.fromMs}-${symbol ?? 'all'}`,
    range,
    title: window.title,
    subtitle: window.subtitle,
    fromMs: window.fromMs,
    toMs: window.toMs,
    symbolFilter: window.symbolFilter,
    frames,
    scoreEvolution,
    learningInsights,
    processSummary,
  };
}

export function buildWeeklyGameTape(
  records: DecisionRecord[],
  journals: JournalEntry[] = [],
  memory?: TraderMemory,
  now = Date.now(),
): WeeklyGameTape {
  const weekFromMs = now - 7 * 86_400_000;
  const week = records.filter((r) => r.createdAt >= weekFromMs && r.createdAt <= now);
  const session = buildDecisionReplaySession({
    records: week,
    range: 'week',
    memory,
    journals,
    now,
  });

  const skips = week.filter((r) => r.action === 'skipped' || r.action === 'ignored');
  const researchedNoJournal = week.filter(
    (r) =>
      r.action === 'researched' &&
      !week.some(
        (j) =>
          j.action === 'journaled' &&
          j.symbol.toUpperCase() === r.symbol.toUpperCase() &&
          j.createdAt >= r.createdAt,
      ),
  );
  const emotional = journals.filter((j) => {
    const t = new Date(j.tradedAt || j.createdAt).getTime();
    return (
      t >= weekFromMs &&
      (j.emotion === 'fomo' || j.emotion === 'greedy' || j.emotion === 'fearful')
    );
  });

  const best =
    skips.find((s) => (s.researchValueScore ?? 0) < 55) ??
    skips[0] ??
    week.find((r) => r.action === 'brief_opened') ??
    week[0];

  const worstRecord = researchedNoJournal[0];
  const worstJournal = emotional[0];

  const processScore =
    session.scoreEvolution[session.scoreEvolution.length - 1]?.processScore ?? 0;

  return {
    generatedAt: now,
    weekFromMs,
    weekToMs: now,
    bestDecision: best
      ? `${decisionActionLabel(best.action)}${best.symbol ? ` · ${best.symbol}` : ''} — protected attention`
      : 'Showed up and stayed selective',
    worstDecision: worstRecord
      ? `Researched without journaling${worstRecord.symbol ? ` · ${worstRecord.symbol}` : ''}`
      : worstJournal
        ? `Emotion-tagged journal · ${worstJournal.symbol} (${worstJournal.emotion})`
        : 'No clear process miss logged',
    mostDisciplined:
      skips.length >= 2
        ? `Skipped ${skips.length} ideas instead of forcing trades`
        : 'Opened the brief before hunting new tickets',
    mostEmotional:
      emotional.length > 0
        ? `${emotional[0]!.symbol} journal tagged ${emotional[0]!.emotion}`
        : 'No high-emotion tags this week — keep labeling honestly',
    mostImprovedHabit:
      week.some((r) => r.action === 'brief_opened')
        ? 'Starting from Today’s Brief'
        : week.some((r) => r.action === 'journaled')
          ? 'Closing loops with the journal'
          : 'Logging decisions at all',
    mostRepeatedMistake:
      researchedNoJournal.length >= 2
        ? 'Researching without journaling'
        : memory?.typicalMistakes[0] ?? 'None clear — keep logging',
    lessonForNextWeek:
      researchedNoJournal.length >= 1
        ? 'Journal every researched or skipped idea before opening a new tab.'
        : 'Protect the soft research cap — stop when fatigue says so.',
    evidenceNotes: session.learningInsights.flatMap((i) => i.evidence).slice(0, 6),
    processScore,
  };
}
