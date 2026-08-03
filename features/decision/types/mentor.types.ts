export interface MentorDailyBriefing {
  /** Primary coaching line for Today. */
  headline: string;
  /** Supporting context — never market prediction. */
  detail: string;
  /** Concrete process objective for today. */
  todaysFocus: string;
  /** Improvement target derived from repeated mistakes. */
  improveNext: string;
  /** Repeated mistake to watch for. */
  repeatingMistake: string;
}

export interface MentorWeeklyCoaching {
  mostImprovedHabit: string;
  mostCommonMistake: string;
  greatestStrength: string;
  challenge: string;
  academyRecommendation: {
    lessonId: string;
    title: string;
    reason: string;
  } | null;
  replayRecommendation: {
    href: string;
    label: string;
    reason: string;
  };
}

export interface MentorTradingIdentity {
  styleLabel: string;
  strengths: string[];
  weaknesses: string[];
  preferredRegimes: string[];
  riskTolerance: string;
}

export interface MentorCoachingReference {
  id:
    | 'passport'
    | 'replay'
    | 'academy'
    | 'journal'
    | 'decisionGraph'
    | 'dna'
    | 'heatmap'
    | 'decisionLog';
  label: string;
  reason: string;
  href: string;
}

export interface TradingMentorBrief {
  generatedAt: number;
  daily: MentorDailyBriefing;
  weekly: MentorWeeklyCoaching;
  currentGoal: string;
  learningStreakDays: number;
  loopStepsCompletedToday: number;
  identity: MentorTradingIdentity;
  processScoreWeek: number;
  regimeLabel: string;
  evidenceNotes: string[];
  /** Deep links into Passport, Replay, Academy, Journal, Graph, DNA, Heatmap, Log. */
  coachingReferences: MentorCoachingReference[];
}
