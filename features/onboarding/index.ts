export { completeOnboarding } from './services/onboarding-completion.service';
export {
  finishActivation,
  finishDemoGuide,
  normalizeActivationInput,
  persistActivationPersonalization,
} from './services/onboarding-activation.service';
export {
  clearOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from './services/onboarding-draft.service';
export { migrateOnboardingDraft, resolveOnboarding } from './services/onboarding-migration.service';
export { reconcileOnboarding } from './services/onboarding-reconciliation.service';
export { resolveRootRedirect } from './services/onboarding-routing.service';
export { useOnboardingStore } from './stores/onboarding.store';
export type {
  OnboardingCompletionInput,
  OnboardingDraft,
  OnboardingEvidence,
  OnboardingResolution,
} from './types/onboarding.types';
