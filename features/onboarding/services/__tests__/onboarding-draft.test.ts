import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  onboardingDraftStorageKey,
  saveOnboardingDraft,
} from '../onboarding-draft.service';

describe('onboarding draft persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and resumes partial drafts per user', async () => {
    await saveOnboardingDraft('user-a', {
      timeBudgetMinutes: 45,
      selectedUniverse: ['nvda', 'spy', 'aapl'],
      currentStep: 1,
    });

    await expect(loadOnboardingDraft('user-a')).resolves.toMatchObject({
      uid: 'user-a',
      timeBudgetMinutes: 45,
      selectedUniverse: ['NVDA', 'SPY', 'AAPL'],
      currentStep: 1,
    });
    await expect(loadOnboardingDraft('user-b')).resolves.toMatchObject({
      uid: 'user-b',
      currentStep: 0,
    });
  });

  it('recovers from corrupt storage and clears only the requested draft', async () => {
    await AsyncStorage.setItem(onboardingDraftStorageKey('user-a'), '{broken');
    await saveOnboardingDraft('user-b', { currentStep: 1 });

    await expect(loadOnboardingDraft('user-a')).resolves.toMatchObject({
      uid: 'user-a',
      currentStep: 0,
    });
    await clearOnboardingDraft('user-a');
    expect(await AsyncStorage.getItem(onboardingDraftStorageKey('user-b'))).not.toBeNull();
  });

  it('serializes concurrent partial updates without dropping fields', async () => {
    await Promise.all([
      saveOnboardingDraft('user-a', { timeBudgetMinutes: 20 }),
      saveOnboardingDraft('user-a', { activationGoal: 'improve_review_habit' }),
      saveOnboardingDraft('user-a', { currentStep: 1 }),
    ]);

    await expect(loadOnboardingDraft('user-a')).resolves.toMatchObject({
      timeBudgetMinutes: 20,
      activationGoal: 'improve_review_habit',
      currentStep: 1,
    });
  });
});
