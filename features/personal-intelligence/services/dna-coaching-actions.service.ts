import type {
  DnaCoachingAction,
  TradingDnaProfile,
  TradingDnaTraitId,
} from '../types/personal-intelligence.types';

const ACTION_MAP: Record<TradingDnaTraitId, Array<Omit<DnaCoachingAction, 'id' | 'traitId'>>> = {
  evidenceDiscipline: [
    {
      kind: 'checklist',
      title: 'Run the evidence checklist',
      detail: 'Complete structure confirmation before depth.',
      href: '/academy/checklist/pre-trade-checklist',
    },
    {
      kind: 'academy',
      title: 'Evidence before depth',
      detail: 'Academy lesson on gathering decision evidence.',
      href: '/academy',
    },
  ],
  riskAwareness: [
    {
      kind: 'journal',
      title: 'Journal: risk defined?',
      detail: 'Write the risk case before the next research block.',
      href: '/journal',
    },
    {
      kind: 'mentor',
      title: 'Mentor risk challenge',
      detail: 'Ask Mentor to stress-test your risk framing.',
      href: '/decision/mentor',
    },
  ],
  patience: [
    {
      kind: 'replay',
      title: 'Patience replay',
      detail: 'Practice waiting with future candles hidden.',
      href: '/decision/replay-tv',
    },
    {
      kind: 'journal',
      title: 'Why I waited',
      detail: 'Log one deliberate skip and what evidence was missing.',
      href: '/journal',
    },
  ],
  thesisClarity: [
    {
      kind: 'journal',
      title: 'One-sentence thesis',
      detail: 'Write the thesis before opening more charts.',
      href: '/journal',
    },
    {
      kind: 'academy',
      title: 'Thesis clarity lesson',
      detail: 'Academy path for decision clarity.',
      href: '/academy',
    },
  ],
  invalidationDiscipline: [
    {
      kind: 'replay',
      title: 'Invalidation mastery',
      detail: 'Replay focused on what would change your mind.',
      href: '/decision/replay-tv',
    },
    {
      kind: 'academy',
      title: 'How to define invalidation',
      detail: 'Learn a calm invalidation template.',
      href: '/academy',
    },
    {
      kind: 'journal',
      title: 'What would change my mind?',
      detail: 'Journal exercise before the next deep research.',
      href: '/journal',
    },
  ],
  processConsistency: [
    {
      kind: 'checklist',
      title: 'Daily process checklist',
      detail: 'One full brief → research/skip → journal loop.',
      href: '/academy/checklist/pre-trade-checklist',
    },
    {
      kind: 'mentor',
      title: 'Consistency challenge',
      detail: 'Ask Mentor for one cadence commitment.',
      href: '/decision/mentor',
    },
  ],
  emotionalAwareness: [
    {
      kind: 'journal',
      title: 'Name the feeling',
      detail: 'One psychology note before the next session.',
      href: '/journal',
    },
    {
      kind: 'mentor',
      title: 'Emotional awareness check-in',
      detail: 'Mentor reflection without clinical diagnosis.',
      href: '/decision/mentor',
    },
  ],
  fomoResistance: [
    {
      kind: 'replay',
      title: 'FOMO resistance drill',
      detail: 'Practice passing on urgency without evidence.',
      href: '/decision/decision-replay',
    },
    {
      kind: 'journal',
      title: 'Urgency audit',
      detail: 'What felt urgent — and what evidence was missing?',
      href: '/journal',
    },
  ],
  overtradingResistance: [
    {
      kind: 'mentor',
      title: 'Attention budget challenge',
      detail: 'Cap research symbols before journaling.',
      href: '/decision/mentor',
    },
    {
      kind: 'journal',
      title: 'Close two loops',
      detail: 'Journal or skip before a fourth symbol.',
      href: '/journal',
    },
  ],
  adaptability: [
    {
      kind: 'mentor',
      title: 'Revise the thesis',
      detail: 'When evidence changes, update the case with Mentor.',
      href: '/decision/mentor',
    },
    {
      kind: 'replay',
      title: 'Adapt on the tape',
      detail: 'Replay a regime shift and update the case.',
      href: '/decision/decision-replay',
    },
  ],
  researchEfficiency: [
    {
      kind: 'mentor',
      title: 'Time-budget coaching',
      detail: 'Ask Mentor to help allocate today’s research minutes.',
      href: '/decision/mentor',
    },
    {
      kind: 'checklist',
      title: 'High-value research filter',
      detail: 'Only deepen ideas that clear research value.',
      href: '/decision/radar',
    },
  ],
  reflectionQuality: [
    {
      kind: 'journal',
      title: 'New reflection',
      detail: 'Close one researched or skipped case today.',
      href: '/journal',
    },
    {
      kind: 'replay',
      title: 'Process Tape reflect',
      detail: 'Finish one reflection on Review.',
      href: '/(tabs)/review',
    },
  ],
  learningMomentum: [
    {
      kind: 'academy',
      title: 'Continue learning',
      detail: 'One lesson with practice, mapped to your growth edge.',
      href: '/academy',
    },
    {
      kind: 'replay',
      title: 'Practice this next',
      detail: 'Blind replay episode for process reps.',
      href: '/decision/replay-tv',
    },
  ],
};

export function buildDnaCoachingActions(input: {
  dna: TradingDnaProfile;
  maxActions?: number;
}): DnaCoachingAction[] {
  const maxActions = input.maxActions ?? 5;
  const growthTraits = [...input.dna.traits]
    .filter((t) => t.status === 'scored' && t.score != null)
    .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
    .slice(0, 3);

  const actions: DnaCoachingAction[] = [];
  for (const trait of growthTraits) {
    for (const template of ACTION_MAP[trait.id] ?? []) {
      actions.push({
        ...template,
        id: `${trait.id}-${template.kind}`,
        traitId: trait.id,
      });
    }
  }
  return actions.slice(0, maxActions);
}
