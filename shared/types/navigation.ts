export type RootStackParamList = {
  '(tabs)': undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  learn: undefined;
  practice: undefined;
  simulate: undefined;
  review: undefined;
  events: undefined;
  you: undefined;
};

export type AppRoutes =
  | '/'
  | '/learn'
  | '/practice'
  | '/simulate'
  | '/review'
  | '/events'
  | '/you'
  | '/search'
  | '/journal'
  | '/login'
  | '/register'
  | '/onboarding'
  | '/settings';

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
