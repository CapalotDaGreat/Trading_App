export type TradingStyle = 'day_trading' | 'swing' | 'position' | 'scalping' | 'long_term';

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type AuthProvider = 'email' | 'google' | 'apple' | 'anonymous';

export interface UserPreferences {
  defaultMarket: string;
  tradingStyle: TradingStyle;
  riskTolerance: RiskTolerance;
  experienceLevel: ExperienceLevel;
  currency: string;
  timezone: string;
  notificationsEnabled: boolean;
  priceAlertsEnabled: boolean;
  aiInsightsEnabled: boolean;
  biometricAuthEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  provider: AuthProvider;
  createdAt: number;
  updatedAt: number;
  preferences: UserPreferences;
  subscriptionTier: 'free' | 'premium' | 'pro';
  onboardingCompleted: boolean;
}

export interface UserSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAnonymous: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultMarket: 'stocks',
  tradingStyle: 'swing',
  riskTolerance: 'moderate',
  experienceLevel: 'intermediate',
  currency: 'USD',
  timezone: 'America/New_York',
  notificationsEnabled: true,
  priceAlertsEnabled: true,
  aiInsightsEnabled: true,
  biometricAuthEnabled: false,
};

export const TRADING_STYLE_LABELS: Record<TradingStyle, string> = {
  day_trading: 'Day Trading',
  swing: 'Swing Trading',
  position: 'Position Trading',
  scalping: 'Scalping',
  long_term: 'Long-Term Investing',
};

export const RISK_TOLERANCE_LABELS: Record<RiskTolerance, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  professional: 'Professional',
};
