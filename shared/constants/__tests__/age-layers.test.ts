import { AGE_LAYERS } from '@/shared/constants/age-layers';
import { LEGAL_DOCUMENT_TEXT } from '@/shared/legal';

import appStore from '../../../store/metadata/app-store.json';
import playStore from '../../../store/metadata/play-store.json';

describe('age layers stay distinct', () => {
  it('keeps store content ratings separate from 18+ account eligibility', () => {
    expect(AGE_LAYERS.storeContentRatingIos).toBe('12+');
    expect(AGE_LAYERS.storeContentRatingAndroid).toBe('Teen');
    expect(AGE_LAYERS.accountMinimumYears).toBe(18);
    expect(AGE_LAYERS.guestRequiresAccountAge).toBe(false);
    expect(AGE_LAYERS.storeRatingIsNotPermissionToTrade).toBe(true);

    expect(appStore.contentRating).toBe(AGE_LAYERS.storeContentRatingIos);
    expect(playStore.contentRating).toBe(AGE_LAYERS.storeContentRatingAndroid);
    expect(appStore.accountEligibility).toMatch(/18\+/);
    expect(playStore.accountEligibility).toMatch(/18\+/);
    expect(appStore.contentRatingNote.toLowerCase()).toContain('not permission to trade');
    expect(playStore.contentRatingNote.toLowerCase()).toContain('not permission to trade');
  });

  it('repeats the same split in Terms and Privacy', () => {
    expect(LEGAL_DOCUMENT_TEXT.terms).toContain('18');
    expect(LEGAL_DOCUMENT_TEXT.terms).toContain('12+');
    expect(LEGAL_DOCUMENT_TEXT.privacy).toContain('Teen');
    expect(LEGAL_DOCUMENT_TEXT.privacy.toLowerCase()).toContain('guest/demo');
    expect(LEGAL_DOCUMENT_TEXT.privacy.toLowerCase()).toContain(
      'does **not** tell anyone that a 12+ store rating authorises trading',
    );
  });
});
