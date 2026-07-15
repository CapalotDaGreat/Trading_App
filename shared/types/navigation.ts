export type RootStackParamList = {
  '(tabs)': undefined;
  modal: undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  markets: undefined;
  watchlist: undefined;
  portfolio: undefined;
  profile: undefined;
};

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
  onboarding: undefined;
};

export type MarketStackParamList = {
  '[symbol]': { symbol: string };
  chart: { symbol: string; interval?: string };
  analysis: { symbol: string };
};

export type SettingsStackParamList = {
  index: undefined;
  notifications: undefined;
  subscription: undefined;
  'trading-preferences': undefined;
  security: undefined;
  about: undefined;
};

export type AppRoutes =
  | '/'
  | '/markets'
  | '/watchlist'
  | '/portfolio'
  | '/profile'
  | '/login'
  | '/register'
  | '/onboarding'
  | '/settings'
  | '/settings/subscription';

export interface DeepLinkParams {
  symbol?: string;
  market?: string;
  screen?: string;
  referral?: string;
}

export interface NavigationState {
  currentRoute: AppRoutes | null;
  previousRoute: AppRoutes | null;
  params: Record<string, string | undefined>;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
