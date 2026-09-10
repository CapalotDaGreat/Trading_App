/**
 * Age layers for TradeAcademy. These are different rules — do not collapse them.
 * Store ratings are content suitability, not permission to trade or to open a cloud account.
 */
export const AGE_LAYERS = {
  storeContentRatingIos: '12+',
  storeContentRatingAndroid: 'Teen',
  accountMinimumYears: 18,
  guestRequiresAccountAge: false,
  storeRatingIsNotPermissionToTrade: true,
} as const;
