import { makeFlagshipLesson } from './lesson-factory';
import type { Lesson } from '../types/academy.types';

export const READINESS_LESSONS: Lesson[] = [
  makeFlagshipLesson({
    id: 'prep-simulation-vs-live',
    title: 'Simulation is not real money',
    description:
      'Paper books remove fear, fees, slippage, and taxes. A green simulation is not permission to trade live.',
    category: 'risk_management',
    difficulty: 'intermediate',
    durationMinutes: 10,
    track: 'decision',
    sortOrder: 9800,
    tags: ['simulation', 'readiness', 'risk', 'psychology'],
    searchKeywords: ['real money', 'live trading', 'broker', 'slippage', 'fees', 'readiness'],
    relatedLessonIds: ['risk-position-sizing', 'psych-discipline', 'dec-journaling'],
    conceptIds: ['sim-vs-live'],
    objectives: [
      'Name at least four differences between a paper book and a live account.',
      'Explain why simulated profit is not evidence of readiness.',
      'List process evidence you would want before risking savings.',
    ],
    whyItMatters:
      'Most people graduate from a simulator by looking at returns. That trains the wrong muscle. Live markets add emotion, incomplete fills, and irreversible loss.',
    explanation:
      'TradeAcademy uses labelled simulated capital so you can practice decisions without a broker. That is useful — and incomplete.\n\nIn simulation, a loss is a number. Live, a loss is rent, sleep, and identity. Size that felt easy on a $100,000 paper book can wreck a $5,000 live account.\n\nSlippage, spreads, commissions, borrow fees, and taxes are usually missing or simplified. Liquidity that looks infinite on a synthetic tape can vanish in a real open.\n\nReadiness, if the word is used at all, is about process evidence: written theses, defined invalidation, sized risk, journaled reviews, and surviving losing streaks without revenge. The app will never tell you that you are ready to trade real money.',
    examples: [
      'You followed a 1% risk rule through a 6% drawdown and still journaled each close.',
      'You skipped a setup because earnings were overnight and your book was already concentrated.',
    ],
    mistakes: [
      'Treating a high simulated return as skill.',
      'Increasing live size because the paper book “felt easy.”',
      'Ignoring that guest/demo data is labelled sample.',
    ],
    limitations: [
      'This lesson cannot measure your real-money temperament.',
      'No app can certify you for live trading.',
    ],
    whenItFails: [
      'When you skip journaling winners.',
      'When you only simulate calm, trending tapes.',
    ],
    exercise: {
      id: 'ex-sim-vs-live',
      kind: 'choose',
      prompt: 'Which statement is the honest one after a profitable paper month?',
      choices: [
        'I am ready to trade real money.',
        'The simulator proved my edge.',
        'I have process evidence in some areas and still lack live-market frictions.',
        'I should increase size immediately.',
      ],
      correctIndex: 2,
      explanation:
        'Profit on a labelled book is one chapter. Missing slippage, fear, and taxes means the evidence is incomplete.',
      conceptId: 'sim-vs-live',
      askEvidence: true,
    },
    quiz: [
      {
        id: 'prep-sim-q1',
        prompt: 'What does TradeAcademy refuse to say?',
        choices: [
          'That a thesis should include invalidation',
          'That you are ready to trade real money',
          'That simulated P/L is labelled',
          'That journaling is useful',
        ],
        correctIndex: 1,
        explanation: 'Readiness copy describes strengths and gaps. It never certifies live trading.',
      },
    ],
    takeaways: [
      'Simulation trains decisions. It does not prove live readiness.',
      'Process evidence matters more than paper profit.',
      'The honest next step is usually another loop: learn, practice, review.',
    ],
    journalHref: '/journal?from=academy',
  }),
];
